from app.core.database import SessionLocal

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_device_id(x_device_id: str | None = None):
    return x_device_id