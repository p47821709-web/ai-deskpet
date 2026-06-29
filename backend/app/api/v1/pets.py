'''Pet CRUD API endpoints.'''

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.db import get_db
from app.models.pet import Pet
from app.models.memory import Memory
from app.models.user import User
from app.schemas.pet import PetCreate, PetResponse, PetUpdate, PetListResponse
from app.utils.id_generator import generate_id as gen_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=['pets'])

DEFAULT_DEVICE_ID = 'default-desktop-device'


class PositionUpdate(BaseModel):
    x: float
    y: float


class StatusUpdate(BaseModel):
    status: str = Field(default='idle')
    emotion: Optional[str] = Field(default=None)


async def _get_or_create_default_user(db: AsyncSession) -> User:
    '''Get or create the default desktop user.'''
    stmt = select(User).where(User.device_id == DEFAULT_DEVICE_ID)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            id=gen_id(),
            device_id=DEFAULT_DEVICE_ID,
            nickname='桌面用户',
        )
        db.add(user)
        await db.flush()
    return user


@router.get('', response_model=PetListResponse)
async def list_pets(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> PetListResponse:
    '''List all pets with pagination.'''
    count_result = await db.execute(select(Pet))
    total = len(count_result.scalars().all())

    stmt = (
        select(Pet)
        .order_by(Pet.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    pets = result.scalars().all()

    return PetListResponse(
        total=total,
        items=[PetResponse.model_validate(p) for p in pets],
    )


@router.post('', response_model=PetResponse, status_code=201)
async def create_pet(
    payload: PetCreate,
    db: AsyncSession = Depends(get_db),
) -> PetResponse:
    '''Create a new pet.'''
    user = await _get_or_create_default_user(db)

    pet = Pet(
        id=gen_id(),
        user_id=user.id,
        name=payload.name,
        species=payload.species or 'cat',
        personality=payload.personality or 'friendly',
        source_image_url=payload.image_url,
        sprite_sheet_url=payload.image_url,
        portrait_url=payload.image_url,
        pixel_size=payload.pixel_size or 32,
    )
    db.add(pet)
    await db.commit()
    await db.refresh(pet)
    return PetResponse.model_validate(pet)


@router.get('/{pet_id}', response_model=PetResponse)
async def get_pet(
    pet_id: str,
    db: AsyncSession = Depends(get_db),
) -> PetResponse:
    '''Get a single pet by ID.'''
    stmt = select(Pet).where(Pet.id == pet_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail='桌宠不存在')
    return PetResponse.model_validate(pet)


@router.patch('/{pet_id}', response_model=PetResponse)
async def update_pet(
    pet_id: str,
    payload: PetUpdate,
    db: AsyncSession = Depends(get_db),
) -> PetResponse:
    '''Update pet fields.'''
    stmt = select(Pet).where(Pet.id == pet_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail='桌宠不存在')

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pet, key, value)

    await db.commit()
    await db.refresh(pet)
    return PetResponse.model_validate(pet)


@router.delete('/{pet_id}', status_code=204)
async def delete_pet(
    pet_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    '''Delete a pet and its associated memories.'''
    stmt = select(Pet).where(Pet.id == pet_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail='桌宠不存在')

    # Delete associated memories
    mem_result = await db.execute(select(Memory).where(Memory.pet_id == pet_id))
    memories = mem_result.scalars().all()
    for m in memories:
        await db.delete(m)

    await db.delete(pet)
    await db.commit()


@router.patch('/{pet_id}/position', response_model=PetResponse)
async def update_pet_position(
    pet_id: str,
    payload: PositionUpdate,
    db: AsyncSession = Depends(get_db),
) -> PetResponse:
    '''Update pet desktop position.'''
    stmt = select(Pet).where(Pet.id == pet_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail='桌宠不存在')

    pet.x_position = payload.x
    pet.y_position = payload.y
    await db.commit()
    await db.refresh(pet)
    return PetResponse.model_validate(pet)


@router.patch('/{pet_id}/status', response_model=PetResponse)
async def update_pet_status(
    pet_id: str,
    payload: StatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> PetResponse:
    '''Update pet status and emotion.'''
    stmt = select(Pet).where(Pet.id == pet_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if pet is None:
        raise HTTPException(status_code=404, detail='桌宠不存在')

    pet.status = payload.status
    if payload.emotion is not None:
        pet.last_emotion = payload.emotion
    await db.commit()
    await db.refresh(pet)
    return PetResponse.model_validate(pet)