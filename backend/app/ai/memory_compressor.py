import logging
from typing import Optional

logger = logging.getLogger(__name__)


class MemoryCompressor:
    '''
    Compresses and summarizes memories to prevent unbounded growth.
    Uses heuristic-based merging (no external AI dependency).
    '''

    def __init__(self, max_memories_per_category: int = 100) -> None:
        self.max_per_category: int = max_memories_per_category
        logger.info(
            'MemoryCompressor initialized: max_per_category=%d',
            self.max_per_category,
        )

    def compress(self, memories: list) -> list:
        '''
        Compress a list of memories by merging similar low-importance entries.
        Returns a list of (keep: bool, merged_content: str | None) tuples.
        '''
        if not memories:
            return []

        # Sort by importance ascending (process low-importance first)
        sorted_mems = sorted(memories, key=lambda m: m.importance if hasattr(m, 'importance') else 0.5)

        results: list = []
        merged_count: int = 0

        for i, memory in enumerate(sorted_mems):
            importance = memory.importance if hasattr(memory, 'importance') else 0.5
            content = memory.content if hasattr(memory, 'content') else ''

            # Low-importance memories: try to merge with similar ones
            if importance < 0.3 and content:
                merged = self._try_merge(content, sorted_mems[i + 1:i + 5])
                if merged:
                    merged_count += 1
                    results.append((False, merged))  # Drop original, merged elsewhere
                    continue

            # High-importance or couldn't merge: keep
            results.append((True, None))

        logger.info(
            'Memory compression: processed=%d, merged=%d',
            len(memories), merged_count,
        )
        return results

    def summarize(self, memories: list) -> str:
        '''
        Create a concise summary from a list of memories.
        Useful for generating a "what I know about you" summary.
        '''
        if not memories:
            return ''

        # Categorize
        categories: dict[str, list[str]] = {}
        for m in memories:
            cat = getattr(m, 'category', 'general') or 'general'
            content = getattr(m, 'content', '') or ''
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(content)

        parts: list[str] = []
        cat_labels: dict[str, str] = {
            'user_name': '你的名字',
            'user_interest': '你的兴趣',
            'user_preference': '你的偏好',
            'chat_history': '我们的回忆',
            'general': '其他',
        }

        for cat, contents in categories.items():
            label = cat_labels.get(cat, cat)
            # Take top 3 by importance (approximate: first items)
            top = contents[:3]
            if top:
                joined = '；'.join(top)
                parts.append(f'{label}: {joined}')

        summary: str = ' | '.join(parts) if parts else ''
        logger.debug('Memory summary generated: %d chars', len(summary))
        return summary

    # ── Internal ─────────────────────────────────────────────

    @staticmethod
    def _try_merge(content: str, candidates: list) -> Optional[str]:
        '''
        Try to merge content with similar candidate memories.
        Returns merged content string if merge happens, None otherwise.
        '''
        content_lower: str = content.lower()
        content_words: set[str] = set(content_lower.split())

        for candidate in candidates:
            candidate_content: str = getattr(candidate, 'content', '') or ''
            if not candidate_content:
                continue

            candidate_lower: str = candidate_content.lower()
            candidate_words: set[str] = set(candidate_lower.split())

            # If more than 50% word overlap, consider them similar
            if not content_words or not candidate_words:
                continue

            intersection: set[str] = content_words & candidate_words
            union: set[str] = content_words | candidate_words
            jaccard: float = len(intersection) / len(union) if union else 0

            if jaccard > 0.5:
                # Merge: keep the longer, more detailed version
                merged: str = content if len(content) >= len(candidate_content) else candidate_content
                return merged

        return None

    @staticmethod
    def should_archive(memory) -> bool:
        '''Determine if a memory should be archived based on age and recall count.'''
        from datetime import datetime, timedelta

        recall_count: int = getattr(memory, 'recall_count', 0) or 0
        importance: float = getattr(memory, 'importance', 0.5) or 0.5
        last_recalled = getattr(memory, 'last_recalled_at', None)

        # Low importance + never recalled → archive after 7 days
        if importance < 0.3 and recall_count == 0:
            return True

        # Low importance + not recalled in 30 days → archive
        if importance < 0.5 and last_recalled:
            days_since_recall: int = (datetime.now() - last_recalled).days
            if days_since_recall > 30:
                return True

        return False
