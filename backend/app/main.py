from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.exception_handler import register_exception_handlers

app = FastAPI(
    title='AI DeskPet API',
    version='1.0.0',
    description='AI DeskPet Backend API',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router, prefix='/api/v1')
register_exception_handlers(app)

@app.get('/api/v1/system/health')
def health_check():
    return {'status': 'ok', 'version': '1.0.0'}
