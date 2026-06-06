from fastapi import Header, HTTPException

async def verify_device_id(x_device_id: str = Header(...)):
    if not x_device_id:
        raise HTTPException(status_code=401, detail='Missing device ID')
    return x_device_id