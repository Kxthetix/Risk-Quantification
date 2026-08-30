"""Graph Service for Network Relationships & Topology Management (Phase 7)."""
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AuthorizationError, BadRequestError, NotFoundError
from app.engines.attack_graph_engine import AttackGraph, AttackGraphEngine
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.business_service import BusinessService
from app.models.enums import AuditAction
from app.models.network_relationship import NetworkRelationship
from app.models.user import User
from app.schemas.network import NetworkRelationshipCreate, NetworkRelationshipUpdate
from app.services.audit_service import audit_service


class GraphService:
    """Manages asset network relationships and generates graph topology."""

    async def create_relationship(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        payload: NetworkRelationshipCreate,
        current_user: User,
    ) -> NetworkRelationship:
        """Register a directional network or dependency relationship between two assets."""
        # Verify source and destination assets belong to this organization
        src = await db.get(Asset, payload.source_asset_id)
        dst = await db.get(Asset, payload.destination_asset_id)

        if not src or src.organization_id != organization_id:
            raise NotFoundError(
                message=f"Source asset {payload.source_asset_id} not found in this organization.",
                error_code="SOURCE_ASSET_NOT_FOUND",
            )
        if not dst or dst.organization_id != organization_id:
            raise NotFoundError(
                message=f"Destination asset {payload.destination_asset_id} not found in this organization.",
                error_code="DEST_ASSET_NOT_FOUND",
            )

        rel = NetworkRelationship(
            organization_id=organization_id,
            source_asset_id=payload.source_asset_id,
            destination_asset_id=payload.destination_asset_id,
            relationship_type=payload.relationship_type,
            protocol=payload.protocol,
            port=payload.port,
            direction=payload.direction,
            verified=payload.verified,
            confidence=payload.confidence,
            evidence=payload.evidence,
        )
        db.add(rel)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.NETWORK_RELATIONSHIP_CREATED,
            resource_type="network_relationship",
            resource_id=str(rel.id),
            metadata={
                "source_asset_id": str(payload.source_asset_id),
                "dest_asset_id": str(payload.destination_asset_id),
                "type": payload.relationship_type.value,
            },
        )
        await db.commit()
        await db.refresh(rel)
        return rel

    async def get_relationships(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> List[NetworkRelationship]:
        """List all network relationships for an organization."""
        stmt = (
            select(NetworkRelationship)
            .where(NetworkRelationship.organization_id == organization_id)
            .order_by(NetworkRelationship.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_relationship(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        relationship_id: uuid.UUID,
    ) -> NetworkRelationship:
        """Retrieve a specific network relationship ensuring tenant boundary."""
        stmt = select(NetworkRelationship).where(
            NetworkRelationship.id == relationship_id,
            NetworkRelationship.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        rel = result.scalar_one_or_none()
        if not rel:
            raise NotFoundError(
                message=f"Network relationship {relationship_id} not found.",
                error_code="NETWORK_RELATIONSHIP_NOT_FOUND",
            )
        return rel

    async def update_relationship(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        relationship_id: uuid.UUID,
        payload: NetworkRelationshipUpdate,
        current_user: User,
    ) -> NetworkRelationship:
        """Update properties on an existing network relationship."""
        rel = await self.get_relationship(db, organization_id, relationship_id)
        update_data = payload.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(rel, k, v)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.NETWORK_RELATIONSHIP_UPDATED,
            resource_type="network_relationship",
            resource_id=str(rel.id),
            metadata={"updated_fields": list(update_data.keys())},
        )
        await db.commit()
        await db.refresh(rel)
        return rel

    async def delete_relationship(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        relationship_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Delete a network relationship."""
        rel = await self.get_relationship(db, organization_id, relationship_id)
        await db.delete(rel)
        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.NETWORK_RELATIONSHIP_DELETED,
            resource_type="network_relationship",
            resource_id=str(relationship_id),
            metadata={},
        )
        await db.commit()

    async def get_attack_graph_for_organization(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> AttackGraph:
        """Assemble complete in-memory graph model for an organization."""
        # 1. Fetch assets
        asset_stmt = (
            select(Asset)
            .where(Asset.organization_id == organization_id)
        )
        asset_res = await db.execute(asset_stmt)
        assets = list(asset_res.scalars().all())

        # 2. Fetch network relationships
        rel_stmt = (
            select(NetworkRelationship)
            .where(NetworkRelationship.organization_id == organization_id)
        )
        rel_res = await db.execute(rel_stmt)
        relationships = list(rel_res.scalars().all())

        # 3. Fetch asset vulnerabilities with vulnerability details
        av_stmt = (
            select(AssetVulnerability)
            .options(selectinload(AssetVulnerability.vulnerability))
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .where(Asset.organization_id == organization_id)
        )
        av_res = await db.execute(av_stmt)
        asset_vulns = list(av_res.scalars().all())

        # 4. Fetch business services
        bs_stmt = (
            select(BusinessService)
            .where(BusinessService.organization_id == organization_id)
        )
        bs_res = await db.execute(bs_stmt)
        services = list(bs_res.scalars().all())

        return AttackGraphEngine.build_graph(
            assets=assets,
            network_relationships=relationships,
            asset_vulnerabilities=asset_vulns,
            business_services=services,
        )


graph_service = GraphService()
