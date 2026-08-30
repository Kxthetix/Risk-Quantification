"""Threat Scenario Modeling & Comparative Analysis API endpoints (Phase 7)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.enums import ThreatScenarioStatus
from app.models.user import User
from app.schemas.threat_scenario import (
    ScenarioGenerateRequest,
    ThreatScenarioCompareResponse,
    ThreatScenarioCreate,
    ThreatScenarioResponse,
    ThreatScenarioUpdate,
)
from app.services.threat_scenario_service import threat_scenario_service

router = APIRouter(tags=["Threat Scenarios & Adversary Modeling"])


@router.post(
    "/threat-scenarios",
    response_model=ThreatScenarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Custom Threat Scenario",
)
async def create_threat_scenario(
    payload: ThreatScenarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatScenarioResponse:
    """Create a customized adversary attack scenario."""
    scenario = await threat_scenario_service.create_scenario(
        db=db,
        organization_id=current_user.organization_id,
        payload=payload,
        current_user=current_user,
    )
    return ThreatScenarioResponse.model_validate(scenario)


@router.post(
    "/threat-scenarios/generate",
    response_model=List[ThreatScenarioResponse],
    summary="Auto-Generate Baseline Threat Scenarios",
)
async def generate_threat_scenarios(
    payload: ScenarioGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ThreatScenarioResponse]:
    """Generate predefined templates (Ransomware, Exfiltration, Privilege Escalation) and asset scenarios."""
    scenarios = await threat_scenario_service.generate_scenarios(
        db=db,
        organization_id=current_user.organization_id,
        current_user=current_user,
        target_asset_id=payload.target_asset_id,
    )
    return [ThreatScenarioResponse.model_validate(s) for s in scenarios]


@router.get(
    "/threat-scenarios",
    response_model=List[ThreatScenarioResponse],
    summary="List Organization Threat Scenarios",
)
async def list_threat_scenarios(
    status: Optional[ThreatScenarioStatus] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ThreatScenarioResponse]:
    """Retrieve all threat scenarios modeled for the organization."""
    scenarios = await threat_scenario_service.get_scenarios(
        db=db,
        organization_id=current_user.organization_id,
        status=status,
    )
    return [ThreatScenarioResponse.model_validate(s) for s in scenarios]


@router.get(
    "/threat-scenarios/{scenario_id}",
    response_model=ThreatScenarioResponse,
    summary="Get Threat Scenario Details",
)
async def get_threat_scenario(
    scenario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatScenarioResponse:
    """Retrieve details for a single threat scenario."""
    scenario = await threat_scenario_service.get_scenario(
        db=db,
        organization_id=current_user.organization_id,
        scenario_id=scenario_id,
    )
    return ThreatScenarioResponse.model_validate(scenario)


@router.put(
    "/threat-scenarios/{scenario_id}",
    response_model=ThreatScenarioResponse,
    summary="Update Threat Scenario",
)
async def update_threat_scenario(
    scenario_id: uuid.UUID,
    payload: ThreatScenarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatScenarioResponse:
    """Update objectives, probabilities, or metadata on a threat scenario."""
    scenario = await threat_scenario_service.update_scenario(
        db=db,
        organization_id=current_user.organization_id,
        scenario_id=scenario_id,
        payload=payload,
        current_user=current_user,
    )
    return ThreatScenarioResponse.model_validate(scenario)


@router.delete(
    "/threat-scenarios/{scenario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Threat Scenario",
)
async def delete_threat_scenario(
    scenario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a threat scenario."""
    await threat_scenario_service.delete_scenario(
        db=db,
        organization_id=current_user.organization_id,
        scenario_id=scenario_id,
        current_user=current_user,
    )


@router.get(
    "/threat-scenarios/{scenario_id}/compare",
    response_model=ThreatScenarioCompareResponse,
    summary="Compare Threat Scenarios (Risk, Losses, Likelihood)",
)
async def compare_threat_scenarios(
    scenario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatScenarioCompareResponse:
    """Compare all organization threat scenarios on likelihood, impact, risk score, and expected loss."""
    return await threat_scenario_service.compare_scenarios(
        db=db,
        organization_id=current_user.organization_id,
        scenario_id=scenario_id,
    )
