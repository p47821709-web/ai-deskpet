import io
import os
import uuid
import logging
from dataclasses import dataclass, field
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
    analysis_text: str
    pixel_size: int
    provider: str
    model: str


@dataclass
class ProviderConfig:
    '''Configuration for an AI provider.'''
    provider: str = 'openai'
    api_key: str = ''
    api_base: str = 'https://api.openai.com/v1'
    model: str = 'gpt-4o'
    image_model: str = 'dall-e-3'


class PixelConverter:
    '''
    Orchestrates the AI-powered pixel art conversion pipeline:

    1. Analyze the uploaded image using vision-capable LLM
    2. Generate pixel art sprite using image generation API
    3. Post-process and save the result
    '''

    def __init__(self, provider_config: Optional[ProviderConfig] = None) -> None:
        self.provider_config: ProviderConfig = provider_config or ProviderConfig()
        self.generated_dir: str = os.path.join(settings.storage_dir, 'generated')
        os.makedirs(self.generated_dir, exist_ok=True)

        self._client: Optional[AIUnifiedClient] = None

        logger.info(
            'PixelConverter initialized: provider=%s, model=%s, image_model=%s',
            self.provider_config.provider,
            self.provider_config.model,
            self.provider_config.image_model,
        )

    # ── Public API ──────────────────────────────────────────────

    async def convert(
        self,
        source_image_path: str,
        pixel_size: int = 32,
    ) -> GenerationResult:
        '''
        Full conversion pipeline: analyze source image → generate pixel art.
        Returns a GenerationResult with the output image bytes and metadata.

        Args:
            source_image_path: Absolute path to the uploaded source image
            pixel_size: Target pixel resolution (16, 24, or 32)

        Returns:
            GenerationResult with generated image and metadata

        Raises:
            FileUploadException: If any step of the pipeline fails
        '''
        client: AIUnifiedClient = self._get_client()

        # Step 1: Analyze the uploaded image
        logger.info(
            'Step 1/2: Analyzing source image: %s',
            source_image_path,
        )
        try:
            analysis_result: str = await client.analyze_image(
                image_path=source_image_path,
                system_prompt=prompt.VISION_SYSTEM_PROMPT,
                user_prompt=prompt.VISION_USER_PROMPT,
            )
        except Exception as exc:
            logger.error('Vision analysis failed: %s', exc)
            raise FileUploadException(
                f'Image analysis failed: {exc}',
            ) from exc

        if not analysis_result or len(analysis_result.strip()) < 50:
            logger.error(
                'Vision analysis returned insufficient content (len=%d)',
                len(analysis_result or ''),
            )
            raise FileUploadException(
                'AI could not analyze the image. Please try a different image.',
            )

        logger.info(
            'Vision analysis completed: %d characters',
            len(analysis_result),
        )

        # Step 2: Generate pixel art
        image_size: str = self._resolve_image_size(pixel_size)
        generation_prompt: str = prompt.build_generation_prompt(analysis_result)

        logger.info(
            'Step 2/2: Generating pixel art (size=%s, pixel_size=%d)',
            image_size, pixel_size,
        )

        try:
            if client.supports_image_generation:
                image_bytes: bytes = await client.generate_image(
                    prompt=generation_prompt,
                    size=image_size,
                    negative_prompt=prompt.NEGATIVE_PROMPT,
                )
            else:
                logger.warning(
                    'Provider %s has no image generation. '
                    'Falling back to description only.',
                    client.provider,
                )
                # Generate a minimal placeholder for providers without image gen
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
            analysis_text=analysis_result,
            pixel_size=pixel_size,
            provider=self.provider_config.provider,
            model=self.provider_config.image_model,
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

    def _get_client(self) -> AIUnifiedClient:
        '''Get or create the AI client with current provider config.'''
        if self._client is None:
            self._client = AIUnifiedClient(
                provider=self.provider_config.provider,
                api_key=self.provider_config.api_key,
                api_base=self.provider_config.api_base,
                model=self.provider_config.model,
                image_model=self.provider_config.image_model,
            )
        return self._client

    @staticmethod
    def _resolve_image_size(pixel_size: int) -> str:
        '''
        Map pixel art size to image generation resolution.
        The generated image is larger and downscaled for pixel-perfect results.
        '''
        mapping: dict[int, str] = {
            16: '1024x1024',
            24: '1024x1024',
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

        canvas_size: int = size * 10  # e.g., 32*10 = 320px
        img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

        # Draw a simple pixel-style character outline
        pixels = img.load()
        if pixels:
            block: int = canvas_size // size
            # Simple cute character shape centered in the canvas
            cx, cy = canvas_size // 2, canvas_size // 2
            r = size // 3 * block  # head radius in pixels

            # Draw circular head
            for y in range(canvas_size):
                for x in range(canvas_size):
                    dx = x - cx
                    dy = y - cy
                    if dx * dx + dy * dy <= r * r:
                        pixels[x, y] = (200, 200, 200, 255)  # Light gray body
                    elif dx * dx + dy * dy <= (r + block) * (r + block):
                        if (x // block + y // block) % 2 == 0:
                            pixels[x, y] = (100, 100, 100, 255)  # Pixel border

        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return buf.getvalue()
