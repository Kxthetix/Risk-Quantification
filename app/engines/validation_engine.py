"""Core vulnerability validation decision and explainability engine."""
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field

from app.engines.configuration_validation import (
    ConfigurationValidationEngine,
    ConfigurationValidationResult,
)
from app.engines.exposure_validation import (
    ExposureValidationEngine,
    ExposureValidationResult,
)
from app.engines.version_validation import (
    VersionValidationEngine,
    VersionValidationResult,
)
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import (
    EvidenceResult,
    EvidenceType,
    ExploitAvailability,
    ExposureLevel,
    ValidationStatus,
)
from app.models.evidence import Evidence
from app.models.validation_rule import ValidationRule
from app.models.vulnerability import Vulnerability


# Default rule weight fallbacks
DEFAULT_WEIGHTS: Dict[str, float] = {
    "VERSION_MATCH": 40.0,
    "CONFIGURATION_MATCH": 25.0,
    "ACTIVE_SERVICE": 15.0,
    "INTERNET_EXPOSURE": 10.0,
    "KNOWN_EXPLOIT": 10.0,
    "MITIGATION_PRESENT": -25.0,
}


@dataclass
class ValidationEngineOutput:
    """Consolidated outcome of the multi-stage validation engine pipeline."""
    validation_status: ValidationStatus
    validation_score: float  # 0.0 to 100.0
    confidence: float  # 0.0 to 1.0
    version_check: str  # CONFIRMED, NOT_VULNERABLE, UNKNOWN
    configuration_check: str  # CONFIRMED, NOT_CONFIRMED, UNKNOWN
    exposure_check: str  # INTERNET, INTRANET, LOCAL_ONLY, UNKNOWN
    exploit_check: str  # EXPLOITED, POC_AVAILABLE, NO_EXPLOIT, UNKNOWN
    mitigation_check: str  # MITIGATED, PARTIALLY_MITIGATED, NO_MITIGATION, UNKNOWN
    reasons: List[str]
    evidence_count: int
    rule_contributions: Dict[str, float] = field(default_factory=dict)


