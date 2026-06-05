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
    '''Request body for AI pixel art generation.'''
    file_url: str = Field(
        ..., description='URL of the uploaded source image (from /upload endpoint)',
    )
    pet_name: Optional[str] = Field(
        None, description='Optional name for the generated pet',
    )
    pixel_size: int = Field(
        default=32, ge=16, le=64, description='Target pixel resolution',
    )
    ai_provider: Optional[str] = Field(None, description='AI provider: openai or deepseek')
    ai_model: Optional[str] = Field(None, description='Vision model name')
    ai_image_model: Optional[str] = Field(None, description='Image generation model')
    ai_api_base: Optional[str] = Field(None, description='Custom API base URL')
    ai_api_key: Optional[str] = Field(None, description='API key')


class PixelArtGenerateResponse(BaseModel):
    '''Response from a successful pixel art generation.'''
    job_id: str
    status: str
    generated_image_url: str
    preview_url: str
    pixel_size: int
    provider: str
    model: str
    analysis_text: str


class AIGenerationConfig(BaseModel):
    '''Configuration for AI model provider used during generation.'''
    provider: str = Field(default='openai', description='Provider name')
    model: str = Field(default='gpt-4o', description='Vision model for analysis')
    image_model: str = Field(default='dall-e-3', description='Image generation model')
    api_base: str = Field(default='https://api.openai.com/v1', description='API base URL')
    api_key: str = Field(default='', description='API key')

