from fastapi import APIRouter

router = APIRouter()

@router.get('')
async def list_pets():
    return {'data': [], 'meta': {'page': 1, 'size': 20, 'total': 0}}

@router.post('')
async def create_pet():
    return {'data': {}}

@router.get('/{pet_id}')
async def get_pet(pet_id: str):
    return {'data': {}}

@router.patch('/{pet_id}')
async def update_pet(pet_id: str):
    return {'data': {}}

@router.delete('/{pet_id}')
async def delete_pet(pet_id: str):
    return {'message': 'deleted'}

@router.patch('/{pet_id}/position')
async def update_position(pet_id: str):
    return {'data': {}}

@router.patch('/{pet_id}/status')
async def update_status(pet_id: str):
    return {'data': {}}