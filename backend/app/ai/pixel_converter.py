import io
import os
import uuid
import logging
from dataclasses import dataclass
from typing import Optional

from app.ai.client import AIUnifiedClient
from app.ai import pixel_art_prompt as prompt
from app.config import settings
from app.core.exceptions import FileUploadException

logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    '''Result of a pixel art generation process.'''
    image_bytes: bytes
    file_path: str
    file_url: str
    pixel_size: int
    image_provider: str
    image_model: str


@dataclass
class ImageProviderConfig:
    '''Configuration for the image generation AI provider.'''
    provider: str = 'openai'
    api_key: str = ''
    api_base: str = 'https://api.openai.com/v1'
    model: str = 'dall-e-3'


class PixelConverter:
    '''
    Orchestrates the AI-powered pixel art conversion pipeline:

    1. Uploaded image is used as reference for image-to-image generation
    2. Generate pixel art sprite using image generation API
    3. Post-process and save the result
    '''

    def __init__(
        self,
        image_config: Optional[ImageProviderConfig] = None,
    ) -> None:
        self.image_config: ImageProviderConfig = image_config or ImageProviderConfig()
        self.generated_dir: str = os.path.join(settings.storage_dir, 'generated')
        os.makedirs(self.generated_dir, exist_ok=True)

        self._image_client: Optional[AIUnifiedClient] = None

        logger.info(
            'PixelConverter initialized: image=%s(%s)',
            self.image_config.provider, self.image_config.model,
        )

    # ── Public API ──────────────────────────────────────────────

    async def convert(
        self,
        source_image_path: str,
        pixel_size: int = 32,
    ) -> GenerationResult:
        '''
        Direct image-to-image generation: use uploaded image as reference
        to generate a pixel art desktop pet sprite.

        Args:
            source_image_path: Absolute path to the uploaded source image
            pixel_size: Target pixel resolution (16, 24, or 32)

        Returns:
            GenerationResult with generated image and metadata

        Raises:
            FileUploadException: If generation fails
        '''
        image_client: AIUnifiedClient = self._get_image_client()
        image_size: str = self._resolve_image_size(
            pixel_size, self.image_config.provider,
        )

        logger.info(
            'Generating pixel art: provider=%s, model=%s, size=%s, ref=%s',
            self.image_config.provider, self.image_config.model,
            image_size, source_image_path,
        )

        try:
            if image_client.supports_image_generation:
                image_bytes: bytes = await image_client.generate_image(
                    prompt=prompt.DIRECT_GENERATION_PROMPT,
                    size=image_size,
                    negative_prompt=prompt.NEGATIVE_PROMPT,
                    reference_image_path=source_image_path,
                )
            else:
                logger.warning(
                    'Provider %s has no image generation. '
                    'Falling back to placeholder.',
                    image_client.provider,
                )
                image_bytes = self._create_placeholder_pixel_art(pixel_size)
        except FileUploadException:
            raise
        except Exception as exc:
            logger.error('Image generation failed: %s', exc)
            raise FileUploadException(
                f'Pixel art generation failed: {exc}',
            ) from exc

        # Save the generated image
        filename: str = f'{uuid.uuid4().hex}.png'
        file_path: str = os.path.join(self.generated_dir, filename)

        try:
            with open(file_path, 'wb') as f:
                f.write(image_bytes)
        except IOError as exc:
            logger.error('Failed to save generated image: %s', exc)
            raise FileUploadException(
                f'Failed to save generated image: {exc}',
            ) from exc

        file_url: str = f'/storage/generated/{filename}'

        logger.info(
            'Pixel art generation complete: file=%s, size=%d bytes',
            filename, len(image_bytes),
        )

        return GenerationResult(
            image_bytes=image_bytes,
            file_path=file_path,
            file_url=file_url,
            pixel_size=pixel_size,
            image_provider=self.image_config.provider,
            image_model=self.image_config.model,
        )

    async def convert_batch(
        self,
        source_image_path: str,
        pixel_sizes: list[int] | None = None,
    ) -> list[GenerationResult]:
        '''
        Generate pixel art at multiple resolutions.
        Useful for generating both standard and HD versions.
        '''
        if pixel_sizes is None:
            pixel_sizes = [16, 32]

        results: list[GenerationResult] = []
        for size in pixel_sizes:
            result = await self.convert(source_image_path, pixel_size=size)
            results.append(result)

        return results

    # ── Internal helpers ───────────────────────────────────────

    def _get_image_client(self) -> AIUnifiedClient:
        '''Get or create the AI client for image generation.'''
        if self._image_client is None:
            self._image_client = AIUnifiedClient(
                provider=self.image_config.provider,
                api_key=self.image_config.api_key,
                api_base=self.image_config.api_base,
                model=self.image_config.model,
                image_model=self.image_config.model,
            )
        return self._image_client

    @staticmethod
    def _resolve_image_size(pixel_size: int, provider: str = '') -> str:
        '''
        Map pixel art size to image generation resolution.
        The generated image is larger and downscaled for pixel-perfect results.

        Doubao Seedream 5.0 requires minimum 2048x2048 (total pixels >= 3686400).
        '''
        if provider == 'doubao':
            return '2048x2048'

        mapping: dict[int, str] = {
            16: '512x512',
            24: '768x768',
            32: '1024x1024',
            48: '1024x1024',
            64: '1792x1024',
        }
        return mapping.get(pixel_size, '1024x1024')

    @staticmethod
    def _create_placeholder_pixel_art(size: int) -> bytes:
        '''
        Create a minimal pixel art placeholder image.
        Used as fallback when the provider doesn't support image generation.
        '''
        from PIL import Image

        canvas_size: int = size * 10
        img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

        pixels = img.load()
        if pixels is None:
            img = Image.new('RGBA', (canvas_size, canvas_size), (180, 180, 180, 255))
        else:
            block: int = canvas_size // size
            cx, cy = canvas_size // 2, canvas_size // 2
            r = size // 3 * block

            for y in range(canvas_size):
                for x in range(canvas_size):
                    dx = x - cx
                    dy = y - cy
                    if dx * dx + dy * dy <= r * r:
                        pixels[x, y] = (200, 200, 200, 255)
                    elif dx * dx + dy * dy <= (r + block) * (r + block):
                        if (x // block + y // block) % 2 == 0:
                            pixels[x, y] = (100, 100, 100, 255)

        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return buf.getvalue()