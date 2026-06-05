from pydantic import BaseModel
from typing import Optional, List

class ChatSessionCreate(BaseModel):
    pet_id: str
    title: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str
    class Config:
        from_attributes = True
