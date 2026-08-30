"""Software service — CRUD for software records and asset-software relationships.

Software records are organization-scoped. The same product may exist in
multiple organizations as separate records.
"""
import uuid
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, NotFoundError, BadRequestError
from app.models.asset import Asset
from app.models.asset_software import AssetSoftware
from app.models.enums import AuditAction
from app.models.software import Software
from app.models.user import User
from app.schemas.software import (
    AssetSoftwareAttach,
    AssetSoftwareResponse,
    SoftwareCreate,
    SoftwarePatch,
    SoftwareUpdate,
)
from app.services.audit_service import audit_service


class SoftwareService:

    # ------------------------------------------------------------------
    # Software CRUD
    # ------------------------------------------------------------------

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        software_id: uuid.UUID,
        organization_id: uuid.UUID,
    ) -> Software:
        stmt = select(Software).where(
            Software.id == software_id,
            Software.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        sw = result.scalar_one_or_none()
        if not sw:
            raise NotFoundError(
                message=f"Software '{software_id}' was not found in your organization.",
                error_code="SOFTWARE_NOT_FOUND",
            )
        return sw

    @staticmethod
    async def _check_unique(
        db: AsyncSession,
        organization_id: uuid.UUID,
        vendor: str,
        product_name: str,
        product_version: str,
        exclude_id: Optional[uuid.UUID] = None,
    ) -> None:
        stmt = select(Software).where(
            Software.organization_id == organization_id,
            Software.vendor == vendor,
            Software.product_name == product_name,
            Software.product_version == product_version,
        )
        if exclude_id:
            stmt = stmt.where(Software.id != exclude_id)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise DuplicateResourceError(
                message=(
                    f"Software '{vendor} {product_name} {product_version}' "
                    "already exists in your organization."
                ),
                error_code="SOFTWARE_ALREADY_EXISTS",
            )

    @staticmethod
    async def create(
        db: AsyncSession,
        sw_in: SoftwareCreate,
        current_user: User,
    ) -> Software:
        await SoftwareService._check_unique(
            db,
            current_user.organization_id,
            sw_in.vendor,
            sw_in.product_name,
            sw_in.product_version,
        )
        sw = Software(
            id=uuid.uuid4(),
            organization_id=current_user.organization_id,
            **sw_in.model_dump(),
        )
        db.add(sw)
        await db.flush()
        await db.refresh(sw)
        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.SOFTWARE_CREATED,
            resource_type="software",
            resource_id=str(sw.id),
            metadata={"vendor": sw.vendor, "product": sw.product_name, "version": sw.product_version},
        )
        return sw

    @staticmethod
    async def list_software(
        db: AsyncSession,
        organization_id: uuid.UUID,
        *,
        page: int = 1,
        limit: int = 20,
        vendor: Optional[str] = None,
        product_name: Optional[str] = None,
    ) -> Tuple[List[Software], int]:
        offset = (page - 1) * limit
        base = select(Software).where(Software.organization_id == organization_id)
        if vendor:
            base = base.where(Software.vendor.ilike(f"%{vendor}%"))
        if product_name:
            base = base.where(Software.product_name.ilike(f"%{product_name}%"))
        total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
        stmt = base.order_by(Software.vendor, Software.product_name).offset(offset).limit(limit)
        items = list((await db.execute(stmt)).scalars().all())
        return items, total

    @staticmethod
    async def update(
        db: AsyncSession,
        software_id: uuid.UUID,
        sw_in: SoftwareUpdate,
        current_user: User,
    ) -> Software:
        sw = await SoftwareService.get_by_id(db, software_id, current_user.organization_id)
        await SoftwareService._check_unique(
            db, current_user.organization_id,
            sw_in.vendor, sw_in.product_name, sw_in.product_version,
            exclude_id=software_id,
        )
        for field, value in sw_in.model_dump().items():
            setattr(sw, field, value)
        await db.flush()
        await db.refresh(sw)
        await audit_service.log(
            db, user=current_user,
            action=AuditAction.SOFTWARE_UPDATED,
            resource_type="software",
            resource_id=str(sw.id),
        )
        return sw

    @staticmethod
    async def patch(
        db: AsyncSession,
        software_id: uuid.UUID,
        sw_in: SoftwarePatch,
        current_user: User,
    ) -> Software:
        sw = await SoftwareService.get_by_id(db, software_id, current_user.organization_id)
        update_data = sw_in.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(sw, field, value)
        await db.flush()
        await db.refresh(sw)
        await audit_service.log(
            db, user=current_user,
            action=AuditAction.SOFTWARE_UPDATED,
            resource_type="software",
            resource_id=str(sw.id),
            metadata={"fields": list(update_data.keys())},
        )
        return sw

    @staticmethod
    async def delete(
        db: AsyncSession,
        software_id: uuid.UUID,
        current_user: User,
    ) -> None:
        sw = await SoftwareService.get_by_id(db, software_id, current_user.organization_id)
        sw_name = f"{sw.vendor} {sw.product_name}"
        await db.delete(sw)
        await db.flush()
        await audit_service.log(
            db, user=current_user,
            action=AuditAction.SOFTWARE_DELETED,
            resource_type="software",
            resource_id=str(software_id),
            metadata={"name": sw_name},
        )

    # ------------------------------------------------------------------
    # Asset-Software relationship management
    # ------------------------------------------------------------------

    @staticmethod
    async def attach_to_asset(
        db: AsyncSession,
        asset_id: uuid.UUID,
        attach_in: AssetSoftwareAttach,
        current_user: User,
    ) -> AssetSoftware:
        # Verify asset belongs to the user's org
        asset_result = await db.execute(
            select(Asset).where(
                Asset.id == asset_id,
                Asset.organization_id == current_user.organization_id,
            )
        )
        if not asset_result.scalar_one_or_none():
            raise NotFoundError(
                message=f"Asset '{asset_id}' was not found in your organization.",
                error_code="ASSET_NOT_FOUND",
            )

        # Verify software belongs to the user's org
        sw = await SoftwareService.get_by_id(db, attach_in.software_id, current_user.organization_id)

        # Check that pair doesn't already exist
        existing = await db.execute(
            select(AssetSoftware).where(
                AssetSoftware.asset_id == asset_id,
                AssetSoftware.software_id == attach_in.software_id,
            )
        )
        if existing.scalar_one_or_none():
            raise DuplicateResourceError(
                message=(
                    f"Software '{sw.vendor} {sw.product_name}' is already attached to this asset."
                ),
                error_code="SOFTWARE_ALREADY_ATTACHED",
            )

        link = AssetSoftware(
            id=uuid.uuid4(),
            asset_id=asset_id,
            software_id=attach_in.software_id,
            installed_version=attach_in.installed_version,
            installation_path=attach_in.installation_path,
            source=attach_in.source,
            is_active=attach_in.is_active,
        )
        db.add(link)
        await db.flush()
        await db.refresh(link)

        await audit_service.log(
            db, user=current_user,
            action=AuditAction.SOFTWARE_ATTACHED,
            resource_type="asset_software",
            resource_id=str(link.id),
            metadata={"asset_id": str(asset_id), "software_id": str(attach_in.software_id)},
        )
        return link

    @staticmethod
    async def list_asset_software(
        db: AsyncSession,
        asset_id: uuid.UUID,
        organization_id: uuid.UUID,
    ) -> List[AssetSoftwareResponse]:
        # Confirm asset is in org
        asset_result = await db.execute(
            select(Asset).where(
                Asset.id == asset_id,
                Asset.organization_id == organization_id,
            )
        )
        if not asset_result.scalar_one_or_none():
            raise NotFoundError(
                message=f"Asset '{asset_id}' was not found in your organization.",
                error_code="ASSET_NOT_FOUND",
            )

        stmt = (
            select(AssetSoftware, Software)
            .join(Software, AssetSoftware.software_id == Software.id)
            .where(AssetSoftware.asset_id == asset_id)
            .order_by(Software.vendor, Software.product_name)
        )
        result = await db.execute(stmt)
        rows = result.all()

        return [
            AssetSoftwareResponse(
                id=as_row.id,
                software_id=sw_row.id,
                vendor=sw_row.vendor,
                product_name=sw_row.product_name,
                product_version=sw_row.product_version,
                installed_version=as_row.installed_version,
                installation_path=as_row.installation_path,
                source=as_row.source,
                cpe=sw_row.cpe,
                is_active=as_row.is_active,
                first_seen=as_row.first_seen,
                last_seen=as_row.last_seen,
            )
            for as_row, sw_row in rows
        ]

    @staticmethod
    async def detach_from_asset(
        db: AsyncSession,
        asset_id: uuid.UUID,
        software_id: uuid.UUID,
        current_user: User,
    ) -> None:
        # Verify asset is in org
        asset_result = await db.execute(
            select(Asset).where(
                Asset.id == asset_id,
                Asset.organization_id == current_user.organization_id,
            )
        )
        if not asset_result.scalar_one_or_none():
            raise NotFoundError(
                message=f"Asset '{asset_id}' was not found in your organization.",
                error_code="ASSET_NOT_FOUND",
            )

        result = await db.execute(
            select(AssetSoftware).where(
                AssetSoftware.asset_id == asset_id,
                AssetSoftware.software_id == software_id,
            )
        )
        link = result.scalar_one_or_none()
        if not link:
            raise NotFoundError(
                message="This software is not attached to the specified asset.",
                error_code="ASSET_SOFTWARE_NOT_FOUND",
            )

        await db.delete(link)
        await db.flush()
        await audit_service.log(
            db, user=current_user,
            action=AuditAction.SOFTWARE_DETACHED,
            resource_type="asset_software",
            resource_id=str(link.id),
            metadata={"asset_id": str(asset_id), "software_id": str(software_id)},
        )


software_service = SoftwareService()
