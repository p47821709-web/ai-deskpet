from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.models.base import Base
from app.utils.id_generator import generate_id as gen_id

class PetAnimation(Base):
    __tablename__ = 'pet_animations'
    id = Column(String, primary_key=True, default=gen_id)
    pet_id = Column(String, ForeignKey('pets.id'), nullable=False)
    animation_type = Column(String, nullable=False)
    sprite_url = Column(Text, nullable=False)
    frame_count = Column(Integer, default=4)
    frame_duration = Column(Integer, default=200)
    trigger_type = Column(String, default='auto')
    trigger_params = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

class InteractionLog(Base):
    __tablename__ = 'interaction_logs'
    id = Column(String, primary_key=True, default=gen_id)
    pet_id = Column(String, ForeignKey('pets.id'), nullable=False)
    interaction_type = Column(String, nullable=False)
    details = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

class AIModelConfig(Base):
    __tablename__ = 'ai_model_configs'
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    provider = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    api_base = Column(String)
    api_key_encrypted = Column(String)
    max_tokens = Column(Integer, default=2048)
    temperature = Column(Float, default=0.7)
    extra_params = Column(JSON)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class AppSettings(Base):
    __tablename__ = 'app_settings'
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    category = Column(String, nullable=False)
    settings = Column(JSON, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())