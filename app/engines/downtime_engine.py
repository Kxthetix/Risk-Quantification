"""Downtime estimation engine (Phase 6).

Estimates minimum, most likely, and maximum business downtime hours
based on asset criticality, operational environment, and backup/redundancy posture.
"""
from dataclasses import dataclass

from app.models.asset import Asset
from app.models.enums import AssetCriticality, AssetEnvironment


@dataclass
class DowntimeParameters:
    """Estimated downtime duration distribution parameters (in hours)."""
    minimum_hours: float
    most_likely_hours: float
    maximum_hours: float
    explanation: str


class DowntimeEngine:
    """Calculates probable downtime distributions for an affected asset."""

    BASE_DOWNTIME = {
        AssetCriticality.LOW: (0.5, 2.0, 6.0),
        AssetCriticality.MEDIUM: (1.0, 4.0, 12.0),
        AssetCriticality.HIGH: (2.0, 8.0, 24.0),
        AssetCriticality.CRITICAL: (4.0, 16.0, 48.0),
    }

    ENV_MULTIPLIERS = {
        AssetEnvironment.PRODUCTION: 1.25,
        AssetEnvironment.STAGING: 0.8,
        AssetEnvironment.TESTING: 0.5,
        AssetEnvironment.DEVELOPMENT: 0.3,
        AssetEnvironment.OTHER: 1.0,
    }

    @classmethod
    def evaluate(
        cls,
        asset: Asset,
        custom_min: float = None,
        custom_mode: float = None,
        custom_max: float = None,
    ) -> DowntimeParameters:
        """Derive downtime duration bounds (hours)."""
        if custom_min is not None and custom_mode is not None and custom_max is not None:
            return DowntimeParameters(
                minimum_hours=max(0.0, float(custom_min)),
                most_likely_hours=max(float(custom_min), float(custom_mode)),
                maximum_hours=max(float(custom_mode), float(custom_max)),
                explanation="Downtime parameters explicitly provided by administrator.",
            )

        # Baseline from criticality
        crit = asset.criticality or AssetCriticality.MEDIUM
        min_h, mode_h, max_h = cls.BASE_DOWNTIME.get(crit, (1.0, 4.0, 12.0))

        # Environment multiplier
        env = asset.environment or AssetEnvironment.PRODUCTION
        env_mult = cls.ENV_MULTIPLIERS.get(env, 1.0)
        min_h *= env_mult
        mode_h *= env_mult
        max_h *= env_mult

        # Internet exposure increases containment time by ~20%
        if asset.internet_exposed:
            mode_h *= 1.2
            max_h *= 1.25

        return DowntimeParameters(
            minimum_hours=round(max(0.25, min_h), 2),
            most_likely_hours=round(max(min_h, mode_h), 2),
            maximum_hours=round(max(mode_h, max_h), 2),
            explanation=(
                f"Downtime estimated based on {crit.value} criticality in "
                f"{env.value} environment (Internet exposed: {asset.internet_exposed})."
            ),
        )
