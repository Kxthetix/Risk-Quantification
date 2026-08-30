"""Background worker tasks for asynchronous single and bulk vulnerability validation."""
import asyncio
from typing import List, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.database import async_session_factory
from app.models.user import User
from app.services.validation_service import validation_service


async def _async_run_validation(
    asset_vulnerability_id: uuid.UUID,
    user: User,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """Coroutine for async single validation."""
    async with session_factory() as session:
        try:
            await validation_service.run_validation(
                db=session,
                asset_vulnerability_id=asset_vulnerability_id,
                current_user=user,
            )
        except Exception as exc:
            # Avoid crashing unhandled in background task
            print(f"[ERROR] Background validation failed for {asset_vulnerability_id}: {exc}")


async def _async_run_bulk_validation(
    user: User,
    asset_ids: Optional[List[uuid.UUID]],
    organization_id: Optional[uuid.UUID],
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """Coroutine for async bulk validation."""
    async with session_factory() as session:
        try:
            await validation_service.run_bulk_validation(
                db=session,
                current_user=user,
                asset_ids=asset_ids,
                organization_id=organization_id,
            )
        except Exception as exc:
            print(f"[ERROR] Background bulk validation failed: {exc}")


def dispatch_validation_task(
    asset_vulnerability_id: uuid.UUID,
    user: User,
    session_factory: Optional[async_sessionmaker[AsyncSession]] = None,
) -> asyncio.Task:
    """Dispatch non-blocking single asset vulnerability validation."""
    factory = session_factory or async_session_factory
    return asyncio.create_task(
        _async_run_validation(
            asset_vulnerability_id=asset_vulnerability_id,
            user=user,
            session_factory=factory,
        )
    )


def dispatch_bulk_validation_task(
    user: User,
    asset_ids: Optional[List[uuid.UUID]] = None,
    organization_id: Optional[uuid.UUID] = None,
    session_factory: Optional[async_sessionmaker[AsyncSession]] = None,
) -> asyncio.Task:
    """Dispatch non-blocking bulk asset vulnerability validation."""
    factory = session_factory or async_session_factory
    return asyncio.create_task(
        _async_run_bulk_validation(
            user=user,
            asset_ids=asset_ids,
            organization_id=organization_id,
            session_factory=factory,
        )
    )
