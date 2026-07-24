from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os
from dotenv import load_dotenv
from config import (
    DATABASE_ECHO,
    DATABASE_MAX_OVERFLOW,
    DATABASE_POOL_SIZE,
    DATABASE_POOL_TIMEOUT,
)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL is None:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_async_engine(
    DATABASE_URL,
    echo=DATABASE_ECHO,
    pool_pre_ping=True,
    pool_size=DATABASE_POOL_SIZE,
    max_overflow=DATABASE_MAX_OVERFLOW,
    pool_timeout=DATABASE_POOL_TIMEOUT,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_database() -> None:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
