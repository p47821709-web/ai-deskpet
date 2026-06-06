from pydantic import BaseModel
from typing import Optional

class UserRegister(BaseModel):
    device_id: str
    nickname: Optional[str] = None

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    preferences: Optional[dict] = None

class UserResponse(BaseModel):
    id: str
    device_id: str
    nickname: Optional[str]
    class Config:
        from_attributes = True
