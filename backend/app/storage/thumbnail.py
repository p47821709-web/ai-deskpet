import logging
from pathlib import Path
from typing import Optional

from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


class ThumbnailGenerator:
    '''Generate thumbnail images at multiple sizes.'''

    def __init__(self) -> None:
        self.sizes: tuple[tuple[int, int], ...] = settings.thumbnail_sizes
        logger.info(
            'ThumbnailGenerator initialized with sizes: %s',
            [f'{w}x{h}' for w, h in self.sizes],
        )

    def generate_all(
        self,
        image_path: str,
        output_dir: str,
        base_filename: str,
    ) -> dict[str, str]:
        '''
        Generate thumbnails at all configured sizes.
        Returns a dict mapping size_label -> relative_file_path.
        '''
        result: dict[str, str] = {}

        try:
            with Image.open(image_path) as img:
                img_format: str = self._detect_format(img, image_path)

                for width, height in self.sizes:
                    label: str = f'{width}x{height}'
                    thumb_path: str = self._generate_single(
                        img, width, height, img_format, output_dir, base_filename, label,
                    )
                    if thumb_path:
                        result[label] = thumb_path

        except Exception as exc:
            logger.error('Thumbnail generation failed for %s: %s', image_path, exc)
            raise

        logger.info(
            'Generated %d thumbnails for %s', len(result), base_filename,
        )
        return result

    def generate_single(
        self,
        image_path: str,
        width: int,
        height: int,
        output_dir: str,
        base_filename: str,
    ) -> Optional[str]:
        '''
        Generate a single thumbnail at the specified size.
        Returns the relative file path, or None on failure.
        '''
        try:
            with Image.open(image_path) as img:
                img_format: str = self._detect_format(img, image_path)
                label: str = f'{width}x{height}'
                return self._generate_single(
                    img, width, height, img_format, output_dir, base_filename, label,
                )
        except Exception as exc:
            logger.error(
                'Single thumbnail generation failed: %s -> %dx%d: %s',
                image_path, width, height, exc,
            )
            return None

    # ── Internal ────────────────────────────────────────────────

    def _generate_single(
        self,
        img: Image.Image,
        width: int,
        height: int,
        img_format: str,
        output_dir: str,
        base_filename: str,
        label: str,
    ) -> str:
        '''Resize and save a single thumbnail. Returns the file path.'''
        thumb: Image.Image = self._resize_cover(img, width, height)

        thumb_filename: str = f'{label}_{base_filename}'
        # Replace extension with .webp for web-optimized thumbnails
        thumb_path: str = str(Path(output_dir) / thumb_filename)
        if thumb_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            thumb_path = Path(thumb_path).with_suffix('.webp')
            thumb_filename = Path(thumb_filename).with_suffix('.webp').name
            thumb_format: str = 'WEBP'
        else:
            thumb_format = img_format

        thumb.save(thumb_path, format=thumb_format, quality=85)
        logger.debug(
            'Thumbnail created: %s (%dx%d -> %dx%d, format=%s)',
            thumb_filename, img.width, img.height, width, height, thumb_format,
        )
        return str(thumb_filename)

    @staticmethod
    def _resize_cover(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
        '''
        Resize the image to fill the target dimensions while maintaining aspect ratio,
        cropping excess. Similar to CSS object-fit: cover.
        '''
        img_ratio: float = img.width / img.height
        target_ratio: float = target_w / target_h

        if img_ratio > target_ratio:
            # Image is wider -> match height, crop width
            new_h: int = target_h
            new_w: int = int(target_h * img_ratio)
        else:
            # Image is taller -> match width, crop height
            new_w = target_w
            new_h = int(target_w / img_ratio)

        resized: Image.Image = img.resize((new_w, new_h), Image.LANCZOS)

        # Center crop
        left: int = (new_w - target_w) // 2
        top: int = (new_h - target_h) // 2
        cropped: Image.Image = resized.crop((left, top, left + target_w, top + target_h))

        return cropped

    @staticmethod
    def _detect_format(img: Image.Image, file_path: str) -> str:
        '''Detect the image format from the PIL Image or fall back to file extension.'''
        if img.format:
            return img.format
        ext: str = Path(file_path).suffix.lower()
        format_map: dict[str, str] = {
            '.png': 'PNG',
            '.jpg': 'JPEG',
            '.jpeg': 'JPEG',
            '.webp': 'WEBP',
        }
        return format_map.get(ext, 'PNG')

    @staticmethod
    def get_image_dimensions(image_path: str) -> tuple[int, int]:
        '''Get (width, height) of an image without loading it entirely.'''
        with Image.open(image_path) as img:
            return img.width, img.height

    @staticmethod
    def guess_mime_type(file_path: str) -> str:
        '''Guess MIME type from file extension.'''
        ext: str = Path(file_path).suffix.lower()
        mime_map: dict[str, str] = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
        }
        return mime_map.get(ext, 'application/octet-stream')

