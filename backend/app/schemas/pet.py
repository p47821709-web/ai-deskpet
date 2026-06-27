from pydantic import BaseModel
from typing import Optional, List

class PetCreate(BaseModel):
    name: str
    species: Optional[str] = "cat"
    personality: Optional[str] = "friendly"

class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    personality: Optional[str] = None

class PetResponse(BaseModel):
    id: str
    name: str
    species: str
    status: str
    affection_level: int
    energy_level: int
    mood_score: int
    class Config:
        from_attributes = True
