from fastapi import APIRouter

router = APIRouter()

@router.post('/sessions')
async def create_session():
    return {'data': {}}

@router.get('/sessions')
async def list_sessions():
    return {'data': []}

@router.delete('/sessions/{session_id}')
async def delete_session(session_id: str):
    return {'message': 'deleted'}

@router.post('/sessions/{session_id}/messages')
async def send_message(session_id: str):
    return {'data': {}}

@router.get('/sessions/{session_id}/messages')
async def get_messages(session_id: str):
    return {'data': []}

@router.post('/sessions/{session_id}/summary')
async def get_summary(session_id: str):
    return {'data': {}}