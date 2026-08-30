"""Monte Carlo Simulation Engine for Cyber Risk Financial Impact (Phase 6)."""
from dataclasses import dataclass, field
import math
import random
from typing import Dict, List

from app.engines.distribution_engine import DistributionEngine
from app.engines.financial_impact_engine import FactorDefinition


@dataclass
class FactorSimulationSummary:
    """Simulated summary for a single factor."""
    factor_type: str
    distribution_type: str
    expected_value: float
    contribution_percentage: float
    minimum_value: float
    most_likely_value: float
    maximum_value: float
    probability: float


@dataclass
class MonteCarloResult:
    """Comprehensive output of the Monte Carlo simulation run."""
    expected_loss: float
    minimum_loss: float
    maximum_loss: float
    p10_loss: float
    p25_loss: float
    p50_loss: float
    p75_loss: float
    p90_loss: float
    p95_loss: float
    simulation_count: int
    random_seed: int
    category_means: Dict[str, float]
    factors_summary: List[FactorSimulationSummary]
    histogram_bins: List[float]
    histogram_frequencies: List[int]


class MonteCarloEngine:
    """High-performance Monte Carlo simulator generating financial loss distributions."""

    @classmethod
    def run(
        cls,
        factors: List[FactorDefinition],
        simulation_count: int = 10000,
        random_seed: int = 42,
    ) -> MonteCarloResult:
        """Execute N iterations across cost factors with seed reproducibility."""
        # Sanitize simulation count
        count = max(1000, min(50000, int(simulation_count)))
        seed = int(random_seed)

        # Set reproducible random seed
        random.seed(seed)

        # Pre-allocate containers
        total_losses: List[float] = [0.0] * count
        # Map factor_type to sum of simulated losses
        category_sums: Dict[str, float] = {}
        for f in factors:
            if f.factor_type != "DOWNTIME":  # DOWNTIME is hours, not currency
                category_sums[f.factor_type] = 0.0

        # Execute simulation iterations
        for i in range(count):
            iter_total = 0.0
            for f in factors:
                if f.factor_type == "DOWNTIME":
                    continue

                sample_val = DistributionEngine.sample_factor(
                    distribution_type=f.distribution_type,
                    minimum=f.minimum,
                    most_likely=f.most_likely,
                    maximum=f.maximum,
                    probability=f.probability,
                )
                sample_val = max(0.0, float(sample_val))
                if math.isnan(sample_val) or math.isinf(sample_val):
                    sample_val = 0.0

                category_sums[f.factor_type] += sample_val
                iter_total += sample_val

            total_losses[i] = iter_total

        # Sort for exact percentile extraction
        total_losses.sort()

        def percentile(p: float) -> float:
            idx = int(p * (count - 1))
            return total_losses[idx]

        expected_loss = sum(total_losses) / count
        minimum_loss = total_losses[0]
        maximum_loss = total_losses[-1]

        p10 = percentile(0.10)
        p25 = percentile(0.25)
        p50 = percentile(0.50)
        p75 = percentile(0.75)
        p90 = percentile(0.90)
        p95 = percentile(0.95)

        # Category means and factor summaries
        category_means = {k: v / count for k, v in category_sums.items()}

        factors_summary: List[FactorSimulationSummary] = []
        for f in factors:
            cat_mean = category_means.get(f.factor_type, f.most_likely)
            contrib = (cat_mean / expected_loss * 100.0) if expected_loss > 0 else 0.0
            factors_summary.append(
                FactorSimulationSummary(
                    factor_type=f.factor_type,
                    distribution_type=f.distribution_type,
                    expected_value=round(cat_mean, 2),
                    contribution_percentage=round(contrib, 2),
                    minimum_value=f.minimum,
                    most_likely_value=f.most_likely,
                    maximum_value=f.maximum,
                    probability=f.probability,
                )
            )

        # Generate histogram buckets (15 bins)
        num_bins = 15
        bin_width = (maximum_loss - minimum_loss) / num_bins if maximum_loss > minimum_loss else 1.0
        bins = [minimum_loss + i * bin_width for i in range(num_bins + 1)]
        frequencies = [0] * num_bins

        for val in total_losses:
            if bin_width > 0:
                bin_idx = min(num_bins - 1, int((val - minimum_loss) / bin_width))
                frequencies[bin_idx] += 1
            else:
                frequencies[0] += 1

        return MonteCarloResult(
            expected_loss=round(expected_loss, 2),
            minimum_loss=round(minimum_loss, 2),
            maximum_loss=round(maximum_loss, 2),
            p10_loss=round(p10, 2),
            p25_loss=round(p25, 2),
            p50_loss=round(p50, 2),
            p75_loss=round(p75, 2),
            p90_loss=round(p90, 2),
            p95_loss=round(p95, 2),
            simulation_count=count,
            random_seed=seed,
            category_means={k: round(v, 2) for k, v in category_means.items()},
            factors_summary=factors_summary,
            histogram_bins=[round(b, 2) for b in bins],
            histogram_frequencies=frequencies,
        )
