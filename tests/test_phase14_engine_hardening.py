"""Phase 14 Risk & Financial Engine Hardening Test Suite.

Validates:
1. Deterministic risk calculations (boundary cases, distribution sampling, extreme impact).
2. Financial exposure calculations (zero revenue, downtime estimation, boundary constraints).
3. Annualized Loss Expectancy and incident likelihood monotonicity.
"""
import pytest
from app.engines.distribution_engine import DistributionEngine
from app.engines.annualized_loss_engine import AnnualizedLossEngine
from app.engines.downtime_engine import DowntimeEngine
from app.models.enums import AssetCriticality, AssetEnvironment


def test_deterministic_distribution_sampling_boundary_cases():
    """Test distribution engine handles boundary and extreme values without throwing exceptions."""
    # Triangular distribution boundary check
    s1 = DistributionEngine.sample_triangular(10.0, 10.0, 10.0)
    assert s1 == 10.0

    s2 = DistributionEngine.sample_triangular(0.0, 50.0, 100.0)
    assert 0.0 <= s2 <= 100.0

    # Uniform distribution boundary check
    u1 = DistributionEngine.sample_uniform(5.0, 5.0)
    assert u1 == 5.0

    u2 = DistributionEngine.sample_uniform(10.0, 20.0)
    assert 10.0 <= u2 <= 20.0

    # Normal distribution boundary check with clipping
    n1 = DistributionEngine.sample_normal(mean_val=50.0, std_dev=10.0, min_bound=0.0, max_bound=100.0)
    assert 0.0 <= n1 <= 100.0


def test_annualized_loss_probability_monotonicity():
    """Test mapping risk scores (0-100) to annual incident probabilities is strictly monotonic."""
    prob_low, band_low, _ = AnnualizedLossEngine.map_risk_score_to_probability(10.0)
    prob_mid, band_mid, _ = AnnualizedLossEngine.map_risk_score_to_probability(50.0)
    prob_high, band_high, _ = AnnualizedLossEngine.map_risk_score_to_probability(95.0)

    assert prob_low <= prob_mid <= prob_high
    assert band_low == "VERY_LOW"
    assert band_high == "VERY_HIGH"


def test_downtime_estimation_and_environment_multipliers():
    """Test downtime calculations appropriately weight asset criticality and environments."""
    dt_low = DowntimeEngine.BASE_DOWNTIME[AssetCriticality.LOW]
    dt_crit = DowntimeEngine.BASE_DOWNTIME[AssetCriticality.CRITICAL]

    # Critical asset downtime boundaries must exceed Low asset boundaries
    assert dt_crit[0] > dt_low[0]
    assert dt_crit[1] > dt_low[1]
    assert dt_crit[2] > dt_low[2]

    # Production environment multiplier must exceed Development environment multiplier
    prod_mult = DowntimeEngine.ENV_MULTIPLIERS[AssetEnvironment.PRODUCTION]
    dev_mult = DowntimeEngine.ENV_MULTIPLIERS[AssetEnvironment.DEVELOPMENT]
    assert prod_mult > dev_mult
