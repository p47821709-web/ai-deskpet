from fastapi import APIRouter
from app.api.v1 import pets, chat, memories, generation, users, settings

api_router = APIRouter()
api_router.include_router(pets.router, prefix='/pets', tags=['Pets'])
api_router.include_router(chat.router, prefix='/chat', tags=['Chat'])
api_router.include_router(memories.router, prefix='/memories', tags=['Memories'])
api_router.include_router(generation.router, prefix='/generations', tags=['Generation'])
api_router.include_router(users.router, prefix='/users', tags=['Users'])
api_router.include_router(settings.router, prefix='/settings', tags=['Settings'])