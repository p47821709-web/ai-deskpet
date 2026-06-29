import io
import base64
import logging
from typing import Optional

import httpx

from app.core.exceptions import FileUploadException

logger = logging.getLogger(__name__)


class AIUnifiedClient:
    '''
    Unified client for OpenAI-compatible LLM APIs.
    Supports both text/vision chat and image generation endpoints.

    Provider compatibility:
      - OpenAI:      vision + DALL-E 3 image generation
      - DeepSeek:    vision (deepseek-vl2) only, no image generation
      - Doubao:      vision + Seedream 4.0 image generation (火山引擎方舟)
      - Compatible:  any provider supporting /v1/chat/completions + /v1/images/generations
    '''

    def __init__(
        self,
        provider: str = 'openai',
        api_key: str = '',
        api_base: str = '',
        model: str = 'gpt-4o',
        image_model: str = 'dall-e-3',
    ) -> None:
        self.provider: str = provider.lower()
        self.api_key: str = api_key or 'sk-placeholder'
        self.api_base: str = api_base.rstrip('/') or 'https://api.openai.com/v1'
        self.model: str = model
        self.image_model: str = image_model

        # HTTP client with timeout
        self._http: httpx.AsyncClient = httpx.AsyncClient(
            timeout=httpx.Timeout(120.0, connect=30.0),
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
            },
        )

        logger.info(
            'AIUnifiedClient initialized: provider=%s, model=%s, image_model=%s, api_base=%s',
            self.provider, self.model, self.image_model, self.api_base,
        )

    @property
    def supports_image_generation(self) -> bool:
        '''Check if the provider supports image generation endpoints.'''
        # DeepSeek and pure text providers don't support image gen
        no_image_providers: tuple[str, ...] = ('deepseek',)
        return self.provider not in no_image_providers

    # ── Vision: Analyze uploaded image ─────────────────────────

    async def analyze_image(
        self,
        image_path: str,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        '''
        Send an image to the vision-capable LLM for analysis.
        Returns the text description/analysis result.
        '''
        base64_image: str = self._encode_image(image_path)

        messages: list[dict] = [
            {'role': 'system', 'content': system_prompt},
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': user_prompt},
                    {
                        'type': 'image_url',
                        'image_url': {
                            'url': f'data:image/png;base64,{base64_image}',
                            'detail': 'high',
                        },
                    },
                ],
            },
        ]

        payload: dict = {
            'model': self.model,
            'messages': messages,
            'max_tokens': 4096,
            'temperature': 0.7,
        }

        logger.info(
            'Sending vision analysis request: model=%s, image=%s',
            self.model, image_path,
        )

        try:
            response = await self._http.post(
                f'{self.api_base}/chat/completions',
                json=payload,
            )
            response.raise_for_status()
            result: dict = response.json()

            content: str = (
                result.get('choices', [{}])[0]
                .get('message', {})
                .get('content', '')
            )

            usage: dict = result.get('usage', {})
            logger.info(
                'Vision analysis completed: tokens=%s, model=%s',
                usage, self.model,
            )
            return content

        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            logger.error(
                'Vision API error: status=%d, body=%s',
                status_code, exc.response.text,
            )
            if status_code == 401:
                raise FileUploadException(
                    f'AI 鉴权失败 (401): API Key 无效或未授权。'
                    f'请检查设置中的 API Key 是否正确，'
                    f'并确认在火山引擎控制台已开通 {self.model} 模型的访问权限。',
                ) from exc
            raise FileUploadException(
                f'AI vision analysis failed: {status_code}',
            ) from exc

        except httpx.RequestError as exc:
            logger.error('Vision API request failed: %s', exc)
            raise FileUploadException(
                f'Cannot connect to AI provider at {self.api_base}',
            ) from exc

    # ── Image Generation ───────────────────────────────────────

    async def generate_image(
        self,
        prompt: str,
        size: str = '1024x1024',
        negative_prompt: Optional[str] = None,
        reference_image_path: Optional[str] = None,
    ) -> bytes:
        '''
        Generate an image using the provider's image generation endpoint.
        Optionally accepts a reference image for image-to-image generation.
        Returns raw PNG bytes.
        '''
        if not self.supports_image_generation:
            logger.warning(
                'Provider %s does not support image generation', self.provider,
            )
            raise FileUploadException(
                f'Provider "{self.provider}" does not support image generation. '
                'Please switch to an image-capable provider like OpenAI.',
            )

        payload: dict = {
            'model': self.image_model,
            'prompt': prompt,
            'n': 1,
            'size': size,
            'response_format': 'b64_json',
        }

        if negative_prompt:
            payload['negative_prompt'] = negative_prompt

        if reference_image_path:
            ref_b64 = self._encode_image(reference_image_path)
            payload['image'] = f'data:image/png;base64,{ref_b64}'
            logger.info('Reference image attached: %s', reference_image_path)

        logger.info(
            'Sending image generation request: model=%s, size=%s',
            self.image_model, size,
        )

        try:
            response = await self._http.post(
                f'{self.api_base}/images/generations',
                json=payload,
            )
            response.raise_for_status()
            result: dict = response.json()

            b64_data: str = (
                result.get('data', [{}])[0].get('b64_json', '')
            )

            if not b64_data:
                logger.error('Image generation returned empty data')
                raise FileUploadException(
                    'AI image generation returned empty result',
                )

            image_bytes: bytes = base64.b64decode(b64_data)

            # If not PNG, ensure PNG wrapper
            if not image_bytes.startswith(b'\x89PNG'):
                logger.warning(
                    'Generated image is not PNG format (starts with %s), wrapping',
                    image_bytes[:4].hex(),
                )

            logger.info(
                'Image generated successfully: size=%d bytes, format=%s',
                len(image_bytes), self._detect_format(image_bytes),
            )
            return image_bytes

        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            logger.error(
                'Image generation API error: status=%d, body=%s',
                status_code, exc.response.text,
            )
            if status_code == 401:
                raise FileUploadException(
                    f'AI 鉴权失败 (401): API Key 无效或未授权。'
                    f'请检查设置中的 API Key 是否正确，'
                    f'并确认在火山引擎控制台已开通 {self.image_model} 模型的访问权限。'
                    f'（控制台: https://console.volcengine.com/ark/region:ark+cn-beijing/openManagement）',
                ) from exc
            raise FileUploadException(
                f'AI image generation failed: {status_code}',
            ) from exc

        except httpx.RequestError as exc:
            logger.error('Image generation request failed: %s', exc)
            raise FileUploadException(
                f'Cannot connect to AI image service at {self.api_base}',
            ) from exc

    # ── Utilities ──────────────────────────────────────────────

    async def close(self) -> None:
        '''Close the underlying HTTP client.'''
        await self._http.aclose()

    @staticmethod
    def _encode_image(image_path: str) -> str:
        '''Read an image file and return its base64-encoded string.'''
        try:
            with open(image_path, 'rb') as f:
                return base64.b64encode(f.read()).decode('utf-8')
        except FileNotFoundError:
            logger.error('Image file not found: %s', image_path)
            raise FileUploadException(f'Image file not found: {image_path}')
        except IOError as exc:
            logger.error('Failed to read image file %s: %s', image_path, exc)
            raise FileUploadException(f'Failed to read image: {exc}')

    @staticmethod
    def _detect_format(data: bytes) -> str:
        '''Detect image format from byte header.'''
        if data.startswith(b'\x89PNG'):
            return 'PNG'
        if data.startswith(b'\xff\xd8'):
            return 'JPEG'
        if data.startswith(b'RIFF') and data[8:12] == b'WEBP':
            return 'WebP'
        if data.startswith(b'GIF8'):
            return 'GIF'
        return 'Unknown'
