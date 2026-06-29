from pydantic import BaseModel, Field
from typing import Optional


class GenerationCreate(BaseModel):
    file_url: str
    pixel_size: Optional[int] = 32
    style: Optional[str] = 'pixel_art'


class GenerationResponse(BaseModel):
    id: str
    status: str
    progress: float

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    file_url: str
    preview_url: str
    original_name: str
    file_size: int
    mime_type: str
    width: int
    height: int
    thumbnails: dict[str, str]


class PixelArtGenerateRequest(BaseModel):
    '''Request body for AI pixel art generation. Supports image provider configuration.'''
    file_url: str = Field(
        ..., description='URL of the uploaded source image (from /upload endpoint)',
    )
    pet_name: Optional[str] = Field(
        None, description='Optional name for the generated pet',
    )
    pixel_size: int = Field(
        default=32, ge=16, le=64, description='Target pixel resolution',
    )

    # ── 图片生成配置 ──
    image_provider: Optional[str] = Field(None, description='生图模型供应商: openai/doubao')
    image_model: Optional[str] = Field(None, description='生图模型名称')
    image_api_base: Optional[str] = Field(None, description='生图 API 地址')
    image_api_key: Optional[str] = Field(None, description='生图 API Key')


class PixelArtGenerateResponse(BaseModel):
    '''Response from a successful pixel art generation.'''
    job_id: str
    status: str
    generated_image_url: str
    preview_url: str
    pixel_size: int
    image_provider: str
    image_model: str


class AIGenerationConfig(BaseModel):
    '''Configuration for AI model providers used during generation.'''
    image_provider: str = Field(default='openai', description='生图模型供应商')
    image_model: str = Field(default='dall-e-3', description='生图模型')
    image_api_base: str = Field(default='https://api.openai.com/v1', description='生图 API 地址')
    image_api_key: str = Field(default='', description='生图 API Key')