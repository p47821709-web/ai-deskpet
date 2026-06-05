from sqlalchemy import Column, String, Float, Text, DateTime, JSON, ForeignKey, Integer, BLOB
from sqlalchemy.sql import func
from app.models.base import Base
import uuid

def gen_id():
    return str(uuid.uuid4())

class Memory(Base):
    __tablename__ = 'memories'
    id = Column(String, primary_key=True, default=gen_id)
    pet_id = Column(String, ForeignKey('pets.id'), nullable=False)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    memory_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    embedding_id = Column(String)
    importance = Column(Float, default=0.5)
    category = Column(String)
    related_entities = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    last_recalled_at = Column(DateTime)
    expires_at = Column(DateTime)
    recall_count = Column(Integer, default=0)

class MemoryEmbedding(Base):
    __tablename__ = 'memory_embeddings'
    id = Column(String, primary_key=True, default=gen_id)
    memory_id = Column(String, ForeignKey('memories.id'), nullable=False)
    vector = Column(BLOB)
    model_name = Column(String)
    dimension = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())