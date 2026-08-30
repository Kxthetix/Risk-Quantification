"""Probability distribution sampling engine with strict numerical safety (Phase 6)."""
import math
import random
from typing import Optional


class DistributionEngine:
    """Provides pure-Python numerical sampling across supported probability distributions."""

    @staticmethod
    def sample_triangular(min_val: float, mode_val: float, max_val: float) -> float:
        """Sample from a Triangular distribution (low, high, mode)."""
        # Safety checks
        min_v = max(0.0, float(min_val))
        max_v = max(min_v, float(max_val))
        mode_v = max(min_v, min(max_v, float(mode_val)))

        if min_v == max_v:
            return min_v
        return random.triangular(min_v, max_v, mode_v)

    @staticmethod
    def sample_uniform(min_val: float, max_val: float) -> float:
        """Sample from a Uniform distribution [min, max]."""
        min_v = max(0.0, float(min_val))
        max_v = max(min_v, float(max_val))
        if min_v == max_v:
            return min_v
        return random.uniform(min_v, max_v)

    @staticmethod
    def sample_normal(
        mean_val: float,
        std_dev: float,
        min_bound: Optional[float] = 0.0,
        max_bound: Optional[float] = None,
    ) -> float:
        """Sample from a Normal distribution with boundary clipping."""
        mu = max(0.0, float(mean_val))
        sigma = max(0.0, float(std_dev))
        val = random.gauss(mu, sigma) if sigma > 0 else mu

        if min_bound is not None:
            val = max(float(min_bound), val)
        if max_bound is not None:
            val = min(float(max_bound), val)
        return val

    @staticmethod
    def sample_lognormal(
        mu: float,
        sigma: float,
        min_bound: Optional[float] = 0.0,
        max_bound: Optional[float] = None,
    ) -> float:
        """Sample from a Lognormal distribution with clipping."""
        s = max(0.0, float(sigma))
        val = random.lognormvariate(float(mu), s) if s > 0 else math.exp(float(mu))

        if min_bound is not None:
            val = max(float(min_bound), val)
        if max_bound is not None:
            val = min(float(max_bound), val)
        return val

    @staticmethod
    def sample_bernoulli(probability: float) -> int:
        """Sample from a Bernoulli event: returns 1 if event occurs, else 0."""
        p = max(0.0, min(1.0, float(probability)))
        return 1 if random.random() < p else 0

    @staticmethod
    def sample_fixed(value: float) -> float:
        """Deterministic fixed value."""
        return max(0.0, float(value))

    @classmethod
    def sample_factor(
        cls,
        distribution_type: str,
        minimum: float,
        most_likely: float,
        maximum: float,
        probability: float = 1.0,
    ) -> float:
        """Sample a factor given its distribution type and hurdle probability."""
        prob = max(0.0, min(1.0, float(probability)))
        if prob < 1.0:
            # Check hurdle event occurrence
            if random.random() >= prob:
                return 0.0

        dtype = distribution_type.upper()
        if dtype == "TRIANGULAR":
            return cls.sample_triangular(minimum, most_likely, maximum)
        elif dtype == "UNIFORM":
            return cls.sample_uniform(minimum, maximum)
        elif dtype == "NORMAL":
            # treat most_likely as mean, (max - min) / 6 as approx std dev
            mean = most_likely
            std = (maximum - minimum) / 6.0 if maximum > minimum else 0.0
            return cls.sample_normal(mean, std, min_bound=minimum, max_bound=maximum)
        elif dtype == "LOGNORMAL":
            # simple lognormal approximation around most_likely
            log_mean = math.log(max(1.0, most_likely))
            log_std = 0.5
            return cls.sample_lognormal(log_mean, log_std, min_bound=minimum, max_bound=maximum)
        elif dtype == "BERNOULLI":
            return cls.sample_fixed(most_likely) if cls.sample_bernoulli(prob) else 0.0
        elif dtype == "FIXED":
            return cls.sample_fixed(most_likely)
        else:
            # default fallback to triangular
            return cls.sample_triangular(minimum, most_likely, maximum)
