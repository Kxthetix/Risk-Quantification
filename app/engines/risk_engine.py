"""Central Cyber Risk Calculation Engine (Phase 5)."""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.engines.control_engine import ControlEngine, ControlEngineResult
from app.engines.exposure_engine import ExposureEngine, ExposureEngineResult
from app.engines.impact_engine import ImpactEngine, ImpactEngineResult
from app.engines.likelihood_engine import LikelihoodEngine, LikelihoodEngineResult
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import RiskLevel, RiskMethod, ValidationStatus
from app.models.evidence import Evidence
from app.models.risk_rule import RiskRule
from app.models.vulnerability import Vulnerability
from app.models.vulnerability_validation import VulnerabilityValidation


@dataclass
class RiskFactorData:
    name: str
    raw_value: str
    normalized_value: float
    weight: float
    contribution: float


@dataclass
class RiskEngineOutput:
    final_risk_score: float
    risk_level: RiskLevel
    risk_method: str
    risk_model_version: str
    likelihood_score: float
    impact_score: float
    exposure_score: float
    exploitability_score: float
    validation_score: float
    control_score: float
    business_criticality_score: float
    factors: List[RiskFactorData]
    explanation: List[str]
    risk_reducers: List[str]
    factors_snapshot: List[Dict[str, Any]]
    configuration_snapshot: Dict[str, Any]
    input_snapshot: Dict[str, Any]


