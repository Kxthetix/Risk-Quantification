"""Threat Scenario management & comparative analysis service (Phase 7)."""
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AuthorizationError, BadRequestError, NotFoundError
from app.engines.path_scoring_engine import DiscoveredPath
from app.engines.threat_scenario_engine import ThreatScenarioEngine
from app.models.asset import Asset
from app.models.enums import AuditAction, ThreatScenarioStatus
from app.models.financial_assessment import FinancialAssessment
from app.models.threat_scenario import ThreatScenario
from app.models.user import User
from app.schemas.threat_scenario import (
    ThreatScenarioCompareItem,
    ThreatScenarioCompareResponse,
    ThreatScenarioCreate,
    ThreatScenarioUpdate,
)
from app.services.audit_service import audit_service


class ThreatScenarioService:
    """Manages threat scenarios, adversary models, and comparative evaluations."""

    async def create_scenario(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        payload: ThreatScenarioCreate,
        current_user: User,
    ) -> ThreatScenario:
        """Create a custom threat scenario."""
        if payload.target_asset_id:
            asset = await db.get(Asset, payload.target_asset_id)
            if not asset or asset.organization_id != organization_id:
                raise NotFoundError(
                    message=f"Target asset {payload.target_asset_id} not found in this organization.",
                    error_code="TARGET_ASSET_NOT_FOUND",
                )

        scenario = ThreatScenario(
            organization_id=organization_id,
            name=payload.name,
            description=payload.description,
            attacker_profile=payload.attacker_profile,
            objective=payload.objective,
            entry_point=payload.entry_point,
            target_asset_id=payload.target_asset_id,
            target_asset_name=payload.target_asset_name,
            probability=payload.probability,
            confidence=payload.confidence,
            risk_score=payload.risk_score,
            financial_assessment_id=payload.financial_assessment_id,
            scenario_metadata=payload.scenario_metadata,
            status=ThreatScenarioStatus.ACTIVE,
        )
        db.add(scenario)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.THREAT_SCENARIO_CREATED,
            resource_type="threat_scenario",
            resource_id=str(scenario.id),
            metadata={"name": scenario.name, "attacker_profile": scenario.attacker_profile.value},
        )
        await db.commit()
        await db.refresh(scenario)
        return scenario

    async def get_scenarios(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        status: Optional[ThreatScenarioStatus] = None,
    ) -> List[ThreatScenario]:
        """List all threat scenarios for an organization with optional status filtering."""
        stmt = (
            select(ThreatScenario)
            .options(
                selectinload(ThreatScenario.financial_assessment),
                selectinload(ThreatScenario.attack_paths),
            )
            .where(ThreatScenario.organization_id == organization_id)
        )
        if status:
            stmt = stmt.where(ThreatScenario.status == status)

        stmt = stmt.order_by(desc(ThreatScenario.risk_score))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_scenario(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        scenario_id: uuid.UUID,
    ) -> ThreatScenario:
        """Retrieve a specific threat scenario ensuring tenant isolation."""
        stmt = (
            select(ThreatScenario)
            .options(
                selectinload(ThreatScenario.financial_assessment),
                selectinload(ThreatScenario.attack_paths),
            )
            .where(
                ThreatScenario.id == scenario_id,
                ThreatScenario.organization_id == organization_id,
            )
        )
        result = await db.execute(stmt)
        scenario = result.scalar_one_or_none()
        if not scenario:
            raise NotFoundError(
                message=f"Threat scenario {scenario_id} not found.",
                error_code="THREAT_SCENARIO_NOT_FOUND",
            )
        return scenario

    async def update_scenario(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        scenario_id: uuid.UUID,
        payload: ThreatScenarioUpdate,
        current_user: User,
    ) -> ThreatScenario:
        """Update an existing threat scenario."""
        scenario = await self.get_scenario(db, organization_id, scenario_id)
        update_data = payload.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(scenario, k, v)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.THREAT_SCENARIO_UPDATED,
            resource_type="threat_scenario",
            resource_id=str(scenario.id),
            metadata={"updated_fields": list(update_data.keys())},
        )
        await db.commit()
        await db.refresh(scenario)
        return scenario

    async def delete_scenario(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        scenario_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Delete a threat scenario."""
        scenario = await self.get_scenario(db, organization_id, scenario_id)
        await db.delete(scenario)
        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.THREAT_SCENARIO_DELETED,
            resource_type="threat_scenario",
            resource_id=str(scenario_id),
            metadata={},
        )
        await db.commit()

    async def generate_scenarios(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        current_user: User,
        target_asset_id: Optional[uuid.UUID] = None,
    ) -> List[ThreatScenario]:
        """Auto-generate baseline threat scenarios from predefined templates and assets."""
        generated: List[ThreatScenario] = []

        # 1. Standard Templates
        templates = ThreatScenarioEngine.get_standard_templates()
        for tpl in templates:
            # Check if template already exists
            existing_stmt = select(ThreatScenario).where(
                ThreatScenario.organization_id == organization_id,
                ThreatScenario.name == tpl.name,
            )
            res = await db.execute(existing_stmt)
            if res.scalar_one_or_none():
                continue

            scenario = ThreatScenario(
                organization_id=organization_id,
                name=tpl.name,
                description=tpl.description,
                attacker_profile=tpl.attacker_profile,
                objective=tpl.objective,
                entry_point="External Perimeter",
                target_asset_id=target_asset_id,
                probability=tpl.default_probability,
                confidence=tpl.default_confidence,
                risk_score=round(tpl.default_probability * 80.0, 1),
                status=ThreatScenarioStatus.ACTIVE,
                scenario_metadata={"techniques": tpl.techniques},
            )
            db.add(scenario)
            generated.append(scenario)

        if generated:
            await db.commit()
            for s in generated:
                await db.refresh(s)

        return await self.get_scenarios(db, organization_id)

    async def compare_scenarios(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        scenario_id: Optional[uuid.UUID] = None,
    ) -> ThreatScenarioCompareResponse:
        """Perform comparative analysis across threat scenarios."""
        scenarios = await self.get_scenarios(db, organization_id, status=ThreatScenarioStatus.ACTIVE)
        if not scenarios:
            return ThreatScenarioCompareResponse(scenarios=[])

        items: List[ThreatScenarioCompareItem] = []
        highest_risk_id = scenarios[0].id if scenarios else None
        highest_loss_id = scenarios[0].id if scenarios else None
        max_risk = -1.0
        max_loss = -1.0

        for sc in scenarios:
            # Derive financial losses if linked
            fa: Optional[FinancialAssessment] = sc.financial_assessment
            exp_loss = float(fa.expected_loss if fa else 0.0)
            p90_loss = float(fa.p90_loss if fa else 0.0)

            crit = "HIGH"
            if sc.target_asset_id:
                asset = await db.get(Asset, sc.target_asset_id)
                if asset and asset.criticality:
                    crit = asset.criticality.value

            path_len = len(sc.attack_paths[0].nodes) if sc.attack_paths and sc.attack_paths[0].nodes else 3

            if sc.risk_score > max_risk:
                max_risk = sc.risk_score
                highest_risk_id = sc.id

            if exp_loss > max_loss:
                max_loss = exp_loss
                highest_loss_id = sc.id

            items.append(
                ThreatScenarioCompareItem(
                    scenario_id=sc.id,
                    name=sc.name,
                    attacker_profile=sc.attacker_profile.value,
                    likelihood=sc.probability,
                    impact=sc.risk_score,
                    risk_score=sc.risk_score,
                    expected_loss=round(exp_loss, 2),
                    p90_loss=round(p90_loss, 2),
                    target_criticality=crit,
                    confidence=sc.confidence,
                    path_length=path_len,
                )
            )

        return ThreatScenarioCompareResponse(
            scenarios=items,
            highest_risk_scenario_id=highest_risk_id,
            highest_loss_scenario_id=highest_loss_id,
        )


threat_scenario_service = ThreatScenarioService()
