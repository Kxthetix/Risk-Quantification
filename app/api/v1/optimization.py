"""Investment Optimization API endpoints (Phase 8)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.enums import SimulationStatus
from app.models.simulation import SimulationJob
from app.models.user import User
from app.schemas.optimization import (
    AlternativesResponse,
    BudgetCurveResponse,
    ExecutiveInvestmentOutputResponse,
    OptimizationResultResponse,
    OptimizationRunRequest,
    WhatIfOptimizationRequest,
    WhatIfOptimizationResponse,
)
from app.services.optimization_service import optimization_service
from app.workers.optimization_worker import launch_optimization_task

router = APIRouter(prefix="/optimization", tags=["Investment Optimization"])


@router.post(
    "/run",
    response_model=OptimizationResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute cybersecurity investment portfolio optimization",
)
async def run_optimization(
    payload: OptimizationRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OptimizationResultResponse:
    """Run mathematical 0/1 Knapsack or Greedy portfolio optimization against specified budget."""
    if payload.synchronous:
        result = await optimization_service.run_optimization(
            db=db,
            organization_id=current_user.organization_id,
            budget=payload.budget,
            algorithm=payload.algorithm,
            scenario_id=payload.scenario_id,
            horizon_years=payload.horizon_years,
            current_user=current_user,
        )
        return OptimizationResultResponse.model_validate(result)

    # Async background execution
    job = SimulationJob(
        organization_id=current_user.organization_id,
        status=SimulationStatus.PENDING,
        progress=0,
        completed_iterations=0,
        total_iterations=1,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    launch_optimization_task(
        job_id=job.id,
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        budget=payload.budget,
        algorithm=payload.algorithm,
        scenario_id=payload.scenario_id,
        horizon_years=payload.horizon_years,
    )

    # Return preliminary optimization run synchronously as standard response
    result = await optimization_service.run_optimization(
        db=db,
        organization_id=current_user.organization_id,
        budget=payload.budget,
        algorithm=payload.algorithm,
        scenario_id=payload.scenario_id,
        horizon_years=payload.horizon_years,
        current_user=current_user,
    )
    return OptimizationResultResponse.model_validate(result)


@router.get(
    "/results/{result_id}",
    response_model=OptimizationResultResponse,
    summary="Get saved optimization result",
)
async def get_optimization_result(
    result_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OptimizationResultResponse:
    """Fetch an audit-grade optimization result snapshot."""
    res = await optimization_service.get_optimization_result(
        db=db,
        organization_id=current_user.organization_id,
        result_id=result_id,
    )
    return OptimizationResultResponse.model_validate(res)


@router.post(
    "/what-if",
    response_model=WhatIfOptimizationResponse,
    summary="Simulate custom mitigation package (What-If)",
)
async def run_what_if(
    payload: WhatIfOptimizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WhatIfOptimizationResponse:
    """Simulate the financial and risk impact of a customized selection of remediations and controls."""
    return await optimization_service.run_what_if(
        db=db,
        organization_id=current_user.organization_id,
        remediation_ids=payload.remediation_ids,
        control_ids=payload.control_ids,
        horizon_years=payload.horizon_years,
    )


@router.get(
    "/alternatives",
    response_model=AlternativesResponse,
    summary="Compare 4 strategic investment portfolios",
)
async def get_alternatives(
    budget: float = Query(..., gt=0.0, description="Available investment budget (₹)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlternativesResponse:
    """Compare 4 distinct strategic investment options (Lowest Cost, Max Reduction, Max ROI, Balanced)."""
    return await optimization_service.get_alternatives(
        db=db,
        organization_id=current_user.organization_id,
        budget=budget,
    )


@router.get(
    "/budget-curve",
    response_model=BudgetCurveResponse,
    summary="Generate budget vs risk reduction curve",
)
async def get_budget_curve(
    max_budget: float = Query(10000000.0, ge=100000.0),
    steps: int = Query(8, ge=3, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetCurveResponse:
    """Evaluate optimization curve across budget increments and detect diminishing returns inflection point."""
    return await optimization_service.get_budget_curve(
        db=db,
        organization_id=current_user.organization_id,
        max_budget=max_budget,
        steps=steps,
    )


@router.get(
    "/executive-summary",
    response_model=ExecutiveInvestmentOutputResponse,
    summary="Get board-ready executive investment summary",
)
async def get_executive_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutiveInvestmentOutputResponse:
    """Get board-ready executive security investment metrics and recommended action."""
    return await optimization_service.get_executive_summary(
        db=db,
        organization_id=current_user.organization_id,
    )
