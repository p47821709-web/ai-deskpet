import logging

logger = logging.getLogger(__name__)


class AppException(Exception):
    '''Base application exception.'''

    def __init__(self, code: int = 400, message: str = 'Bad Request') -> None:
        self.code = code
        self.message = message
        logger.warning('AppException: %d - %s', code, message)
        super().__init__(message)


class NotFoundException(AppException):
    '''Resource not found (404).'''

    def __init__(self, message: str = 'Not Found') -> None:
        super().__init__(404, message)


class ValidationException(AppException):
    '''Validation error (422).'''

    def __init__(self, message: str = 'Validation Error') -> None:
        super().__init__(422, message)


class FileUploadException(AppException):
    '''General file upload error (400).'''

    def __init__(self, message: str = 'File upload failed') -> None:
        super().__init__(400, message)


class FileTooLargeException(AppException):
    '''File exceeds maximum size limit (413).'''

    def __init__(self, max_size_mb: int = 10) -> None:
        message = f'File size exceeds the maximum limit of {max_size_mb}MB'
        super().__init__(413, message)


class UnsupportedFileTypeException(AppException):
    '''Unsupported file type (415).'''

    def __init__(self, allowed_types: str = '') -> None:
        message = f'Unsupported file type. Allowed: {allowed_types}' if allowed_types else 'Unsupported file type'
        super().__init__(415, message)
