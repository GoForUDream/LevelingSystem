from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=True)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Idempotent migrations for recurrence columns
    async with engine.begin() as conn:
        migrations = [
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(10)",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_days VARCHAR(100)",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP",
        ]
        for sql in migrations:
            await conn.execute(text(sql))
