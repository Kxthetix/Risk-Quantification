"""Exposure calculation engine (Phase 5)."""
from dataclasses import dataclass
from typing import List, Optional

from app.models.asset import Asset
from app.models.enums import EvidenceType
from app.models.evidence import Evidence


@dataclass
class ExposureEngineResult:
    exposure_score: float  # 0.0 to 100.0
    internet_exposed: bool
    reasons: List[str]


class ExposureEngine:
    """Evaluates the network exposure, reachability, and attack surface of the asset."""

    @staticmethod
    def evaluate(
        asset: Asset,
        evidence_list: Optional[List[Evidence]] = None,
    ) -> ExposureEngineResult:
        reasons: List[str] = []

        if asset.internet_exposed:
            score = 100.0
            reasons.append("Asset is directly exposed to the public Internet, maximizing attack surface.")
        else:
            # Check network evidence for local only vs intranet
            is_local = False
            if evidence_list:
                for ev in evidence_list:
                    if ev.evidence_type in (EvidenceType.NETWORK_EXPOSURE, EvidenceType.PORT):
                        val = (ev.value or "").lower()
                        if "127.0.0.1" in val or "localhost" in val or "local_only" in val:
                            is_local = True
                            break

            if is_local:
                score = 20.0
                reasons.append("Asset network reachability is restricted to localhost / isolated segment.")
            else:
                score = 40.0
                reasons.append("Asset is internal / intranet-only, requiring pre-existing network foothold.")

        # Check for active listening ports that corroborate exposure
        if evidence_list:
            ports = [ev.value for ev in evidence_list if ev.evidence_type == EvidenceType.PORT and ev.result.value == "CONFIRMED"]
            if ports and asset.internet_exposed:
                reasons.append(f"Publicly accessible open ports confirmed: {', '.join(ports[:3])}")

        return ExposureEngineResult(
            exposure_score=round(score, 2),
            internet_exposed=asset.internet_exposed,
            reasons=reasons,
        )
