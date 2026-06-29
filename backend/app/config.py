import os
from pydantic_settings import BaseSettings
from typing import ClassVar


class Settings(BaseSettings):
    # Database
    database_url: str = 'sqlite:///./data/deskpet.db'

    # Storage
    storage_dir: str = './data/storage'
    upload_dir: str = './data/storage/uploads'
    thumbnail_dir: str = './data/storage/thumbnails'

    # Upload constraints
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: tuple[str, ...] = ('.png', '.jpg', '.jpeg', '.webp')
    allowed_mime_types: tuple[str, ...] = (
        'image/png',
        'image/jpeg',
        'image/webp',
    )

    # Thumbnails
    thumbnail_sizes: tuple[tuple[int, int], ...] = (
        (128, 128),   # small
        (256, 256),   # medium
        (512, 512),   # large
    )

    # AI / Generation defaults
    ai_default_provider: str = 'openai'
    ai_default_model: str = 'gpt-4o'
    ai_default_image_model: str = 'dall-e-3'
    ai_default_api_base: str = 'https://api.openai.com/v1'
    ai_image_generation_size: str = '1024x1024'

    # DeepSeek defaults
    deepseek_api_base: str = 'https://api.deepseek.com'
    deepseek_vision_model: str = 'deepseek-chat'

    # Doubao / 火山方舟 defaults
    doubao_api_base: str = 'https://ark.cn-beijing.volces.com/api/v3'
    doubao_vision_model: str = 'doubao-vision-pro-32k'
    doubao_image_model: str = 'doubao-seedream-5-0-260128'

    # Server
    backend_host: str = '0.0.0.0'
    backend_port: int = 8000
    backend_debug: bool = True

    class Config:
        env_file = '.env'


settings = Settings()

# Ensure storage directories exist at import time
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.thumbnail_dir, exist_ok=True)
