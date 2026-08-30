import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, NotFoundError
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate


class OrganizationService:
    @staticmethod
    async def get_by_id(db: AsyncSession, org_id: uuid.UUID) -> Organization:
        stmt = select(Organization).where(Organization.id == org_id)
        result = await db.execute(stmt)
        org = result.scalar_one_or_none()
        if not org:
            raise NotFoundError(
                message=f"Organization with id '{org_id}' was not found.",
                error_code="ORGANIZATION_NOT_FOUND",
            )
        return org

    @staticmethod
    async def get_by_name(db: AsyncSession, name: str) -> Optional[Organization]:
        stmt = select(Organization).where(Organization.name == name)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, org_in: OrganizationCreate) -> Organization:
        existing = await OrganizationService.get_by_name(db, org_in.name)
        if existing:
            raise DuplicateResourceError(
                message=f"An organization named '{org_in.name}' already exists.",
                error_code="ORGANIZATION_ALREADY_EXISTS",
            )

        org = Organization(
            name=org_in.name,
            description=org_in.description,
            industry=org_in.industry,
        )
        db.add(org)
        await db.flush()
        await db.refresh(org)
        return org

    @staticmethod
    async def update(
        db: AsyncSession, org_id: uuid.UUID, org_in: OrganizationUpdate
    ) -> Organization:
        org = await OrganizationService.get_by_id(db, org_id)

        if org_in.name is not None and org_in.name != org.name:
            existing = await OrganizationService.get_by_name(db, org_in.name)
            if existing and existing.id != org.id:
                raise DuplicateResourceError(
                    message=f"An organization named '{org_in.name}' already exists.",
                    error_code="ORGANIZATION_ALREADY_EXISTS",
                )
            org.name = org_in.name

        if org_in.description is not None:
            org.description = org_in.description

        if org_in.industry is not None:
            org.industry = org_in.industry

        await db.flush()
        await db.refresh(org)
        return org


organization_service = OrganizationService()
