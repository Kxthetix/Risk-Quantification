import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine, Base, async_session_factory
import app.models  # Load all models into SQLAlchemy Base metadata
from scripts.seed_data import seed


async def main():
    print("[1/2] Creating all database schema tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  -> Tables created successfully.")

    print("[2/2] Seeding initial development & demo organization data...")
    async with async_session_factory() as session:
        await seed(session)
        await session.commit()
    print("  -> Seeding completed successfully.")

    print("[SUCCESS] Local development database is initialized and ready!")


if __name__ == "__main__":
    asyncio.run(main())
