from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime


class PetCreate(BaseModel):
    name: str
    image_url: Optional[str] = None
    style: Optional[str] = None
    pixel_size: Optional[int] = 32
    species: Optional[str] = 'cat'
    personality: Optional[str] = 'friendly'


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    personality: Optional[str] = None
    source_image_url: Optional[str] = None
    sprite_sheet_url: Optional[str] = None
    portrait_url: Optional[str] = None
    status: Optional[str] = None
    affection_level: Optional[int] = None
    energy_level: Optional[int] = None
    mood_score: Optional[int] = None
    last_emotion: Optional[str] = None


class PetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    species: Optional[str] = 'cat'
    personality: Optional[str] = 'friendly'
    source_image_url: Optional[str] = None
    sprite_sheet_url: Optional[str] = None
    portrait_url: Optional[str] = None
    pixel_size: Optional[int] = 16
    scale: Optional[int] = 3
    x_position: Optional[int] = 100
    y_position: Optional[int] = 100
    status: Optional[str] = 'active'
    affection_level: Optional[int] = 50
    energy_level: Optional[int] = 80
    mood_score: Optional[int] = 60
    last_emotion: Optional[str] = 'neutral'
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def _serialize_datetime(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class PetListResponse(BaseModel):
    total: int
    items: List[PetResponse]
