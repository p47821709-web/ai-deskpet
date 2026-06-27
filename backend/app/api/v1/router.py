from fastapi import APIRouter
from app.api.v1 import memories, generation

api_router = APIRouter()
api_router.include_router(memories.router, prefix='/memories', tags=['Memories'])
api_router.include_router(generation.router, prefix='/generations', tags=['Generation'])