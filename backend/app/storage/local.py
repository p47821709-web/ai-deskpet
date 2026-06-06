import os
import uuid
import logging
from pathlib import Path
from typing import Optional

from app.config import settings
from app.core.exceptions import (
    FileUploadException,
    FileTooLargeException,
    UnsupportedFileTypeException,
)

logger = logging.getLogger(__name__)


class LocalStorage:
    '''Local filesystem storage for uploaded images and generated assets.'''

    def __init__(self) -> None:
        self.upload_dir: str = settings.upload_dir
        self.thumbnail_dir: str = settings.thumbnail_dir
        self.max_size: int = settings.max_upload_size
        self.allowed_ext: tuple[str, ...] = settings.allowed_extensions
        self.allowed_mime: tuple[str, ...] = settings.allowed_mime_types

        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.thumbnail_dir, exist_ok=True)
        logger.info(
            'LocalStorage initialized: upload_dir=%s, thumbnail_dir=%s',
            self.upload_dir, self.thumbnail_dir,
        )

    # ── Public API ──────────────────────────────────────────────

    def save_upload(
        self,
        data: bytes,
        original_filename: str,
        mime_type: str,
    ) -> tuple[str, str, str]:
        '''
        Validate and save an uploaded file.
        Returns (relative_path, absolute_path, storage_filename).
        Raises FileTooLargeException or UnsupportedFileTypeException on failure.
        '''
        self._validate_file_size(data)
        self._validate_file_type(original_filename, mime_type)

        ext: str = self._get_extension(original_filename)
        filename: str = f'{uuid.uuid4().hex}{ext}'
        subdir: str = self._date_subdir()
        rel_path: str = f'{subdir}/{filename}'
        abs_path: str = os.path.join(self.upload_dir, rel_path)

        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, 'wb') as f:
            f.write(data)

        file_size_mb: float = len(data) / (1024 * 1024)
        logger.info(
            'File saved: %s (%.2f MB, type=%s, original=%s)',
            rel_path, file_size_mb, mime_type, original_filename,
        )
        return rel_path, abs_path, filename

    def save_thumbnail(
        self,
        data: bytes,
        filename: str,
        size_label: str = '128x128',
    ) -> str:
        '''
        Save a generated thumbnail.
        Returns the relative path.
        '''
        subdir: str = self._date_subdir()
        thumb_filename: str = f'{size_label}_{filename}'
        rel_path: str = f'{subdir}/{thumb_filename}'
        abs_path: str = os.path.join(self.thumbnail_dir, rel_path)

        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, 'wb') as f:
            f.write(data)

        logger.debug('Thumbnail saved: %s', rel_path)
        return rel_path

    def get_url(self, rel_path: str, is_thumbnail: bool = False) -> str:
        '''
        Convert a relative storage path to a URL path.
        '''
        prefix: str = '/storage/thumbnails' if is_thumbnail else '/storage/uploads'
        return f'{prefix}/{rel_path.replace(os.sep, "/")}'

    def delete(self, rel_path: str) -> bool:
        '''
        Delete a file from storage. Returns True if deleted, False if not found.
        '''
        abs_path: str = os.path.join(self.upload_dir, rel_path)
        if not os.path.exists(abs_path):
            logger.warning('File not found for deletion: %s', rel_path)
            return False
        os.remove(abs_path)
        logger.info('File deleted: %s', rel_path)
        return True

    def get_absolute_path(self, rel_path: str) -> str:
        '''Get the absolute filesystem path for a relative storage path.'''
        return os.path.join(self.upload_dir, rel_path)

    # ── Internal helpers ────────────────────────────────────────

    def _validate_file_size(self, data: bytes) -> None:
        if len(data) > self.max_size:
            max_mb: int = self.max_size // (1024 * 1024)
            logger.warning(
                'File too large: %d bytes (max %d)',
                len(data), self.max_size,
            )
            raise FileTooLargeException(max_mb)

    def _validate_file_type(self, filename: str, mime_type: str) -> None:
        ext: str = self._get_extension(filename).lower()
        if ext not in self.allowed_ext:
            allowed_str: str = ', '.join(self.allowed_ext)
            logger.warning(
                'Unsupported extension: %s (file=%s)', ext, filename,
            )
            raise UnsupportedFileTypeException(allowed_str)

        if mime_type not in self.allowed_mime:
            allowed_str: str = ', '.join(self.allowed_mime)
            logger.warning(
                'Unsupported MIME type: %s (file=%s)', mime_type, filename,
            )
            raise UnsupportedFileTypeException(allowed_str)

    @staticmethod
    def _get_extension(filename: str) -> str:
        _, ext = os.path.splitext(filename)
        return ext.lower()

    @staticmethod
    def _date_subdir() -> str:
        from datetime import datetime
        now: datetime = datetime.now()
        return f'{now.year}/{now.month:02d}'
