"""Network exposure and service activity validation engine."""
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

from app.models.enums import EvidenceResult, EvidenceType, ExposureLevel
from app.models.evidence import Evidence


@dataclass
class ExposureValidationResult:
    """Outcome of network exposure and service presence evaluation."""
    level: str  # "INTERNET", "INTRANET", "LOCAL_ONLY", "UNKNOWN"
    service_active: bool
    confidence: float
    reason: str
    ports: List[str]
    services: List[str]


class ExposureValidationEngine:
    """Evaluates network exposure boundaries, open listening ports, and service run-states."""

    @staticmethod
    def evaluate(
        asset_internet_exposed: Optional[bool],
        network_evidence: Optional[List[Evidence]] = None,
    ) -> ExposureValidationResult:
        """Evaluate network accessibility and service activity.

        Args:
            asset_internet_exposed: Asset level internet exposure flag from Phase 2.
            network_evidence: List of Evidence items of type NETWORK_EXPOSURE, PORT, or SERVICE.

        Returns:
            ExposureValidationResult with exposure tier, service activity, confidence, and reasons.
        """
        exposure = ExposureLevel.UNKNOWN.value
        confidence = 0.50
        service_active = False
        reasons = []
        ports: List[str] = []
        services: List[str] = []

        # 1. Base classification from Phase 2 asset inventory
        if asset_internet_exposed is True:
            exposure = ExposureLevel.INTERNET.value
            confidence = 0.85
            reasons.append("Asset inventory records confirm public internet exposure")
        elif asset_internet_exposed is False:
            exposure = ExposureLevel.INTRANET.value
            confidence = 0.80
            reasons.append("Asset inventory records confirm internal intranet isolation")

        # 2. Refine or corroborate with network evidence
        if network_evidence:
            for ev in network_evidence:
                ev_val = ev.value.upper()

                # Network exposure tier evidence
                if ev.evidence_type == EvidenceType.NETWORK_EXPOSURE and ev.result == EvidenceResult.CONFIRMED:
                    if "INTERNET" in ev_val or "PUBLIC" in ev_val or "WAN" in ev_val:
                        exposure = ExposureLevel.INTERNET.value
                        confidence = max(confidence, ev.confidence)
                        reasons.append(f"Network scan confirmed internet-facing route ({ev.value})")
                    elif "LOCAL" in ev_val or "LOOPBACK" in ev_val or "127.0.0.1" in ev_val:
                        exposure = ExposureLevel.LOCAL_ONLY.value
                        confidence = max(confidence, ev.confidence)
                        reasons.append(f"Network scan confirmed local-only binding ({ev.value})")
                    elif "INTRANET" in ev_val or "INTERNAL" in ev_val or "LAN" in ev_val:
                        exposure = ExposureLevel.INTRANET.value
                        confidence = max(confidence, ev.confidence)
                        reasons.append(f"Network scan confirmed private network isolation ({ev.value})")

                # Port evidence
                elif ev.evidence_type == EvidenceType.PORT and ev.result == EvidenceResult.CONFIRMED:
                    ports.append(ev.value)
                    reasons.append(f"Listening port verified open: {ev.value}")

                # Service evidence
                elif ev.evidence_type == EvidenceType.SERVICE:
                    if ev.result == EvidenceResult.CONFIRMED:
                        service_active = True
                        services.append(ev.value)
                        reasons.append(f"Required service verified active: {ev.value}")
                    elif ev.result == EvidenceResult.NOT_CONFIRMED:
                        reasons.append(f"Target service verified inactive/stopped: {ev.value}")

        if not reasons:
            reasons.append("Network exposure and port telemetry unavailable")

        return ExposureValidationResult(
            level=exposure,
            service_active=service_active,
            confidence=round(confidence, 2),
            reason="; ".join(reasons),
            ports=ports,
            services=services,
        )
