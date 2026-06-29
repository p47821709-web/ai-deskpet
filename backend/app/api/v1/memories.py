import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.db import get_db
from app.schemas.memory import (
    MemoryCreate,
    MemoryUpdate,
    MemorySearchRequest,
    MemoryResponse,
    MemorySearchResult,
)
from app.services.memory_service import MemoryService

logger = logging.getLogger(__name__)

router = APIRouter()


def _to_response(memory) -> MemoryResponse:
    '''Convert an ORM Memory to a MemoryResponse.'''
    return MemoryResponse.model_validate(memory)


@router.get('')
async def list_memories(
    pet_id: str = Query(..., description='Pet ID'),
    category: Optional[str] = Query(None, description='Filter by category'),
    memory_type: Optional[str] = Query(None, description='Filter by memory type'),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    '''List memories for a pet with optional filters.'''
    service = MemoryService(db)
    memories, total = await service.list_memories(
        pet_id=pet_id,
        category=category,
        memory_type=memory_type,
        page=page,
        size=size,
    )

    return {
        'code': 200,
        'message': 'success',
        'data': [_to_response(m) for m in memories],
        'meta': {
            'page': page,
            'size': size,
            'total': total,
        },
    }


@router.get('/{memory_id}')
async def get_memory(
    memory_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    '''Get a single memory by ID.'''
    service = MemoryService(db)
    memory = await service.get_memory(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail='Memory not found')

    return {
        'code': 200,
        'message': 'success',
        'data': _to_response(memory),
    }


@router.post('', status_code=201)
async def create_memory(
    data: MemoryCreate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    '''Create a new memory.'''
    service = MemoryService(db)
    memory = await service.create_memory(user_id=data.pet_id, data=data)

    return {
        'code': 201,
        'message': 'Memory created',
        'data': _to_response(memory),
    }


@router.patch('/{memory_id}')
async def update_memory(
    memory_id: str,
    data: MemoryUpdate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    '''Update an existing memory.'''
    service = MemoryService(db)
    memory = await service.update_memory(memory_id, data)
    if not memory:
        raise HTTPException(status_code=404, detail='Memory not found')

    return {
        'code': 200,
        'message': 'Memory updated',
        'data': _to_response(memory),
    }


@router.delete('/{memory_id}')
async def delete_memory(
    memory_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    '''Delete a memory.'''
    service = MemoryService(db)
    deleted = await service.delete_memory(memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail='Memory not found')

    return {
        'code': 200,
        'message': 'Memory deleted',
        'data': None,
    }


@router.post('/search')
async def search_memories(
    request: MemorySearchRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    '''Search memories by keyword relevance.'''
    service = MemoryService(db)
    results: list[MemorySearchResult] = await service.search_memories(request)

    return {
        'code': 200,
        'message': 'Search completed',
        'data': {
            'results': [
                {
                    'memory': r.memory.model_dump(),
                    'relevance': r.relevance,
                }
                for r in results
            ],
            'total': len(results),
            'query': request.query,
        },
    }


@router.post('/{memory_id}/recall')
async def recall_memory(
    memory_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    '''Manually recall (touch) a memory to boost its recency.'''
    service = MemoryService(db)
    memory = await service.get_memory(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail='Memory not found')

    return {
        'code': 200,
        'message': 'Memory recalled',
        'data': _to_response(memory),
    }


@router.post('/consolidate')
async def consolidate_memories(
    pet_id: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
) -> dict:
    '''Run memory consolidation (compress + archive).'''
    from app.ai.memory_compressor import MemoryCompressor

    service = MemoryService(db)
    compressor = MemoryCompressor()

    memories, total = await service.list_memories(pet_id=pet_id, size=1000)

    results = compressor.compress(memories)

    deleted_count: int = 0
    for i, (keep, _) in enumerate(results):
        if not keep and i < len(memories):
            await service.delete_memory(memories[i].id)
            deleted_count += 1

    logger.info(
        'Consolidation complete: pet_id=%s, total=%d, deleted=%d',
        pet_id, total, deleted_count,
    )

    return {
        'code': 200,
        'message': 'Consolidation complete',
        'data': {
            'total_memories': total,
            'deleted': deleted_count,
            'remaining': total - deleted_count,
        },
    }