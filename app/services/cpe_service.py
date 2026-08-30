"""CPE dictionary management and parsing service."""
from typing import Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cpe import CPE
from app.utils.cpe_utils import parse_cpe_23


class CPEService:
    """Service for managing CPE dictionary entities."""

    @staticmethod
    async def get_or_create(db: AsyncSession, cpe_string: str) -> CPE:
        """Find an existing CPE record by canonical CPE 2.3 string or parse and create one."""
        cleaned = cpe_string.strip().lower()
        result = await db.execute(select(CPE).where(CPE.cpe_string == cleaned))
        cpe = result.scalar_one_or_none()
        if cpe:
            return cpe

        # Parse attributes
        parsed = parse_cpe_23(cleaned) or {}
        cpe = CPE(
            id=uuid.uuid4(),
            cpe_string=cleaned,
            part=parsed.get("part", "a"),
            vendor=parsed.get("vendor", "*"),
            product=parsed.get("product", "*"),
            version=parsed.get("version", "*"),
            update=parsed.get("update", "*"),
            edition=parsed.get("edition", "*"),
            language=parsed.get("language", "*"),
        )
        db.add(cpe)
        await db.flush()
        await db.refresh(cpe)
        return cpe

    @staticmethod
    async def get_by_id(db: AsyncSession, cpe_id: uuid.UUID) -> Optional[CPE]:
        result = await db.execute(select(CPE).where(CPE.id == cpe_id))
        return result.scalar_one_or_none()


cpe_service = CPEService()
