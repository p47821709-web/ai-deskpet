from fastapi import APIRouter

router = APIRouter()

@router.post('/register')
async def register_user():
    return {'data': {}}

@router.get('/me')
async def get_me():
    return {'data': {}}

@router.patch('/me')
async def update_me():
    return {'data': {}}

@router.delete('/me')
async def delete_me():
    return {'message': 'deleted'}