class ValidationEngine:
    """Orchestrates multi-stage evidence correlation, rule scoring, and status derivation."""

    @classmethod
    def evaluate(
        cls,
        asset_vulnerability: AssetVulnerability,
        evidence_list: Optional[List[Evidence]] = None,
        rules: Optional[List[ValidationRule]] = None,
    ) -> ValidationEngineOutput:
        """Run the comprehensive validation pipeline for an asset vulnerability."""
        evidence_list = evidence_list or []
        rules = rules or []

        # Build rule weight lookup
        weights = dict(DEFAULT_WEIGHTS)
        for r in rules:
            if r.enabled and r.rule_id:
                weights[r.rule_id] = r.weight

        asset: Optional[Asset] = asset_vulnerability.asset
        vuln: Vulnerability = asset_vulnerability.vulnerability
        software = asset_vulnerability.software

        # Partition evidence into functional categories to prevent double counting
        ev_by_type: Dict[EvidenceType, List[Evidence]] = {}
        for ev in evidence_list:
            ev_by_type.setdefault(ev.evidence_type, []).append(ev)

        # -------------------------------------------------------------
        # Stage 1: Version Validation
        # -------------------------------------------------------------
        installed_ver = None
        if software:
            installed_ver = software.product_version
        # Also check asset_software relationship if available
        if not installed_ver and asset and asset.asset_software:
            for asw in asset.asset_software:
                if asw.software_id == asset_vulnerability.software_id and asw.installed_version:
                    installed_ver = asw.installed_version
                    break

        v_res: VersionValidationResult = VersionValidationEngine.evaluate(
            installed_version=installed_ver,
            vulnerability_cpes=vuln.vulnerability_cpes or [],
            version_evidence=ev_by_type.get(EvidenceType.VERSION, [])
            + ev_by_type.get(EvidenceType.PATCH_STATUS, []),
        )

        # -------------------------------------------------------------
        # Stage 2: Configuration Validation
        # -------------------------------------------------------------
        c_res: ConfigurationValidationResult = ConfigurationValidationEngine.evaluate(
            config_evidence=ev_by_type.get(EvidenceType.CONFIGURATION, []),
            cve_description=vuln.description,
        )

        # -------------------------------------------------------------
        # Stage 3: Exposure Validation
        # -------------------------------------------------------------
        asset_exposed = asset.internet_exposed if asset else False
        net_ev = (
            ev_by_type.get(EvidenceType.NETWORK_EXPOSURE, [])
            + ev_by_type.get(EvidenceType.PORT, [])
            + ev_by_type.get(EvidenceType.SERVICE, [])
        )
        e_res: ExposureValidationResult = ExposureValidationEngine.evaluate(
            asset_internet_exposed=asset_exposed,
            network_evidence=net_ev,
        )

        # -------------------------------------------------------------
        # Stage 4: Exploitability Validation
        # -------------------------------------------------------------
        exploit_check = "UNKNOWN"
        exploit_score_factor = 0.0
        exploit_reasons = []

        exploit_ev = ev_by_type.get(EvidenceType.EXPLOIT, [])
        has_confirmed_exploit_ev = any(e.result == EvidenceResult.CONFIRMED for e in exploit_ev)

        if vuln.known_exploited:
            exploit_check = "EXPLOITED"
            exploit_score_factor = 1.0
            exploit_reasons.append("Vulnerability is cataloged in CISA Known Exploited Vulnerabilities (KEV)")
        elif has_confirmed_exploit_ev:
            exploit_check = "POC_AVAILABLE"
            exploit_score_factor = 0.9
            exploit_reasons.append("Active exploit weaponization verified through telemetry/evidence")
        elif vuln.exploit_available == ExploitAvailability.YES:
            exploit_check = "POC_AVAILABLE"
            exploit_score_factor = 0.8
            exploit_reasons.append("Public exploit proof-of-concept is available")
        elif vuln.exploit_available == ExploitAvailability.NO:
            exploit_check = "NO_EXPLOIT"
            exploit_score_factor = 0.0
            exploit_reasons.append("No known functional exploit code currently identified")
        else:
            exploit_check = "UNKNOWN"
            exploit_score_factor = 0.3
            exploit_reasons.append("Exploitation status in the wild is currently unknown")

        # -------------------------------------------------------------
        # Stage 5: Mitigation Validation
        # -------------------------------------------------------------
        sec_ctrl_ev = ev_by_type.get(EvidenceType.SECURITY_CONTROL, [])
        mitigation_check = "NO_MITIGATION"
        mitigation_reasons = []
        mitigation_present = False

        if sec_ctrl_ev:
            confirmed_ctrls = [e for e in sec_ctrl_ev if e.result == EvidenceResult.CONFIRMED]
            if confirmed_ctrls:
                mitigation_present = True
                mitigation_check = "MITIGATED"
                ctrl_descs = "; ".join(f"'{c.value}'" for c in confirmed_ctrls)
                mitigation_reasons.append(f"Compensating security control active: {ctrl_descs}")
            else:
                mitigation_check = "NO_MITIGATION"
                mitigation_reasons.append("Evaluated security controls do not sufficiently mitigate exposure")

        # -------------------------------------------------------------
        # Stage 6: Scoring & Evidence Aggregation (No Double Counting)
        # -------------------------------------------------------------
        score = 0.0
        contributions: Dict[str, float] = {}

        # 1. Version contribution (Identity & Version category)
        w_ver = weights.get("VERSION_MATCH", 40.0)
        if v_res.status == "CONFIRMED":
            contrib = w_ver * v_res.confidence
            score += contrib
            contributions["VERSION_MATCH"] = round(contrib, 2)
        elif v_res.status == "NOT_VULNERABLE":
            # Direct contradiction - installed version is safe or patched
            score = 0.0
            contributions["VERSION_MATCH"] = 0.0
        else:
            # UNKNOWN version: provide a modest proportional baseline if software matched
            contrib = w_ver * 0.35
            score += contrib
            contributions["VERSION_MATCH"] = round(contrib, 2)

        # 2. Configuration contribution
        w_cfg = weights.get("CONFIGURATION_MATCH", 25.0)
        if c_res.status == "CONFIRMED":
            contrib = w_cfg * c_res.confidence
            score += contrib
            contributions["CONFIGURATION_MATCH"] = round(contrib, 2)
        elif c_res.status == "NOT_CONFIRMED":
            # Vulnerable configuration is verified absent
            score = max(0.0, score - 15.0)
            contributions["CONFIGURATION_MATCH"] = -15.0
        else:
            # Unknown configuration
            contributions["CONFIGURATION_MATCH"] = 0.0

        # 3. Active Service contribution
        w_svc = weights.get("ACTIVE_SERVICE", 15.0)
        if e_res.service_active:
            contrib = w_svc * 1.0
            score += contrib
            contributions["ACTIVE_SERVICE"] = round(contrib, 2)
        else:
            contributions["ACTIVE_SERVICE"] = 0.0

        # 4. Exposure contribution
        w_exp = weights.get("INTERNET_EXPOSURE", 10.0)
        if e_res.level == ExposureLevel.INTERNET.value:
            contrib = w_exp * 1.0
            score += contrib
            contributions["INTERNET_EXPOSURE"] = round(contrib, 2)
        elif e_res.level == ExposureLevel.INTRANET.value:
            contrib = w_exp * 0.4
            score += contrib
            contributions["INTERNET_EXPOSURE"] = round(contrib, 2)
        else:
            contributions["INTERNET_EXPOSURE"] = 0.0

        # 5. Exploit contribution
        w_exp_avail = weights.get("KNOWN_EXPLOIT", 10.0)
        contrib_exploit = w_exp_avail * exploit_score_factor
        score += contrib_exploit
        contributions["KNOWN_EXPLOIT"] = round(contrib_exploit, 2)

        # 6. Mitigation deduction
        w_mit = weights.get("MITIGATION_PRESENT", -25.0)
        if mitigation_present:
            score = max(0.0, score + w_mit)
            contributions["MITIGATION_PRESENT"] = w_mit

        # Bound score to [0, 100]
        final_score = round(min(max(score, 0.0), 100.0), 1)

        # -------------------------------------------------------------
        # Stage 7: Confidence & Final Status Determination
        # -------------------------------------------------------------
        # Aggregate confidence based on presence of verifiable data
        conf_weights = [v_res.confidence]
        if c_res.status != "UNKNOWN":
            conf_weights.append(c_res.confidence)
        if e_res.level != ExposureLevel.UNKNOWN.value:
            conf_weights.append(e_res.confidence)
        if exploit_check in ("EXPLOITED", "POC_AVAILABLE", "NO_EXPLOIT"):
            conf_weights.append(0.85)

        avg_confidence = round(sum(conf_weights) / len(conf_weights), 2)

        # Determine status according to calibrated score tiers
        if v_res.status == "NOT_VULNERABLE":
            status = ValidationStatus.LIKELY_NOT_VULNERABLE if final_score > 10 else ValidationStatus.FALSE_POSITIVE
            avg_confidence = max(avg_confidence, 0.90)
        elif final_score >= 80.0:
            status = ValidationStatus.CONFIRMED
        elif final_score >= 60.0:
            status = ValidationStatus.LIKELY_VULNERABLE
        elif final_score >= 40.0:
            status = ValidationStatus.UNKNOWN
        elif final_score >= 20.0:
            status = ValidationStatus.LIKELY_NOT_VULNERABLE
        else:
            status = ValidationStatus.FALSE_POSITIVE

        # -------------------------------------------------------------
        # Stage 8: Structured Explainability Reasons
        # -------------------------------------------------------------
        reasons: List[str] = []
        if v_res.reason:
            reasons.append(v_res.reason)
        if c_res.status != "UNKNOWN" and c_res.reason:
            reasons.append(c_res.reason)
        elif c_res.status == "UNKNOWN":
            reasons.append("Required feature or module configuration could not be verified")

        if e_res.reason:
            reasons.append(e_res.reason)
        reasons.extend(exploit_reasons)
        if mitigation_reasons:
            reasons.extend(mitigation_reasons)

        return ValidationEngineOutput(
            validation_status=status,
            validation_score=final_score,
            confidence=avg_confidence,
            version_check=v_res.status,
            configuration_check=c_res.status,
            exposure_check=e_res.level,
            exploit_check=exploit_check,
            mitigation_check=mitigation_check,
            reasons=reasons,
            evidence_count=len(evidence_list),
            rule_contributions=contributions,
        )
