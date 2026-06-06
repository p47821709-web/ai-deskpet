import logging
from datetime import datetime
from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.models.memory import Memory
from app.schemas.memory import (
    MemoryCreate,
    MemoryUpdate,
    MemorySearchRequest,
    MemoryResponse,
    MemorySearchResult,
)

logger = logging.getLogger(__name__)


# ── Simple keyword-based relevance scoring ───────────────────
# (No external embedding service required)

_STOP_WORDS: set[str] = {
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'out', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'and', 'but', 'or', 'if', 'because', 'about', 'up',
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人',
    '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
    '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她',
}

_MEMORY_TYPE_WEIGHTS: dict[str, float] = {
    'episodic': 1.2,
    'semantic': 1.0,
    'procedural': 0.8,
}

_CATEGORY_WEIGHTS: dict[str, float] = {
    'user_name': 2.0,
    'user_interest': 1.5,
    'user_preference': 1.5,
    'chat_history': 1.0,
    'general': 0.8,
}


class MemoryService:
    '''Long-term memory service with CRUD and keyword-based search.'''

    def __init__(self, db: Session) -> None:
        self.db: Session = db
        logger.debug('MemoryService initialized')

    # ── CRUD ─────────────────────────────────────────────────

    def create_memory(
        self,
        user_id: str,
        data: MemoryCreate,
    ) -> Memory:
        '''Create a new memory.'''
        memory = Memory(
            pet_id=data.pet_id,
            user_id=user_id,
            memory_type=data.memory_type or 'semantic',
            content=data.content.strip(),
            category=data.category or 'general',
            importance=data.importance,
            related_entities=data.related_entities,
        )
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)

        logger.info(
            'Memory created: id=%s, type=%s, category=%s, importance=%.2f',
            memory.id, memory.memory_type, memory.category, memory.importance,
        )
        return memory

    def get_memory(self, memory_id: str) -> Optional[Memory]:
        '''Get a single memory by ID.'''
        memory = (
            self.db.query(Memory)
            .filter(Memory.id == memory_id)
            .first()
        )
        if memory:
            # Increment recall count
            memory.recall_count = (memory.recall_count or 0) + 1
            memory.last_recalled_at = datetime.now()
            self.db.commit()
            logger.debug('Memory recalled: id=%s (count=%d)', memory.id, memory.recall_count)
        return memory

    def list_memories(
        self,
        pet_id: str,
        category: Optional[str] = None,
        memory_type: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Memory], int]:
        '''List memories for a pet with optional filters and pagination.'''
        query = self.db.query(Memory).filter(Memory.pet_id == pet_id)

        if category:
            query = query.filter(Memory.category == category)
        if memory_type:
            query = query.filter(Memory.memory_type == memory_type)

        total: int = query.count()
        memories: list[Memory] = (
            query
            .order_by(desc(Memory.importance), desc(Memory.created_at))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return memories, total

    def update_memory(
        self,
        memory_id: str,
        data: MemoryUpdate,
    ) -> Optional[Memory]:
        '''Update an existing memory. Returns None if not found.'''
        memory = self.db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            logger.warning('Memory not found for update: id=%s', memory_id)
            return None

        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(memory, key, value)

        self.db.commit()
        self.db.refresh(memory)

        logger.info('Memory updated: id=%s, fields=%s', memory_id, list(update_data.keys()))
        return memory

    def delete_memory(self, memory_id: str) -> bool:
        '''Delete a memory. Returns True if deleted, False if not found.'''
        memory = self.db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            logger.warning('Memory not found for deletion: id=%s', memory_id)
            return False

        self.db.delete(memory)
        self.db.commit()
        logger.info('Memory deleted: id=%s', memory_id)
        return True

    # ── Search ──────────────────────────────────────────────

    def search_memories(
        self,
        request: MemorySearchRequest,
    ) -> list[MemorySearchResult]:
        '''Search memories by keyword relevance scoring.'''
        query = self.db.query(Memory).filter(Memory.pet_id == request.pet_id)

        if request.category:
            query = query.filter(Memory.category == request.category)
        if request.memory_type:
            query = query.filter(Memory.memory_type == request.memory_type)

        all_memories: list[Memory] = query.all()
        if not all_memories:
            return []

        # Tokenize query
        query_tokens: set[str] = self._tokenize(request.query)

        # Score each memory
        scored: list[tuple[float, Memory]] = []
        for memory in all_memories:
            score: float = self._compute_relevance(memory, query_tokens)
            if score > 0:
                scored.append((score, memory))

        # Sort by score descending, limit top_k
        scored.sort(key=lambda x: -x[0])
        top_k: list[tuple[float, Memory]] = scored[:request.top_k]

        # Build results
        results: list[MemorySearchResult] = []
        for score, memory in top_k:
            # Update recall stats
            memory.recall_count = (memory.recall_count or 0) + 1
            memory.last_recalled_at = datetime.now()

            results.append(MemorySearchResult(
                memory=MemoryResponse(
                    id=memory.id,
                    pet_id=memory.pet_id,
                    memory_type=memory.memory_type,
                    content=memory.content,
                    importance=memory.importance,
                    category=memory.category,
                    related_entities=memory.related_entities,
                    recall_count=memory.recall_count,
                    created_at=memory.created_at.isoformat() if memory.created_at else '',
                    last_recalled_at=memory.last_recalled_at.isoformat() if memory.last_recalled_at else None,
                ),
                relevance=round(score, 4),
            ))

        self.db.commit()
        logger.info(
            'Memory search: query="%s", pet_id=%s, found=%d results',
            request.query, request.pet_id, len(results),
        )
        return results

    # ── Convenience helpers ─────────────────────────────────

    def save_user_name(self, user_id: str, pet_id: str, name: str) -> Memory:
        '''Save or update the user's preferred name.'''
        existing = (
            self.db.query(Memory)
            .filter(
                Memory.pet_id == pet_id,
                Memory.category == 'user_name',
            )
            .first()
        )
        if existing:
            existing.content = name
            existing.importance = 1.0
            self.db.commit()
            self.db.refresh(existing)
            return existing

        return self.create_memory(user_id, MemoryCreate(
            pet_id=pet_id,
            memory_type='semantic',
            content=name,
            category='user_name',
            importance=1.0,
            related_entities=['user'],
        ))

    def save_user_interest(
        self, user_id: str, pet_id: str, interest: str, importance: float = 0.7,
    ) -> Memory:
        '''Save a user interest. Avoids duplicate entries.'''
        existing = (
            self.db.query(Memory)
            .filter(
                Memory.pet_id == pet_id,
                Memory.category == 'user_interest',
                Memory.content == interest,
            )
            .first()
        )
        if existing:
            existing.importance = max(existing.importance, importance)
            existing.recall_count = (existing.recall_count or 0) + 1
            self.db.commit()
            self.db.refresh(existing)
            return existing

        return self.create_memory(user_id, MemoryCreate(
            pet_id=pet_id,
            memory_type='semantic',
            content=interest,
            category='user_interest',
            importance=importance,
            related_entities=['user'],
        ))

    def save_chat_memory(
        self, user_id: str, pet_id: str, summary: str, importance: float = 0.6,
    ) -> Memory:
        '''Save a summarized chat history entry.'''
        return self.create_memory(user_id, MemoryCreate(
            pet_id=pet_id,
            memory_type='episodic',
            content=summary,
            category='chat_history',
            importance=importance,
        ))

    def save_user_preference(
        self, user_id: str, pet_id: str, preference: str, importance: float = 0.8,
    ) -> Memory:
        '''Save a user preference.'''
        return self.create_memory(user_id, MemoryCreate(
            pet_id=pet_id,
            memory_type='semantic',
            content=preference,
            category='user_preference',
            importance=importance,
        ))

    # ── Internal: Scoring ───────────────────────────────────

    def _compute_relevance(self, memory: Memory, query_tokens: set[str]) -> float:
        '''Compute relevance score between a memory and query tokens.'''
        if not query_tokens:
            return 0.0

        memory_tokens: set[str] = self._tokenize(memory.content)
        if not memory_tokens:
            return 0.0

        # Token overlap (Jaccard similarity)
        intersection: set[str] = query_tokens & memory_tokens
        union: set[str] = query_tokens | memory_tokens
        if not union:
            return 0.0

        token_score: float = len(intersection) / len(union)

        # Also check category name and related entities
        category_tokens: set[str] = self._tokenize(memory.category or '')
        entity_text: str = ' '.join(memory.related_entities or [])
        entity_tokens: set[str] = self._tokenize(entity_text)
        extra_tokens: set[str] = category_tokens | entity_tokens
        extra_overlap: int = len(query_tokens & extra_tokens)
        extra_score: float = extra_overlap * 0.1  # small bonus

        # Boost by importance
        importance_boost: float = 1.0 + memory.importance * 0.5

        # Boost by category weight
        category_weight: float = _CATEGORY_WEIGHTS.get(memory.category or 'general', 1.0)

        # Boost by memory type weight
        type_weight: float = _MEMORY_TYPE_WEIGHTS.get(memory.memory_type, 1.0)

        # Recency boost (memories from last 24h get a bonus)
        recency_boost: float = 1.0
        if memory.created_at:
            age_hours: float = (datetime.now() - memory.created_at).total_seconds() / 3600
            if age_hours < 24:
                recency_boost = 1.0 + (24 - age_hours) / 24 * 0.3

        final_score: float = (
            (token_score + extra_score)
            * importance_boost
            * category_weight
            * type_weight
            * recency_boost
        )

        return final_score

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        '''Split text into normalized tokens for comparison.'''
        if not text:
            return set()

        text = text.lower().strip()

        # Split Chinese characters into individual characters
        tokens: list[str] = []
        current_word: list[str] = []

        for char in text:
            if '\u4e00' <= char <= '\u9fff' or '\u3000' <= char <= '\u303f':
                # Chinese character — emit individual characters for matching
                if current_word:
                    tokens.append(''.join(current_word))
                    current_word = []
                tokens.append(char)
            elif char.isalnum() or char in "'-":
                current_word.append(char)
            else:
                if current_word:
                    tokens.append(''.join(current_word))
                    current_word = []

        if current_word:
            tokens.append(''.join(current_word))

        # Remove stop words
        return {t for t in tokens if len(t) > 0 and t not in _STOP_WORDS}

