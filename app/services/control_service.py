"""Control Service for Defensive Security Controls & Effectiveness Catalog (Phase 8)."""
from typing import List, Optional
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.control import Control
from app.models.control_effectiveness import ControlEffectiveness
from app.models.enums import AuditAction, ControlType
from app.models.user import User
from app.schemas.control import (
    ControlCreate,
    ControlEffectivenessCreate,
    ControlUpdate,
)
from app.services.audit_service import audit_service

# Enterprise baseline controls seed catalog
DEFAULT_CONTROLS_SEED = [
    {
        "name": "Web Application Firewall (WAF)",
        "control_type": ControlType.WAF,
        "description": "Layer 7 inspection blocking OWASP Top 10 and unauthenticated web exploits.",
        "implementation_cost": 450000.0,
        "annual_cost": 150000.0,
        "effectiveness": 0.85,
        "threat_mappings": [
            {"threat_type": "WEB_EXPLOITATION", "risk_factor": "EXPLOITATION_LIKELIHOOD", "reduction_factor": 0.85},
        ],
    },
    {
        "name": "Endpoint Detection & Response (EDR)",
        "control_type": ControlType.EDR,
        "description": "Continuous endpoint monitoring, behavioral anomaly detection, and automated isolation.",
        "implementation_cost": 800000.0,
        "annual_cost": 300000.0,
        "effectiveness": 0.90,
        "threat_mappings": [
            {"threat_type": "RANSOMWARE", "risk_factor": "IMPACT_MAGNITUDE", "reduction_factor": 0.90},
            {"threat_type": "PRIVILEGE_ESCALATION", "risk_factor": "EXPLOITATION_LIKELIHOOD", "reduction_factor": 0.80},
        ],
    },
    {
        "name": "Multi-Factor Authentication (MFA)",
        "control_type": ControlType.MFA,
        "description": "FIDO2 / Hardware token enforcement across corporate SSO and VPN endpoints.",
        "implementation_cost": 350000.0,
        "annual_cost": 120000.0,
        "effectiveness": 0.95,
        "threat_mappings": [
            {"threat_type": "CREDENTIAL_THEFT", "risk_factor": "EXPLOITATION_LIKELIHOOD", "reduction_factor": 0.95},
        ],
    },
    {
        "name": "Micro-Segmentation & Zero Trust Isolation",
        "control_type": ControlType.NETWORK_SEGMENTATION,
        "description": "Restricts east-west traffic between DMZ web tiers, application clusters, and database rings.",
        "implementation_cost": 1200000.0,
        "annual_cost": 250000.0,
        "effectiveness": 0.85,
        "threat_mappings": [
            {"threat_type": "LATERAL_MOVEMENT", "risk_factor": "ATTACK_PATH_REACHABILITY", "reduction_factor": 0.85},
        ],
    },
]


class ControlService:
    """Manages defensive controls catalog and empirical effectiveness factors."""

    async def create_control(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        payload: ControlCreate,
        current_user: User,
    ) -> Control:
        """Register a defensive security control."""
        ctrl = Control(
            organization_id=organization_id,
            name=payload.name,
            control_type=payload.control_type,
            description=payload.description,
            implementation_cost=payload.implementation_cost,
            annual_cost=payload.annual_cost,
            effectiveness=payload.effectiveness,
            enabled=payload.enabled,
        )
        db.add(ctrl)
        await db.flush()

        if payload.effectiveness_mappings:
            for em in payload.effectiveness_mappings:
                eff_row = ControlEffectiveness(
                    control_id=ctrl.id,
                    threat_type=em.threat_type,
                    risk_factor=em.risk_factor,
                    reduction_factor=em.reduction_factor,
                    confidence=em.confidence,
                    evidence=em.evidence,
                )
                db.add(eff_row)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.CONTROL_CREATED,
            resource_type="control",
            resource_id=str(ctrl.id),
            metadata={"name": ctrl.name, "type": ctrl.control_type.value},
        )
        await db.commit()
        return await self.get_control(db, organization_id, ctrl.id)

    async def get_controls(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        control_type: Optional[ControlType] = None,
        enabled: Optional[bool] = None,
    ) -> List[Control]:
        """List all controls configured for an organization."""
        stmt = (
            select(Control)
            .options(selectinload(Control.effectiveness_mappings))
            .where(Control.organization_id == organization_id)
        )
        if control_type:
            stmt = stmt.where(Control.control_type == control_type)
        if enabled is not None:
            stmt = stmt.where(Control.enabled == enabled)

        stmt = stmt.order_by(Control.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def get_control(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        control_id: uuid.UUID,
    ) -> Control:
        """Fetch an individual control ensuring multi-tenant isolation."""
        stmt = (
            select(Control)
            .options(selectinload(Control.effectiveness_mappings))
            .where(
                Control.id == control_id,
                Control.organization_id == organization_id,
            )
        )
        res = await db.execute(stmt)
        ctrl = res.scalar_one_or_none()
        if not ctrl:
            raise NotFoundError(
                message=f"Control {control_id} not found.",
                error_code="CONTROL_NOT_FOUND",
            )
        return ctrl

    async def update_control(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        control_id: uuid.UUID,
        payload: ControlUpdate,
        current_user: User,
    ) -> Control:
        """Update properties on an existing defensive control."""
        ctrl = await self.get_control(db, organization_id, control_id)
        update_data = payload.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(ctrl, k, v)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.CONTROL_UPDATED,
            resource_type="control",
            resource_id=str(ctrl.id),
            metadata={"updated_fields": list(update_data.keys())},
        )
        await db.commit()
        return await self.get_control(db, organization_id, ctrl.id)

    async def delete_control(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        control_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Delete a control."""
        ctrl = await self.get_control(db, organization_id, control_id)
        await db.delete(ctrl)
        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.CONTROL_DELETED,
            resource_type="control",
            resource_id=str(control_id),
            metadata={},
        )
        await db.commit()

    async def add_effectiveness_mapping(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        control_id: uuid.UUID,
        payload: ControlEffectivenessCreate,
        current_user: User,
    ) -> ControlEffectiveness:
        """Add targeted threat attenuation factor mapping to a control."""
        ctrl = await self.get_control(db, organization_id, control_id)
        eff = ControlEffectiveness(
            control_id=ctrl.id,
            threat_type=payload.threat_type,
            risk_factor=payload.risk_factor,
            reduction_factor=payload.reduction_factor,
            confidence=payload.confidence,
            evidence=payload.evidence,
        )
        db.add(eff)
        await db.commit()
        await db.refresh(eff)
        return eff

    async def seed_default_controls_if_empty(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> List[Control]:
        """Populate enterprise baseline security controls if none exist."""
        existing = await self.get_controls(db, organization_id)
        if existing:
            return existing

        created = []
        for def_c in DEFAULT_CONTROLS_SEED:
            ctrl = Control(
                organization_id=organization_id,
                name=def_c["name"],
                control_type=def_c["control_type"],
                description=def_c["description"],
                implementation_cost=def_c["implementation_cost"],
                annual_cost=def_c["annual_cost"],
                effectiveness=def_c["effectiveness"],
                enabled=True,
            )
            db.add(ctrl)
            await db.flush()

            for tm in def_c["threat_mappings"]:
                eff = ControlEffectiveness(
                    control_id=ctrl.id,
                    threat_type=tm["threat_type"],
                    risk_factor=tm["risk_factor"],
                    reduction_factor=tm["reduction_factor"],
                    confidence=0.85,
                )
                db.add(eff)
            created.append(ctrl)

        await db.commit()
        return await self.get_controls(db, organization_id)


control_service = ControlService()
