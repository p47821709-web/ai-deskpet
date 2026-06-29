from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

# Convert sync database URL to async (sqlite -> sqlite+aiosqlite)
_url = settings.database_url
if _url.startswith('sqlite:///'):
    _url = _url.replace('sqlite:///', 'sqlite+aiosqlite:///', 1)

engine = create_async_engine(_url, echo=False)
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

from app.models.base import Base

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
