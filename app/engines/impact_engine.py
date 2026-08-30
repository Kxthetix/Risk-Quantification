"""Impact & Business Criticality calculation engine (Phase 5)."""
from dataclasses import dataclass
import math
from typing import List, Optional

from app.models.asset import Asset
from app.models.enums import AssetCriticality, AssetEnvironment, DataClassification


@dataclass
class ImpactEngineResult:
    business_criticality_score: float  # 0.0 to 100.0
    impact_score: float                # 0.0 to 100.0
    criticality_value: float
    data_classification_value: float
    environment_multiplier: float
    business_value_score: float
    reasons: List[str]


class ImpactEngine:
    """Evaluates the organizational and technical impact of a vulnerability on a specific asset."""

    CRITICALITY_MAPPING = {
        AssetCriticality.LOW: 25.0,
        AssetCriticality.MEDIUM: 50.0,
        AssetCriticality.HIGH: 75.0,
        AssetCriticality.CRITICAL: 100.0,
    }

    DATA_CLASSIFICATION_MAPPING = {
        DataClassification.PUBLIC: 20.0,
        DataClassification.INTERNAL: 40.0,
        DataClassification.CONFIDENTIAL: 70.0,
        DataClassification.RESTRICTED: 100.0,
    }

    ENVIRONMENT_MULTIPLIER = {
        AssetEnvironment.PRODUCTION: 1.0,
        AssetEnvironment.DISASTER_RECOVERY: 0.85,
        AssetEnvironment.STAGING: 0.70,
        AssetEnvironment.TESTING: 0.40,
        AssetEnvironment.DEVELOPMENT: 0.35,
        AssetEnvironment.OTHER: 0.50,
    }

    @classmethod
    def evaluate(
        cls,
        asset: Asset,
        org_max_asset_value: Optional[float] = None,
    ) -> ImpactEngineResult:
        reasons: List[str] = []

        # 1. Asset Criticality (0-100)
        crit_score = cls.CRITICALITY_MAPPING.get(asset.criticality, 50.0)
        if asset.criticality == AssetCriticality.CRITICAL:
            reasons.append("Asset criticality is designated as CRITICAL to business operations.")
        elif asset.criticality == AssetCriticality.HIGH:
            reasons.append("Asset criticality is designated as HIGH.")

        # 2. Data Classification (0-100)
        data_score = cls.DATA_CLASSIFICATION_MAPPING.get(asset.data_classification, 40.0)
        if asset.data_classification == DataClassification.RESTRICTED:
            reasons.append("Asset stores or processes RESTRICTED / regulated data.")
        elif asset.data_classification == DataClassification.CONFIDENTIAL:
            reasons.append("Asset handles CONFIDENTIAL business records.")

        # 3. Environment Multiplier
        env_mult = cls.ENVIRONMENT_MULTIPLIER.get(asset.environment, 0.50)
        if asset.environment == AssetEnvironment.PRODUCTION:
            reasons.append("Asset operates in live PRODUCTION environment.")
        elif asset.environment in (AssetEnvironment.DEVELOPMENT, AssetEnvironment.TESTING):
            reasons.append(f"Asset operates in non-production {asset.environment.value} environment, reducing incident impact.")

        # 4. Business Value (Relative normalization)
        raw_val = float(asset.business_value or 0.0)
        if raw_val <= 0.0:
            bv_score = crit_score  # fallback to criticality when unassigned
        elif org_max_asset_value and org_max_asset_value > 0:
            # Scaled relative to organization's highest value asset
            bv_score = min(100.0, max(10.0, (raw_val / org_max_asset_value) * 100.0))
        else:
            # Logarithmic normalization for standalone asset values
            # e.g., 10k -> ~40, 100k -> ~50, 1M -> ~60, 10M -> ~70, 100M -> ~80
            bv_score = min(100.0, max(10.0, math.log10(max(1000.0, raw_val)) * 12.5))

        # 5. Composite Impact & Business Criticality
        # Business Criticality synthesizes asset criticality and business value
        business_criticality_score = round(
            (0.60 * crit_score + 0.40 * bv_score), 2
        )

        # Impact Score combines data classification, business criticality, and environment factor
        raw_impact = (0.45 * crit_score + 0.30 * data_score + 0.25 * bv_score) * env_mult
        impact_score = round(max(5.0, min(100.0, raw_impact)), 2)

        return ImpactEngineResult(
            business_criticality_score=business_criticality_score,
            impact_score=impact_score,
            criticality_value=crit_score,
            data_classification_value=data_score,
            environment_multiplier=env_mult,
            business_value_score=round(bv_score, 2),
            reasons=reasons,
        )
