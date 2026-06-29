from fastapi import APIRouter
from app.api.v1 import pets, memories, generation

api_router = APIRouter()
api_router.include_router(pets.router, prefix='/pets', tags=['Pets'])
api_router.include_router(memories.router, prefix='/memories', tags=['Memories'])
api_router.include_router(generation.router, prefix='/generations', tags=['Generation'])