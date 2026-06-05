from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MemoryCreate(BaseModel):
    '''Request to create a new memory.'''
    pet_id: str = Field(..., description='Pet ID the memory belongs to')
    memory_type: str = Field(
        default='semantic',
        description='Memory type: episodic, semantic, procedural',
    )
    content: str = Field(..., min_length=1, description='Memory content text')
    category: str = Field(
        default='general',
        description='Category: user_name, user_interest, chat_history, user_preference, general',
    )
    importance: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description='Importance score 0-1',
    )
    related_entities: Optional[List[str]] = Field(
        default=None,
        description='Related entity names (e.g., ["user", "cat"])',
    )


class MemoryUpdate(BaseModel):
    '''Request to update an existing memory.'''
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    importance: Optional[float] = Field(None, ge=0.0, le=1.0)
    memory_type: Optional[str] = None


class MemorySearchRequest(BaseModel):
    '''Request to search memories.'''
    pet_id: str = Field(..., description='Pet ID to search within')
    query: str = Field(..., min_length=1, description='Search query text')
    top_k: int = Field(default=5, ge=1, le=50, description='Max results')
    category: Optional[str] = Field(None, description='Filter by category')
    memory_type: Optional[str] = Field(None, description='Filter by type')


class MemoryResponse(BaseModel):
    '''Memory read response.'''
    id: str
    pet_id: str
    memory_type: str
    content: str
    importance: float
    category: str
    related_entities: Optional[List[str]] = None
    recall_count: int
    created_at: str
    last_recalled_at: Optional[str] = None

    class Config:
        from_attributes = True


class MemorySearchResult(BaseModel):
    '''Single search result with relevance score.'''
    memory: MemoryResponse
    relevance: float


class MemorySearchResponse(BaseModel):
    '''Search results response.'''
    results: List[MemorySearchResult]
    total: int
    query: str
