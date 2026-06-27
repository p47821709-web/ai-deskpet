from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base
from app.utils.id_generator import generate_id as gen_id

class Pet(Base):
    __tablename__ = 'pets'

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    name = Column(String, nullable=False)
    species = Column(String, default='cat')
    personality = Column(String, default='friendly')
    source_image_url = Column(Text)
    sprite_sheet_url = Column(Text)
    portrait_url = Column(Text)
    color_palette = Column(JSON)
    pixel_size = Column(Integer, default=16)
    scale = Column(Integer, default=3)
    x_position = Column(Integer, default=100)
    y_position = Column(Integer, default=100)
    status = Column(String, default='active')
    affection_level = Column(Integer, default=50)
    energy_level = Column(Integer, default=80)
    mood_score = Column(Integer, default=60)
    last_emotion = Column(String, default='neutral')
    behavior_config = Column(JSON)
    animation_config = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_active_at = Column(DateTime)