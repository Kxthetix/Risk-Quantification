"""Pydantic schemas for Investment Optimization, What-If Analysis, and Executive Reporting (Phase 8)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OptimizationAlgorithm


class OptimizationRunRequest(BaseModel):
    budget: float = Field(gt=0.0, description="Total budget in currency (₹)")
    currency: str = Field(default="INR", max_length=8)
    scenario_id: Optional[uuid.UUID] = None
    algorithm: OptimizationAlgorithm = Field(default=OptimizationAlgorithm.KNAPSACK)
    horizon_years: int = Field(default=1, ge=1, le=5)
    synchronous: bool = Field(default=True)


class OptimizationResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    scenario_id: Optional[uuid.UUID] = None
    algorithm: OptimizationAlgorithm
    budget: float
    total_cost: float
    expected_loss_before: float
    expected_loss_after: float
    expected_loss_reduction: float
    roi: float
    risk_reduction_per_rupee: float
    critical_paths_reduced: int
    selected_actions: List[Dict[str, Any]]
    optimization_model_version: str
    risk_model_version: str
    financial_model_version: str
    created_at: datetime


class WhatIfOptimizationRequest(BaseModel):
    remediation_ids: Optional[List[uuid.UUID]] = None
    control_ids: Optional[List[uuid.UUID]] = None
    horizon_years: int = Field(default=1, ge=1, le=5)


class WhatIfOptimizationResponse(BaseModel):
    current_expected_loss: float
    projected_expected_loss: float
    risk_reduction: float
    investment: float
    roi: float
    risk_reduction_per_rupee: float
    selected_actions: List[Dict[str, Any]]


class BudgetCurvePointResponse(BaseModel):
    budget: float
    total_cost: float
    expected_loss_reduction: float
    roi: float
    actions_count: int
    marginal_gain_per_rupee: float


class BudgetCurveResponse(BaseModel):
    points: List[BudgetCurvePointResponse]
    diminishing_returns_inflection_budget: Optional[float] = None


class StrategyAlternativeItem(BaseModel):
    strategy_name: str
    strategy_key: str
    description: str
    total_cost: float
    expected_loss_reduction: float
    roi: float
    actions_count: int
    selected_actions: List[Dict[str, Any]]


class AlternativesResponse(BaseModel):
    budget: float
    alternatives: List[StrategyAlternativeItem]


class ExecutiveInvestmentOutputResponse(BaseModel):
    security_investment: float
    expected_annual_risk_reduction: float
    current_expected_loss: float
    residual_risk_loss: float
    risk_reduction_percent: float
    estimated_roi: float
    critical_attack_paths_reduced: int
    top_recommended_action: Optional[str] = None
    action_priority: Optional[str] = None
