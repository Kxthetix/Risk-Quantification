"""Unit tests for Phase 6 probability distribution sampling engine."""
import math
import random
import pytest

from app.engines.distribution_engine import DistributionEngine


def test_sample_triangular_bounds():
    """Triangular samples must always stay within [minimum, maximum]."""
    for _ in range(500):
        val = DistributionEngine.sample_triangular(1.0, 4.0, 12.0)
        assert 1.0 <= val <= 12.0


def test_sample_uniform_bounds():
    """Uniform samples must always stay within [minimum, maximum]."""
    for _ in range(500):
        val = DistributionEngine.sample_uniform(10.0, 50.0)
        assert 10.0 <= val <= 50.0


def test_sample_normal_and_lognormal_clipping():
    """Normal and lognormal samples respect min and max bounds."""
    for _ in range(500):
        val_norm = DistributionEngine.sample_normal(
            mean_val=100.0,
            std_dev=25.0,
            min_bound=50.0,
            max_bound=150.0,
        )
        assert 50.0 <= val_norm <= 150.0

        val_log = DistributionEngine.sample_lognormal(
            mu=4.0,
            sigma=0.5,
            min_bound=10.0,
            max_bound=200.0,
        )
        assert 10.0 <= val_log <= 200.0


def test_sample_bernoulli():
    """Bernoulli returns 1 with prob 1.0, 0 with prob 0.0."""
    assert DistributionEngine.sample_bernoulli(0.0) == 0
    assert DistributionEngine.sample_bernoulli(1.0) == 1

    # Approximate 50% test
    random.seed(42)
    trials = [DistributionEngine.sample_bernoulli(0.5) for _ in range(1000)]
    ones_ratio = sum(trials) / len(trials)
    assert 0.45 <= ones_ratio <= 0.55


def test_sample_fixed():
    """Fixed sample returns constant non-negative value."""
    assert DistributionEngine.sample_fixed(500000.0) == 500000.0
    assert DistributionEngine.sample_fixed(-100.0) == 0.0


def test_zero_variance_deterministic_case():
    """When min == mode == max, triangular and uniform samples equal the constant."""
    val = DistributionEngine.sample_triangular(100.0, 100.0, 100.0)
    assert val == 100.0

    val_u = DistributionEngine.sample_uniform(250.0, 250.0)
    assert val_u == 250.0


def test_sample_factor_hurdle_probability():
    """Factor with probability 0.0 returns 0.0 unconditionally."""
    for _ in range(50):
        val = DistributionEngine.sample_factor(
            distribution_type="TRIANGULAR",
            minimum=1000.0,
            most_likely=5000.0,
            maximum=10000.0,
            probability=0.0,
        )
        assert val == 0.0
