"""Pydantic v2 schemas for Financial Impact Analysis and Quantification (Phase 6)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AssetCriticality, FinancialScenarioType, SimulationStatus


# ----------------------------------------------------------------------
# Financial Profile Schemas
# ----------------------------------------------------------------------
class FinancialProfileBase(BaseModel):
    currency: str = Field(default="INR", min_length=3, max_length=3)
    annual_revenue: float = Field(ge=0.0, default=100000000.0)
    operating_days_per_year: int = Field(ge=1, le=365, default=250)
    hours_per_day: int = Field(ge=1, le=24, default=8)
    employee_count: int = Field(ge=1, default=100)
    average_hourly_employee_cost: float = Field(ge=0.0, default=350.0)
    incident_response_hourly_cost: float = Field(ge=0.0, default=2500.0)
    security_team_size: int = Field(ge=1, default=5)
    backup_recovery_hourly_cost: float = Field(ge=0.0, default=1800.0)
    customer_count: int = Field(ge=1, default=1000)
    average_customer_value: float = Field(ge=0.0, default=5000.0)
    cost_per_record: float = Field(ge=0.0, default=250.0)


class FinancialProfileCreate(FinancialProfileBase):
    pass


class FinancialProfileUpdate(BaseModel):
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    annual_revenue: Optional[float] = Field(None, ge=0.0)
    operating_days_per_year: Optional[int] = Field(None, ge=1, le=365)
    hours_per_day: Optional[int] = Field(None, ge=1, le=24)
    employee_count: Optional[int] = Field(None, ge=1)
    average_hourly_employee_cost: Optional[float] = Field(None, ge=0.0)
    incident_response_hourly_cost: Optional[float] = Field(None, ge=0.0)
    security_team_size: Optional[int] = Field(None, ge=1)
    backup_recovery_hourly_cost: Optional[float] = Field(None, ge=0.0)
    customer_count: Optional[int] = Field(None, ge=1)
    average_customer_value: Optional[float] = Field(None, ge=0.0)
    cost_per_record: Optional[float] = Field(None, ge=0.0)


class FinancialProfileResponse(FinancialProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    daily_revenue: float
    hourly_revenue: float
    average_hourly_revenue: float
    average_hourly_profit: float
    created_at: datetime
    updated_at: datetime


# ----------------------------------------------------------------------
# Business Service Schemas
# ----------------------------------------------------------------------
class BusinessServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: Optional[str] = None
    revenue_dependency: float = Field(default=1.0, ge=0.0, le=1.0)
    criticality: AssetCriticality = Field(default=AssetCriticality.HIGH)
    daily_transaction_count: Optional[int] = Field(default=0, ge=0)
    average_transaction_value: Optional[float] = Field(default=0.0, ge=0.0)


class BusinessServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    revenue_dependency: Optional[float] = Field(None, ge=0.0, le=1.0)
    criticality: Optional[AssetCriticality] = None
    daily_transaction_count: Optional[int] = Field(None, ge=0)
    average_transaction_value: Optional[float] = Field(None, ge=0.0)


class BusinessServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    description: Optional[str] = None
    revenue_dependency: float
    criticality: AssetCriticality
    daily_transaction_count: int
    average_transaction_value: float
    created_at: datetime
    updated_at: datetime


# ----------------------------------------------------------------------
# Calculation & Factor Schemas
# ----------------------------------------------------------------------
class FinancialFactorItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    factor_type: str
    distribution_type: str
    expected_value: float
    contribution: float
    minimum_value: float
    most_likely_value: float
    maximum_value: float
    probability: float


class FinancialCalculateRequest(BaseModel):
    asset_vulnerability_id: uuid.UUID
    simulation_count: int = Field(default=10000, ge=1000, le=50000)
    random_seed: int = Field(default=42)
    synchronous: bool = Field(default=True)
    overrides: Optional[Dict[str, Any]] = None


class FinancialCalculateResponse(BaseModel):
    financial_assessment_id: uuid.UUID
    job_id: uuid.UUID
    status: SimulationStatus


# ----------------------------------------------------------------------
# Assessment Result Schemas
# ----------------------------------------------------------------------
class FinancialAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    asset_id: uuid.UUID
    currency: str
    estimated_loss: float
    expected_loss: float
    annual_expected_loss: float
    minimum_loss: float
    maximum_loss: float
    p10: float = Field(validation_alias="p10_loss")
    p25: float = Field(validation_alias="p25_loss")
    p50: float = Field(validation_alias="p50_loss")
    p75: float = Field(validation_alias="p75_loss")
    p90: float = Field(validation_alias="p90_loss")
    p95: float = Field(validation_alias="p95_loss")
    simulation_count: int
    model_version: str
    factors: List[FinancialFactorItem] = Field(default_factory=list)
    calculated_at: datetime


class LossBreakdownResponse(BaseModel):
    currency: str
    expected_loss: float
    downtime: float
    revenue_loss: float
    incident_response: float
    forensics: float
    recovery: float
    productivity: float
    data_breach: float
    regulatory: float
    customer_compensation: float
    third_party: float
    reputational: float
    percentage_contributions: Dict[str, float]


class FinancialDistributionResponse(BaseModel):
    bins: List[float]
    frequencies: List[int]


# ----------------------------------------------------------------------
# Scenario & Decision Analysis Schemas
# ----------------------------------------------------------------------
class FinancialScenarioRequest(BaseModel):
    asset_vulnerability_id: uuid.UUID
    scenario_type: FinancialScenarioType = Field(default=FinancialScenarioType.BASE_CASE)
    simulation_count: int = Field(default=10000, ge=1000, le=50000)


class FinancialScenarioResponse(BaseModel):
    scenario_type: FinancialScenarioType
    currency: str
    expected_loss: float
    p10: float
    p50: float
    p90: float
    downtime_hours: float
    revenue_loss: float
    recovery_cost: float
    data_breach_cost: float
    assumptions: List[Dict[str, Any]]


class WhatIfRequest(BaseModel):
    asset_vulnerability_id: uuid.UUID
    downtime_hours: Optional[float] = Field(None, ge=0.0)
    recovery_hours: Optional[float] = Field(None, ge=0.0)
    dependency_factor: Optional[float] = Field(None, ge=0.0, le=1.0)
    data_exposure_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    incident_probability: Optional[float] = Field(None, ge=0.0, le=1.0)


class WhatIfResponse(BaseModel):
    currency: str
    baseline_expected_loss: float
    new_expected_loss: float
    loss_reduction: float
    percentage_reduction: float
    parameters_modified: Dict[str, Any]


class ControlScenarioRequest(BaseModel):
    asset_vulnerability_id: uuid.UUID
    control: str = Field(min_length=2, max_length=128)
    implementation_cost: float = Field(ge=0.0)
    risk_reduction: float = Field(ge=0.0, le=1.0)  # e.g. 0.30 for 30% reduction


class ControlScenarioResponse(BaseModel):
    control: str
    currency: str
    implementation_cost: float
    baseline_expected_loss: float
    new_expected_loss: float
    risk_reduction_value: float
    roi: float  # ROI %
    label: str = "Modeled Estimate"


# ----------------------------------------------------------------------
# Executive Summary & Dashboards Schemas
# ----------------------------------------------------------------------
class TopLossFinding(BaseModel):
    asset_vulnerability_id: uuid.UUID
    asset_name: str
    cve_id: str
    risk_score: float
    expected_loss: float
    p90_loss: float
    annual_expected_loss: float
    primary_loss_driver: str


class OrganizationFinancialSummaryResponse(BaseModel):
    currency: str
    total_expected_annual_loss: float
    total_potential_loss: float
    top_losses: List[TopLossFinding] = Field(default_factory=list)
    expected_downtime_cost: float
    expected_recovery_cost: float
    expected_data_impact: float
    expected_regulatory_cost: float
    assessed_vulnerabilities_count: int
