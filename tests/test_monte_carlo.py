"""Tests for Phase 6 Monte Carlo simulation engine and distribution correctness."""
import pytest

from app.engines.financial_impact_engine import FactorDefinition
from app.engines.monte_carlo_engine import MonteCarloEngine


def test_monte_carlo_quantile_ordering():
    """Verify monotonic quantile ordering: P10 <= P25 <= P50 <= P75 <= P90 <= P95."""
    factors = [
        FactorDefinition(
            factor_type="REVENUE_LOSS",
            distribution_type="TRIANGULAR",
            minimum=100000.0,
            most_likely=500000.0,
            maximum=2000000.0,
        ),
        FactorDefinition(
            factor_type="RECOVERY",
            distribution_type="TRIANGULAR",
            minimum=50000.0,
            most_likely=200000.0,
            maximum=800000.0,
        ),
    ]

    result = MonteCarloEngine.run(factors, simulation_count=5000, random_seed=42)

    assert result.minimum_loss <= result.p10_loss
    assert result.p10_loss <= result.p25_loss
    assert result.p25_loss <= result.p50_loss
    assert result.p50_loss <= result.p75_loss
    assert result.p75_loss <= result.p90_loss
    assert result.p90_loss <= result.p95_loss
    assert result.p95_loss <= result.maximum_loss
    assert result.expected_loss > 0


def test_monte_carlo_deterministic_zero_variance():
    """Deterministic inputs (min == mode == max) must produce zero variance in simulation."""
    factors = [
        FactorDefinition(
            factor_type="REVENUE_LOSS",
            distribution_type="FIXED",
            minimum=400000.0,
            most_likely=400000.0,
            maximum=400000.0,
        ),
        FactorDefinition(
            factor_type="INCIDENT_RESPONSE",
            distribution_type="FIXED",
            minimum=200000.0,
            most_likely=200000.0,
            maximum=200000.0,
        ),
        FactorDefinition(
            factor_type="RECOVERY",
            distribution_type="FIXED",
            minimum=500000.0,
            most_likely=500000.0,
            maximum=500000.0,
        ),
    ]

    # Expected sum = 400k + 200k + 500k = 1,100,000
    res = MonteCarloEngine.run(factors, simulation_count=2000, random_seed=123)

    assert res.expected_loss == 1100000.0
    assert res.minimum_loss == 1100000.0
    assert res.maximum_loss == 1100000.0
    assert res.p10_loss == 1100000.0
    assert res.p50_loss == 1100000.0
    assert res.p90_loss == 1100000.0
    assert res.p95_loss == 1100000.0


def test_monte_carlo_seed_reproducibility():
    """Simulations with identical seed and factors produce identical numerical outputs."""
    factors = [
        FactorDefinition(
            factor_type="REVENUE_LOSS",
            distribution_type="TRIANGULAR",
            minimum=10000.0,
            most_likely=80000.0,
            maximum=300000.0,
        )
    ]

    run1 = MonteCarloEngine.run(factors, simulation_count=3000, random_seed=999)
    run2 = MonteCarloEngine.run(factors, simulation_count=3000, random_seed=999)

    assert run1.expected_loss == run2.expected_loss
    assert run1.p10_loss == run2.p10_loss
    assert run1.p50_loss == run2.p50_loss
    assert run1.p90_loss == run2.p90_loss
    assert run1.histogram_bins == run2.histogram_bins
    assert run1.histogram_frequencies == run2.histogram_frequencies


def test_monte_carlo_histogram_and_contributions():
    """Histogram frequencies sum to simulation count and factor contributions sum to ~100%."""
    factors = [
        FactorDefinition(
            factor_type="REVENUE_LOSS",
            distribution_type="TRIANGULAR",
            minimum=50000.0,
            most_likely=150000.0,
            maximum=400000.0,
        ),
        FactorDefinition(
            factor_type="RECOVERY",
            distribution_type="TRIANGULAR",
            minimum=20000.0,
            most_likely=60000.0,
            maximum=180000.0,
        ),
    ]

    sim_count = 4000
    res = MonteCarloEngine.run(factors, simulation_count=sim_count, random_seed=42)

    # Frequencies sum to total simulation count
    assert sum(res.histogram_frequencies) == sim_count

    # Factor contributions sum to 100%
    total_contrib = sum(f.contribution_percentage for f in res.factors_summary)
    assert 99.0 <= total_contrib <= 101.0
