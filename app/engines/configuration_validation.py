"""Configuration validation engine evaluating vulnerable setting requirements against collected evidence."""
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

from app.models.enums import EvidenceResult, EvidenceType
from app.models.evidence import Evidence


@dataclass
class ConfigurationValidationResult:
    """Outcome of configuration validation checking."""
    status: str  # "CONFIRMED", "NOT_CONFIRMED", "UNKNOWN"
    confidence: float  # 0.0 to 1.0
    reason: str
    evidence_count: int


class ConfigurationValidationEngine:
    """Evaluates evidence for prerequisite configurations, features, or modules required by the vulnerability."""

    @staticmethod
    def evaluate(
        config_evidence: Optional[List[Evidence]] = None,
        cve_description: Optional[str] = None,
    ) -> ConfigurationValidationResult:
        """Evaluate configuration evidence.

        Args:
            config_evidence: List of Evidence items of type CONFIGURATION.
            cve_description: Optional text of CVE to detect if a specific config is mentioned.

        Returns:
            ConfigurationValidationResult containing status, confidence, and explainable reason.
        """
        if not config_evidence:
            return ConfigurationValidationResult(
                status="UNKNOWN",
                confidence=0.50,
                reason="No configuration evidence available to verify required features or settings.",
                evidence_count=0,
            )

        confirmed_items = []
        not_confirmed_items = []

        for ev in config_evidence:
            if ev.result == EvidenceResult.CONFIRMED:
                confirmed_items.append(ev)
            elif ev.result == EvidenceResult.NOT_CONFIRMED:
                not_confirmed_items.append(ev)

        # If evidence explicitly verifies the vulnerable configuration is disabled/absent
        if not_confirmed_items and not confirmed_items:
            details = "; ".join(f"'{e.value}'" for e in not_confirmed_items)
            avg_conf = sum(e.confidence for e in not_confirmed_items) / len(not_confirmed_items)
            return ConfigurationValidationResult(
                status="NOT_CONFIRMED",
                confidence=round(avg_conf, 2),
                reason=f"Vulnerable configuration confirmed absent or disabled: {details}.",
                evidence_count=len(not_confirmed_items),
            )

        # If evidence confirms vulnerable configuration/feature is present and active
        if confirmed_items:
            details = "; ".join(f"'{e.value}'" for e in confirmed_items)
            avg_conf = sum(e.confidence for e in confirmed_items) / len(confirmed_items)
            return ConfigurationValidationResult(
                status="CONFIRMED",
                confidence=round(avg_conf, 2),
                reason=f"Vulnerable configuration or feature active: {details}.",
                evidence_count=len(confirmed_items),
            )

        return ConfigurationValidationResult(
            status="UNKNOWN",
            confidence=0.40,
            reason="Configuration evidence collected, but presence of vulnerable settings remains indeterminate.",
            evidence_count=len(config_evidence),
        )
