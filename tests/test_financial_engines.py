"""Unit tests for Phase 6 financial calculation engines."""
import uuid
import pytest

from app.engines.annualized_loss_engine import AnnualizedLossEngine
from app.engines.downtime_engine import DowntimeEngine
from app.engines.financial_impact_engine import FinancialImpactEngine
from app.engines.revenue_loss_engine import RevenueLossEngine
from app.models.asset import Asset
from app.models.business_service import BusinessService
from app.models.enums import AssetCriticality, AssetEnvironment, AssetType, DataClassification
from app.models.financial_profile import FinancialProfile
from app.models.risk_assessment import RiskAssessment


def test_downtime_engine_custom_and_defaults():
    """Verify downtime estimation with explicit inputs and criticality defaults."""
    asset = Asset(
        id=uuid.uuid4(),
        name="Web-Server",
        asset_type=AssetType.SERVER,
        criticality=AssetCriticality.HIGH,
        environment=AssetEnvironment.PRODUCTION,
        internet_exposed=True,
    )

    # 1. Criticality based evaluation
    params = DowntimeEngine.evaluate(asset)
    assert params.minimum_hours >= 2.0
    assert params.most_likely_hours >= 8.0
    assert params.maximum_hours >= 24.0

    # 2. Custom override (1h / 4h / 12h)
    custom_params = DowntimeEngine.evaluate(asset, custom_min=1.0, custom_mode=4.0, custom_max=12.0)
    assert custom_params.minimum_hours == 1.0
    assert custom_params.most_likely_hours == 4.0
    assert custom_params.maximum_hours == 12.0


def test_revenue_loss_calculation():
    """Verify Revenue Loss = Hourly Revenue * Downtime Hours * Dependency Factor."""
    # Profile with 2,00,000 hourly revenue
    profile = FinancialProfile(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        currency="INR",
        hourly_revenue=200000.0,
        annual_revenue=400000000.0,
        operating_days_per_year=250,
        hours_per_day=8,
    )

    asset = Asset(
        id=uuid.uuid4(),
        name="Core-Payment-Gateway",
        asset_type=AssetType.SERVER,
        criticality=AssetCriticality.CRITICAL,
        financial_dependency_factor=0.8,
    )

    downtime = DowntimeEngine.evaluate(asset, custom_min=2.0, custom_mode=5.0, custom_max=10.0)
    rev_params = RevenueLossEngine.evaluate(
        financial_profile=profile,
        asset=asset,
        downtime=downtime,
    )

    # Expected mode: 200,000 * 5 * 0.8 = 800,000
    assert rev_params.hourly_revenue == 200000.0
    assert rev_params.dependency_factor == 0.8
    assert rev_params.most_likely_loss == 800000.0
    assert rev_params.minimum_loss == 200000.0 * 2.0 * 0.8
    assert rev_params.maximum_loss == 200000.0 * 10.0 * 0.8


def test_annualized_loss_engine():
    """Verify Annual Expected Loss = Annual Probability * Single Loss."""
    # Loss = 20,00,000, Probability = 0.25 -> ALE = 5,00,000
    res = AnnualizedLossEngine.evaluate(
        expected_single_loss=2000000.0,
        custom_annual_prob=0.25,
    )
    assert res.expected_single_loss == 2000000.0
    assert res.annual_probability == 0.25
    assert res.annual_expected_loss == 500000.0

    # Risk score mapping test
    risk = RiskAssessment(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        final_risk_score=90.0,
    )
    res_risk = AnnualizedLossEngine.evaluate(
        expected_single_loss=1000000.0,
        risk_assessment=risk,
    )
    assert res_risk.annual_probability >= 0.80
    assert res_risk.annual_expected_loss >= 800000.0


def test_financial_factor_generation():
    """Verify multi-factor decomposition includes downtime, response, recovery, data breach."""
    profile = FinancialProfile(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        currency="INR",
        hourly_revenue=100000.0,
        employee_count=200,
        customer_count=5000,
        cost_per_record=300.0,
    )
    asset = Asset(
        id=uuid.uuid4(),
        name="Customer-DB",
        asset_type=AssetType.DATABASE,
        criticality=AssetCriticality.HIGH,
        data_classification=DataClassification.RESTRICTED,
        financial_dependency_factor=1.0,
        internet_exposed=False,
    )

    factor_set = FinancialImpactEngine.generate_factors(
        financial_profile=profile,
        asset=asset,
    )

    factor_types = [f.factor_type for f in factor_set.factors]
    assert "DOWNTIME" in factor_types
    assert "REVENUE_LOSS" in factor_types
    assert "INCIDENT_RESPONSE" in factor_types
    assert "RECOVERY" in factor_types
    assert "DATA_BREACH" in factor_types

    # Data breach probability should be elevated for RESTRICTED
    data_factor = next(f for f in factor_set.factors if f.factor_type == "DATA_BREACH")
    assert data_factor.probability >= 0.50
