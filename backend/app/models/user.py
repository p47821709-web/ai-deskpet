from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.models.base import Base
from app.utils.id_generator import generate_id as gen_id

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True, default=gen_id)
    device_id = Column(String, unique=True, nullable=False)
    nickname = Column(String)
    avatar_url = Column(Text)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())