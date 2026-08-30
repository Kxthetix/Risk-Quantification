"""Financial Impact Analysis & Decision Support API endpoints (Phase 6)."""
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError
from app.models.enums import SimulationStatus
from app.models.user import User, UserRole
from app.schemas.financial import (
    BusinessServiceCreate,
    BusinessServiceResponse,
    BusinessServiceUpdate,
    ControlScenarioRequest,
    ControlScenarioResponse,
    FinancialAssessmentResponse,
    FinancialCalculateRequest,
    FinancialCalculateResponse,
    FinancialDistributionResponse,
    FinancialProfileCreate,
    FinancialProfileResponse,
    FinancialProfileUpdate,
    FinancialScenarioRequest,
    FinancialScenarioResponse,
    LossBreakdownResponse,
    OrganizationFinancialSummaryResponse,
    TopLossFinding,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services.financial_profile_service import financial_profile_service
from app.services.financial_service import financial_service
from app.services.simulation_service import simulation_service
from app.workers.simulation_worker import dispatch_simulation_task

router = APIRouter(tags=["Financial Impact Analysis"])


# ----------------------------------------------------------------------
# 1. Financial Profile Endpoints
# ----------------------------------------------------------------------
@router.get(
    "/financial/profile",
    response_model=FinancialProfileResponse,
    summary="Get Organization Financial Profile",
)
async def get_financial_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinancialProfileResponse:
    """Retrieve organization baseline financial metrics and derived revenue rates."""
    profile = await financial_profile_service.get_or_create_profile(
        db=db,
        organization_id=current_user.organization_id,
    )
    return FinancialProfileResponse.model_validate(profile)


@router.post(
    "/financial/profile",
    response_model=FinancialProfileResponse,
    summary="Initialize Organization Financial Profile",
)
async def create_financial_profile(
    payload: FinancialProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinancialProfileResponse:
    """Initialize or update organization financial assumptions."""
    if current_user.role not in (UserRole.ADMIN,):
        raise AuthorizationError(
            message="Only administrators can configure financial profiles.",
            error_code="FORBIDDEN_PROFILE_UPDATE",
        )
    profile = await financial_profile_service.update_profile(
        db=db,
        organization_id=current_user.organization_id,
        payload=FinancialProfileUpdate(**payload.model_dump()),
        current_user=current_user,
    )
    return FinancialProfileResponse.model_validate(profile)


@router.put(
    "/financial/profile",
    response_model=FinancialProfileResponse,
    summary="Update Organization Financial Profile",
)
async def update_financial_profile(
    payload: FinancialProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinancialProfileResponse:
    """Update organization baseline financial figures (Admin only)."""
    if current_user.role not in (UserRole.ADMIN,):
        raise AuthorizationError(
            message="Only administrators can update financial profiles.",
            error_code="FORBIDDEN_PROFILE_UPDATE",
        )
    profile = await financial_profile_service.update_profile(
        db=db,
        organization_id=current_user.organization_id,
        payload=payload,
        current_user=current_user,
    )
    return FinancialProfileResponse.model_validate(profile)


# ----------------------------------------------------------------------
# 2. Business Services Endpoints
# ----------------------------------------------------------------------
@router.post(
    "/financial/business-services",
    response_model=BusinessServiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Business Service Mapping",
)
async def create_business_service(
    payload: BusinessServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BusinessServiceResponse:
    """Register a critical revenue-generating business service."""
    service = await financial_profile_service.create_business_service(
        db=db,
        organization_id=current_user.organization_id,
        payload=payload,
        current_user=current_user,
    )
    return BusinessServiceResponse.model_validate(service)


@router.get(
    "/financial/business-services",
    response_model=List[BusinessServiceResponse],
    summary="List Organization Business Services",
)
async def list_business_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[BusinessServiceResponse]:
    """Retrieve all business services for the authenticated tenant."""
    services = await financial_profile_service.get_business_services(
        db=db,
        organization_id=current_user.organization_id,
    )
    return [BusinessServiceResponse.model_validate(s) for s in services]


# ----------------------------------------------------------------------
# 3. Calculation & Simulation Endpoints
# ----------------------------------------------------------------------
@router.post(
    "/financial/calculate",
    response_model=FinancialCalculateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Calculate Financial Loss Distribution (Monte Carlo)",
)
async def calculate_financial_loss(
    payload: FinancialCalculateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinancialCalculateResponse:
    """Execute probabilistic Monte Carlo financial simulation for a finding."""
    if payload.synchronous:
        # Synchronous execution
        assessment = await financial_service.calculate_financial_impact(
            db=db,
            asset_vulnerability_id=payload.asset_vulnerability_id,
            current_user=current_user,
            simulation_count=payload.simulation_count,
            random_seed=payload.random_seed,
            overrides=payload.overrides,
        )
        job = await simulation_service.create_job(
            db=db,
            organization_id=current_user.organization_id,
            total_simulations=payload.simulation_count,
            financial_assessment_id=assessment.id,
        )
        await simulation_service.update_progress(
            db=db,
            job_id=job.id,
            status=SimulationStatus.COMPLETED,
            progress=100,
            completed=payload.simulation_count,
            financial_assessment_id=assessment.id,
        )
        return FinancialCalculateResponse(
            financial_assessment_id=assessment.id,
            job_id=job.id,
            status=SimulationStatus.COMPLETED,
        )
    else:
        # Background worker dispatch
        job = await simulation_service.create_job(
            db=db,
            organization_id=current_user.organization_id,
            total_simulations=payload.simulation_count,
        )
        dispatch_simulation_task(
            job_id=job.id,
            asset_vulnerability_id=payload.asset_vulnerability_id,
            current_user=current_user,
            simulation_count=payload.simulation_count,
            random_seed=payload.random_seed,
            overrides=payload.overrides,
        )
        return FinancialCalculateResponse(
            financial_assessment_id=uuid.uuid4(),  # placeholder until job finishes
            job_id=job.id,
            status=SimulationStatus.QUEUED,
        )


# ----------------------------------------------------------------------
# 4. Assessment Results & Distribution Endpoints
# ----------------------------------------------------------------------
@router.get(
    "/financial/{assessment_id}",
    response_model=FinancialAssessmentResponse,
    summary="Get Financial Assessment Results",
)
async def get_financial_assessment(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinancialAssessmentResponse:
    """Retrieve detailed financial assessment, percentiles (P10..P95), and expected loss."""
    assessment = await financial_service.get_financial_assessment_by_id(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user,
    )
    return FinancialAssessmentResponse.model_validate(assessment)


@router.get(
    "/financial/{assessment_id}/breakdown",
    response_model=LossBreakdownResponse,
    summary="Get Category Cost Breakdown",
)
async def get_loss_breakdown(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LossBreakdownResponse:
    """Retrieve category-specific loss breakdown and percentage contributions."""
    breakdown = await financial_service.get_loss_breakdown(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user,
    )
    return LossBreakdownResponse(**breakdown)


@router.get(
    "/financial/{assessment_id}/distribution",
    response_model=FinancialDistributionResponse,
    summary="Get Loss Distribution Histogram",
)
async def get_distribution_histogram(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinancialDistributionResponse:
    """Retrieve histogram buckets and frequencies for frontend Monte Carlo charting."""
    dist = await financial_service.get_distribution(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user,
    )
    return FinancialDistributionResponse(**dist)


# ----------------------------------------------------------------------
# 5. Scenarios, What-If, and ROI Endpoints
# ----------------------------------------------------------------------
@router.post(
    "/financial/scenario",
    response_model=FinancialScenarioResponse,
    summary="Run Comparative Scenario Analysis",
)
async def run_scenario_analysis(
    payload: FinancialScenarioRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinancialScenarioResponse:
    """Evaluate BEST_CASE, BASE_CASE, or WORST_CASE deterministic scenarios."""
    return await financial_service.calculate_scenario(
        db=db,
        asset_vulnerability_id=payload.asset_vulnerability_id,
        scenario_type=payload.scenario_type,
        current_user=current_user,
        simulation_count=payload.simulation_count,
    )


@router.post(
    "/financial/what-if",
    response_model=WhatIfResponse,
    summary="Run What-If Parameter Analysis",
)
async def run_what_if_analysis(
    payload: WhatIfRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WhatIfResponse:
    """Recalculate expected financial loss with customized parameters and show reduction."""
    return await financial_service.calculate_what_if(
        db=db,
        payload=payload,
        current_user=current_user,
    )


@router.post(
    "/financial/control-scenario",
    response_model=ControlScenarioResponse,
    summary="Calculate Security Control ROI",
)
async def run_control_scenario(
    payload: ControlScenarioRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ControlScenarioResponse:
    """Calculate the expected loss reduction and ROI % for a proposed security control."""
    return await financial_service.calculate_control_scenario(
        db=db,
        payload=payload,
        current_user=current_user,
    )


# ----------------------------------------------------------------------
# 6. Executive Dashboards & Summaries
# ----------------------------------------------------------------------
@router.get(
    "/financial/organization/summary",
    response_model=OrganizationFinancialSummaryResponse,
    summary="Get Organization Financial Loss Summary",
)
async def get_organization_financial_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationFinancialSummaryResponse:
    """Retrieve portfolio-level Annual Expected Loss (ALE), Potential Loss, and Top Findings."""
    summary = await financial_service.get_organization_financial_summary(
        db=db,
        current_user=current_user,
    )
    return OrganizationFinancialSummaryResponse(**summary)


@router.get(
    "/financial/organization/top-losses",
    response_model=List[TopLossFinding],
    summary="Get Top Financial Risks",
)
async def get_top_losses(
    limit: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[TopLossFinding]:
    """Retrieve highest financial risk findings ordered by expected loss."""
    items = await financial_service.get_top_financial_losses(
        db=db,
        current_user=current_user,
        limit=limit,
    )
    return [TopLossFinding(**item) for item in items]
