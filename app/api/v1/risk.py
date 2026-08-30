"""Cyber Risk Scoring API endpoints (Phase 5)."""
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError
from app.models.enums import RiskAssessmentStatus
from app.models.user import User, UserRole
from app.schemas.risk import (
    AssetRiskResponse,
    OrganizationRiskResponse,
    RiskAssessmentResponse,
    RiskCalculateBulkRequest,
    RiskCalculateRequest,
    RiskCalculateResponse,
    RiskConfigResponse,
    RiskConfigUpdate,
    RiskDistributionResponse,
    TopRisksResponse,
)
from app.services.risk_service import risk_service
from app.workers.risk_worker import dispatch_bulk_risk_task, dispatch_risk_task

router = APIRouter(tags=["Cyber Risk Scoring"])


@router.post(
    "/risk/calculate",
    response_model=RiskCalculateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Calculate Cyber Risk Score for an Asset Vulnerability",
)
async def calculate_risk(
    payload: RiskCalculateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskCalculateResponse:
    """Calculate the multi-factor cyber risk score (0-100) for a validated finding."""
    if payload.synchronous:
        assessment = await risk_service.calculate_risk_for_vulnerability(
            db=db,
            asset_vulnerability_id=payload.asset_vulnerability_id,
            current_user=current_user,
            reason="API synchronous risk calculation request",
        )
        return RiskCalculateResponse(
            risk_assessment_id=assessment.id,
            status=RiskAssessmentStatus.COMPLETED,
        )
    else:
        fake_id = uuid.uuid4()
        dispatch_risk_task(
            asset_vulnerability_id=payload.asset_vulnerability_id,
            current_user=current_user,
            reason="API background risk calculation request",
        )
        return RiskCalculateResponse(
            risk_assessment_id=fake_id,
            status=RiskAssessmentStatus.CALCULATING,
        )


@router.post(
    "/risk/calculate-bulk",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger Bulk Cyber Risk Calculation",
)
async def calculate_bulk_risk(
    payload: RiskCalculateBulkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Trigger background or batch cyber risk calculation for organizational assets."""
    count = await risk_service.calculate_bulk_risk(
        db=db,
        current_user=current_user,
        asset_ids=payload.asset_ids,
        all_organization_assets=payload.all_organization_assets or False,
    )
    return {
        "status": "BATCH_COMPLETED",
        "processed_count": count,
    }


@router.get(
    "/risk/organization",
    response_model=OrganizationRiskResponse,
    summary="Get Organization Cyber Risk Profile",
)
async def get_organization_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationRiskResponse:
    """Retrieve portfolio-wide cyber risk score and asset posture."""
    summary = await risk_service.get_organization_risk_summary(db=db, current_user=current_user)
    return OrganizationRiskResponse(**summary)


@router.get(
    "/risk/distribution",
    response_model=RiskDistributionResponse,
    summary="Get Risk Findings Distribution",
)
async def get_risk_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskDistributionResponse:
    """Retrieve counts of findings in LOW, MEDIUM, HIGH, VERY_HIGH, CRITICAL tiers."""
    dist = await risk_service.get_risk_distribution(db=db, current_user=current_user)
    return RiskDistributionResponse(**dist)


@router.get(
    "/risk/top",
    response_model=TopRisksResponse,
    summary="Get Highest Risk Findings",
)
async def get_top_risks(
    limit: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TopRisksResponse:
    """Retrieve the top prioritized risk findings for remediation."""
    items = await risk_service.get_top_risks(db=db, current_user=current_user, limit=limit)
    return TopRisksResponse(items=items)


@router.get(
    "/risk/config",
    response_model=RiskConfigResponse,
    summary="Get Cyber Risk Configuration",
)
async def get_risk_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskConfigResponse:
    """Retrieve factor weights, thresholds, and active calculation rules."""
    config = await risk_service.get_risk_config(db=db, current_user=current_user)
    return RiskConfigResponse(**config)


@router.put(
    "/risk/config",
    response_model=RiskConfigResponse,
    summary="Update Cyber Risk Configuration",
)
async def update_risk_config(
    payload: RiskConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskConfigResponse:
    """Admin-only update of factor weights and risk scoring rules."""
    if current_user.role not in (UserRole.ADMIN,):
        raise AuthorizationError(
            message="Only organization administrators can update risk configuration.",
            error_code="FORBIDDEN_CONFIG_UPDATE",
        )
    config = await risk_service.update_risk_config(db=db, payload=payload, current_user=current_user)
    return RiskConfigResponse(**config)


@router.get(
    "/assets/{asset_id}/risk",
    response_model=AssetRiskResponse,
    summary="Get Asset Cyber Risk Summary",
)
async def get_asset_risk(
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetRiskResponse:
    """Retrieve aggregated cyber risk score and finding counts for a specific asset."""
    summary = await risk_service.get_asset_risk_summary(
        db=db,
        asset_id=asset_id,
        current_user=current_user,
    )
    return AssetRiskResponse(**summary)


@router.get(
    "/risk/{risk_id}",
    response_model=RiskAssessmentResponse,
    summary="Get Risk Assessment Details",
)
async def get_risk_assessment(
    risk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskAssessmentResponse:
    """Retrieve complete risk assessment details, factor contributions, and explanation."""
    assessment = await risk_service.get_risk_assessment_by_id(
        db=db,
        risk_id=risk_id,
        current_user=current_user,
    )
    return RiskAssessmentResponse.model_validate(assessment)


@router.post(
    "/risk/{risk_id}/recalculate",
    response_model=RiskAssessmentResponse,
    summary="Recalculate Risk Assessment",
)
async def recalculate_risk(
    risk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskAssessmentResponse:
    """Recalculate an existing cyber risk assessment with updated telemetry."""
    assessment = await risk_service.recalculate_risk(
        db=db,
        risk_id=risk_id,
        current_user=current_user,
        reason="Manual recalculation via API",
    )
    return RiskAssessmentResponse.model_validate(assessment)
