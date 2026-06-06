from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base
import uuid

def gen_id():
    return str(uuid.uuid4())

class ChatSession(Base):
    __tablename__ = 'chat_sessions'
    id = Column(String, primary_key=True, default=gen_id)
    pet_id = Column(String, ForeignKey('pets.id'), nullable=False)
    title = Column(String)
    message_count = Column(Integer, default=0)
    last_message_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(String, primary_key=True, default=gen_id)
    pet_id = Column(String, ForeignKey('pets.id'), nullable=False)
    session_id = Column(String, ForeignKey('chat_sessions.id'), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    metadata = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())