import asyncio

from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select

from db.database import async_session, engine
from main import app
from models.user import User
from services.auth_service import AuthService


async def main() -> None:
    async with async_session() as db:
        user = (await db.execute(select(User).order_by(User.id).limit(1))).scalar_one()
    token = AuthService().create_access_token(
        user.id,
        user.email,
        user.session_version,
    )
    statements: list[str] = []

    def count_statement(*args) -> None:
        statements.append(args[2])

    event.listen(engine.sync_engine, "before_cursor_execute", count_statement)
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://localhost",
        ) as client:
            response = await client.get(
                "/api/stats?period=30d&timezone_offset=420",
                headers={"Authorization": f"Bearer {token}"},
            )
        response.raise_for_status()
    finally:
        event.remove(engine.sync_engine, "before_cursor_execute", count_statement)
        await engine.dispose()

    print(f"stats_sql_executions={len(statements)}")
    if len(statements) > 5:
        raise RuntimeError(f"Stats exceeded SQL budget: {len(statements)} > 5")


if __name__ == "__main__":
    asyncio.run(main())
