from fastapi import APIRouter

router = APIRouter()

@router.get('/ai-models')
async def list_ai_models():
    return {'data': []}

@router.post('/ai-models')
async def create_ai_model():
    return {'data': {}}

@router.patch('/ai-models/{model_id}')
async def update_ai_model(model_id: str):
    return {'data': {}}

@router.delete('/ai-models/{model_id}')
async def delete_ai_model(model_id: str):
    return {'message': 'deleted'}

@router.post('/ai-models/{model_id}/test')
async def test_ai_model(model_id: str):
    return {'data': {'success': True, 'latency_ms': 0}}

@router.post('/ai-models/{model_id}/activate')
async def activate_ai_model(model_id: str):
    return {'data': {}}

@router.get('/ai-models/providers')
async def get_providers():
    return {'data': ['openai', 'deepseek', 'custom']}

@router.get('/app')
async def get_app_settings():
    return {'data': {}}

@router.put('/app')
async def update_app_settings():
    return {'data': {}}

@router.post('/app/reset')
async def reset_app_settings():
    return {'data': {}}