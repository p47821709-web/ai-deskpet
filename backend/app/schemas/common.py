from pydantic import BaseModel
from typing import Generic, TypeVar, List, Optional, Any

T = TypeVar("T")

class PaginationMeta(BaseModel):
    page: int = 1
    size: int = 20
    total: int = 0

class ApiResponse(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None
    meta: Optional[PaginationMeta] = None
