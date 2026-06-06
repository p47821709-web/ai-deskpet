﻿﻿﻿import os
import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Body
from fastapi.responses import JSONResponse

from app.schemas.generation import (
    UploadResponse,
    PixelArtGenerateRequest,
    PixelArtGenerateResponse,
)
from app.storage.local import LocalStorage
from app.storage.thumbnail import ThumbnailGenerator
from app.ai.pixel_converter import PixelConverter, ProviderConfig
from app.core.exceptions import (
    FileUploadException,
    FileTooLargeException,
    UnsupportedFileTypeException,
)
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
storage = LocalStorage()
thumbnail_gen = ThumbnailGenerator()

# Ensure generated directory exists
os.makedirs(os.path.join(settings.storage_dir, 'generated'), exist_ok=True)


@router.post('/upload', response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
) -> dict:
    if not file.filename:
        raise FileUploadException('No filename provided')

    logger.info(
        'Upload request received: filename=%s, content_type=%s, size=%s',
        file.filename, file.content_type,
        file.size if hasattr(file, 'size') else 'unknown',
    )

    try:
        raw_data: bytes = await file.read()
    except Exception as exc:
        logger.error('Failed to read uploaded file %s: %s', file.filename, exc)
        raise FileUploadException('Failed to read uploaded file') from exc

    mime_type: str = file.content_type or 'application/octet-stream'

    try:
        rel_path, abs_path, _ = storage.save_upload(
            data=raw_data,
            original_filename=file.filename,
            mime_type=mime_type,
        )
    except (FileTooLargeException, UnsupportedFileTypeException):
        raise
    except Exception as exc:
        logger.error('Failed to save uploaded file %s: %s', file.filename, exc)
        raise FileUploadException('Failed to save uploaded file') from exc

    try:
        img_width, img_height = ThumbnailGenerator.get_image_dimensions(abs_path)
    except Exception as exc:
        logger.warning('Failed to read image dimensions for %s: %s', abs_path, exc)
        img_width, img_height = 0, 0

    base_filename: str = rel_path.split('/')[-1]
    thumbnails: dict[str, str] = {}

    try:
        thumb_results: dict[str, str] = thumbnail_gen.generate_all(
            image_path=abs_path,
            output_dir=storage.thumbnail_dir,
            base_filename=base_filename,
        )
        for label, thumb_file in thumb_results.items():
            thumb_rel: str = (_get_date_prefix() + '/' + thumb_file) if '/' not in thumb_file else thumb_file
            thumbnails[label] = storage.get_url(thumb_rel, is_thumbnail=True)
    except Exception as exc:
        logger.error('Thumbnail generation failed for %s: %s', abs_path, exc)

    file_url: str = storage.get_url(rel_path)
    preview_url: str = thumbnails.get(
        '256x256',
        thumbnails.get('128x128', file_url),
    )

    return {
        'code': 200,
        'message': 'Upload successful',
        'data': {
            'file_url': file_url,
            'preview_url': preview_url,
            'original_name': file.filename,
            'file_size': len(raw_data),
            'mime_type': mime_type,
            'width': img_width,
            'height': img_height,
            'thumbnails': thumbnails,
        },
    }


@router.post('/create', response_model=dict)
async def create_pixel_art(
    request: PixelArtGenerateRequest = Body(...),
) -> dict:
    '''
    Generate a pixel art desktop pet from an uploaded image.

    Accepts a file_url from the /upload endpoint, analyzes the image
    using a vision-capable LLM, then generates a pixel art sprite.

    AI provider can be configured via request body fields:
    - ai_provider: 'openai' (default) or 'deepseek'
    - ai_model: vision model name (default: gpt-4o)
    - ai_image_model: image generation model (default: dall-e-3)
    - ai_api_base: custom API base URL
    - ai_api_key: API key (or use env var)
    '''
    job_id: str = uuid.uuid4().hex
    logger.info(
        'Generation request received: job_id=%s, file_url=%s, pixel_size=%d',
        job_id, request.file_url, request.pixel_size,
    )

    source_path: str = _resolve_storage_path(request.file_url)
    if not source_path or not os.path.exists(source_path):
        logger.error('Source image not found: %s', request.file_url)
        raise FileUploadException(
            f'Source image not found: {request.file_url}. '
            f'Please upload the image first via /upload endpoint.',
        )

    logger.info('Source image resolved: %s', source_path)

    provider_config: ProviderConfig = ProviderConfig(
        provider=(request.ai_provider or settings.ai_default_provider),
        api_key=(request.ai_api_key or ''),
        api_base=(request.ai_api_base or settings.ai_default_api_base),
        model=(request.ai_model or settings.ai_default_model),
        image_model=(request.ai_image_model or settings.ai_default_image_model),
    )

    logger.info(
        'Using AI provider: provider=%s, model=%s, image_model=%s, api_base=%s',
        provider_config.provider,
        provider_config.model,
        provider_config.image_model,
        provider_config.api_base,
    )

    converter: PixelConverter = PixelConverter(provider_config=provider_config)

    try:
        result = await converter.convert(
            source_image_path=source_path,
            pixel_size=request.pixel_size,
        )
    except FileUploadException:
        raise
    except Exception as exc:
        logger.error('Unexpected generation error for job %s: %s', job_id, exc)
        raise FileUploadException(
            f'Pixel art generation failed unexpectedly: {exc}',
        ) from exc

    logger.info(
        'Generation complete: job_id=%s, output=%s',
        job_id, result.file_path,
    )

    return {
        'code': 200,
        'message': 'Pixel art generation successful',
        'data': {
            'job_id': job_id,
            'status': 'completed',
            'generated_image_url': result.file_url,
            'preview_url': result.file_url,
            'pixel_size': result.pixel_size,
            'provider': result.provider,
            'model': result.model,
            'analysis_text': result.analysis_text,
        },
    }


@router.get('/{job_id}', response_model=dict)
async def get_generation(job_id: str) -> dict:
    return {
        'code': 200,
        'data': {
            'id': job_id,
            'status': 'completed',
            'progress': 100.0,
        },
    }


@router.post('/{job_id}/cancel', response_model=dict)
async def cancel_generation(job_id: str) -> dict:
    logger.info('Cancel requested for job: %s', job_id)
    return {'code': 200, 'message': 'Cancelled'}


@router.post('/preview', response_model=dict)
async def preview_generation(
    file_url: str = Body(...),
    pixel_size: int = Body(default=32),
) -> dict:
    source_path: str = _resolve_storage_path(file_url)
    if not source_path or not os.path.exists(source_path):
        raise FileUploadException(f'Source image not found: {file_url}')

    return {
        'code': 200,
        'data': {
            'preview_url': file_url,
            'pixel_size': pixel_size,
            'estimated_frames': 4,
            'palette_colors': 16,
        },
    }


@router.get('/history', response_model=dict)
async def get_history() -> dict:
    return {'code': 200, 'data': []}


# ── Helpers ────────────────────────────────────────────────────

def _resolve_storage_path(file_url: str) -> str:
    '''Convert a /storage/uploads/... URL to an absolute filesystem path.'''
    prefix: str = '/storage/uploads/'
    if file_url.startswith(prefix):
        rel: str = file_url[len(prefix):]
        return os.path.join(settings.upload_dir, rel.replace('/', os.sep))
    return file_url


def _get_date_prefix() -> str:
    now: datetime = datetime.now()
    return f'{now.year}/{now.month:02d}'


