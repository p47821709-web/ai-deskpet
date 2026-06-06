from sqlalchemy import Column, String, Float, Text, DateTime, JSON, ForeignKey, Integer
from sqlalchemy.sql import func
from app.models.base import Base
import uuid

def gen_id():
    return str(uuid.uuid4())

class GenerationJob(Base):
    __tablename__ = 'generation_jobs'
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    pet_id = Column(String, ForeignKey('pets.id'), nullable=True)
    source_image_url = Column(Text, nullable=False)
    status = Column(String, default='pending')
    progress = Column(Float, default=0)
    result = Column(JSON)
    parameters = Column(JSON)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)