class RiskEngine:
    """Deterministic, explainable, context-driven cyber risk scoring engine."""

    DEFAULT_MODEL_VERSION = "1.0"
    DEFAULT_METHOD = RiskMethod.CONTEXTUAL_WEIGHTED.value

    DEFAULT_WEIGHTS = {
        "CVSS": 0.25,
        "EXPLOITABILITY": 0.20,
        "ASSET_CRITICALITY": 0.20,
        "EXPOSURE": 0.10,
        "VALIDATION_CONFIDENCE": 0.10,
        "BUSINESS_IMPACT": 0.10,
        "CONTROL_GAP": 0.05,
    }

    DEFAULT_THRESHOLDS = {
        "LOW_MAX": 20.0,
        "MEDIUM_MAX": 40.0,
        "HIGH_MAX": 60.0,
        "VERY_HIGH_MAX": 80.0,
    }

    @classmethod
    def evaluate(
        cls,
        asset: Asset,
        asset_vulnerability: AssetVulnerability,
        vulnerability: Vulnerability,
        validation: Optional[VulnerabilityValidation] = None,
        evidence_list: Optional[List[Evidence]] = None,
        rules: Optional[Dict[str, RiskRule]] = None,
        org_max_asset_value: Optional[float] = None,
    ) -> RiskEngineOutput:
        """Calculate the multi-factor cyber risk score and generate structured explainability."""
        # 1. Component evaluations
        likelihood_res: LikelihoodEngineResult = LikelihoodEngine.evaluate(
            vulnerability=vulnerability,
            evidence_list=evidence_list,
        )
        impact_res: ImpactEngineResult = ImpactEngine.evaluate(
            asset=asset,
            org_max_asset_value=org_max_asset_value,
        )
        exposure_res: ExposureEngineResult = ExposureEngine.evaluate(
            asset=asset,
            evidence_list=evidence_list,
        )
        control_res: ControlEngineResult = ControlEngine.evaluate(
            evidence_list=evidence_list,
        )

        # 2. Factor normalizations (0.0 to 100.0)
        cvss_raw = float(vulnerability.cvss_score or 0.0)
        cvss_norm = round(min(100.0, max(0.0, cvss_raw * 10.0)), 2)

        exploit_norm = likelihood_res.exploitability_score
        crit_norm = impact_res.criticality_value
        exposure_norm = exposure_res.exposure_score

        # Validation confidence normalization
        if validation:
            conf_norm = round(min(100.0, max(0.0, validation.confidence * 100.0)), 2)
            val_score = float(validation.validation_score)
            val_status = validation.validation_status
        else:
            # Unvalidated match has moderate/lower default confidence
            conf_norm = round(min(100.0, max(0.0, asset_vulnerability.match_confidence * 60.0)), 2)
            val_score = 50.0
            val_status = None

        biz_impact_norm = impact_res.impact_score
        control_gap_norm = control_res.control_gap

        factor_values: Dict[str, tuple[str, float]] = {
            "CVSS": (str(cvss_raw), cvss_norm),
            "EXPLOITABILITY": (likelihood_res.exploit_available, exploit_norm),
            "ASSET_CRITICALITY": (asset.criticality.value, crit_norm),
            "EXPOSURE": ("INTERNET" if asset.internet_exposed else "INTERNAL", exposure_norm),
            "VALIDATION_CONFIDENCE": (f"{conf_norm / 100.0:.2f}", conf_norm),
            "BUSINESS_IMPACT": (asset.data_classification.value, biz_impact_norm),
            "CONTROL_GAP": (f"Gap {control_gap_norm:.1f}%", control_gap_norm),
        }

        # 3. Resolve & normalize rule weights
        effective_weights = dict(cls.DEFAULT_WEIGHTS)
        if rules:
            for factor_key, rule in rules.items():
                if rule.enabled:
                    effective_weights[factor_key] = rule.weight
                else:
                    effective_weights[factor_key] = 0.0

        total_weight = sum(effective_weights.values())
        if total_weight <= 0.0:
            total_weight = sum(cls.DEFAULT_WEIGHTS.values())
            effective_weights = dict(cls.DEFAULT_WEIGHTS)

        normalized_weights = {
            k: v / total_weight for k, v in effective_weights.items()
        }

        # 4. Compute weighted risk score
        factors: List[RiskFactorData] = []
        factors_snapshot: List[Dict[str, Any]] = []
        weighted_sum = 0.0

        for name, (raw, norm) in factor_values.items():
            w = normalized_weights.get(name, 0.0)
            contrib = round(norm * w, 2)
            weighted_sum += contrib

            factor_obj = RiskFactorData(
                name=name,
                raw_value=raw,
                normalized_value=norm,
                weight=round(w, 4),
                contribution=contrib,
            )
            factors.append(factor_obj)
            factors_snapshot.append({
                "name": name,
                "raw_value": raw,
                "value": norm,
                "weight": round(w, 4),
                "contribution": contrib,
            })

        raw_score = weighted_sum

        # 5. Dampening Rules (Section 12 & False Positives)
        # If finding is confirmed false positive or non-vulnerable, risk drops to near-zero
        if val_status in (ValidationStatus.FALSE_POSITIVE, ValidationStatus.LIKELY_NOT_VULNERABLE):
            raw_score = raw_score * 0.15
        elif conf_norm < 30.0:
            # Low validation confidence dampens risk so unconfirmed findings don't top the dashboard
            dampening = 0.40 + 0.60 * (conf_norm / 100.0)
            raw_score = raw_score * dampening

        final_risk_score = round(max(0.0, min(100.0, raw_score)), 1)

        # 6. Risk Level classification
        if final_risk_score <= cls.DEFAULT_THRESHOLDS["LOW_MAX"]:
            risk_level = RiskLevel.LOW
        elif final_risk_score <= cls.DEFAULT_THRESHOLDS["MEDIUM_MAX"]:
            risk_level = RiskLevel.MEDIUM
        elif final_risk_score <= cls.DEFAULT_THRESHOLDS["HIGH_MAX"]:
            risk_level = RiskLevel.HIGH
        elif final_risk_score <= cls.DEFAULT_THRESHOLDS["VERY_HIGH_MAX"]:
            risk_level = RiskLevel.VERY_HIGH
        else:
            risk_level = RiskLevel.CRITICAL

        # 7. Explainability generation
        explanation: List[str] = []
        if cvss_raw >= 9.0:
            explanation.append(f"Vulnerability technical severity is critical (CVSS {cvss_raw}).")
        elif cvss_raw >= 7.0:
            explanation.append(f"Vulnerability technical severity is high (CVSS {cvss_raw}).")

        explanation.extend(likelihood_res.reasons)
        explanation.extend(impact_res.reasons)
        explanation.extend(exposure_res.reasons)

        if conf_norm >= 80.0:
            explanation.append(f"Empirical validation confidence is high ({conf_norm / 100.0:.2f}).")
        elif conf_norm <= 35.0:
            explanation.append(f"Low validation confidence ({conf_norm / 100.0:.2f}) dampens calculated risk until corroborating telemetry is collected.")

        explanation.extend(control_res.reasons)

        # Snapshots for auditability & forensic inspection
        configuration_snapshot = {
            "model_version": cls.DEFAULT_MODEL_VERSION,
            "method": cls.DEFAULT_METHOD,
            "weights": normalized_weights,
            "thresholds": cls.DEFAULT_THRESHOLDS,
        }
        input_snapshot = {
            "asset_id": str(asset.id),
            "asset_name": asset.name,
            "criticality": asset.criticality.value,
            "data_classification": asset.data_classification.value,
            "environment": asset.environment.value,
            "internet_exposed": asset.internet_exposed,
            "business_value": float(asset.business_value or 0.0),
            "vulnerability_id": str(vulnerability.id),
            "cve_id": vulnerability.cve_id,
            "cvss_score": cvss_raw,
            "known_exploited": vulnerability.known_exploited,
            "exploit_available": vulnerability.exploit_available.value if vulnerability.exploit_available else None,
            "validation_status": val_status.value if val_status else None,
            "validation_confidence": conf_norm / 100.0,
        }

        return RiskEngineOutput(
            final_risk_score=final_risk_score,
            risk_level=risk_level,
            risk_method=cls.DEFAULT_METHOD,
            risk_model_version=cls.DEFAULT_MODEL_VERSION,
            likelihood_score=likelihood_res.likelihood_score,
            impact_score=impact_res.impact_score,
            exposure_score=exposure_res.exposure_score,
            exploitability_score=likelihood_res.exploitability_score,
            validation_score=val_score,
            control_score=control_res.control_score,
            business_criticality_score=impact_res.business_criticality_score,
            factors=factors,
            explanation=explanation,
            risk_reducers=control_res.risk_reducers,
            factors_snapshot=factors_snapshot,
            configuration_snapshot=configuration_snapshot,
            input_snapshot=input_snapshot,
        )
