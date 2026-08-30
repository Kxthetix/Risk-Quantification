"""Security Controls & Mitigations engine (Phase 5)."""
from dataclasses import dataclass
from typing import List, Optional

from app.models.enums import EvidenceType
from app.models.evidence import Evidence


@dataclass
class ControlEngineResult:
    control_score: float     # 0.0 to 100.0 (effectiveness of controls)
    control_gap: float       # 0.0 to 100.0 (unmitigated gap, risk factor)
    active_controls: List[str]
    risk_reducers: List[str]
    reasons: List[str]


class ControlEngine:
    """Evaluates security controls and mitigation evidence to determine risk reduction."""

    CONTROL_WEIGHTS = {
        "waf": 25.0,
        "web application firewall": 25.0,
        "ips": 20.0,
        "intrusion prevention": 20.0,
        "firewall": 20.0,
        "edr": 20.0,
        "endpoint detection": 20.0,
        "segmentation": 20.0,
        "network segmentation": 20.0,
        "virtual patch": 25.0,
        "virtual patching": 25.0,
        "access control": 15.0,
        "mfa": 15.0,
        "monitoring": 10.0,
        "siem": 10.0,
    }

    @classmethod
    def evaluate(
        cls,
        evidence_list: Optional[List[Evidence]] = None,
    ) -> ControlEngineResult:
        active_controls: List[str] = []
        risk_reducers: List[str] = []
        reasons: List[str] = []
        total_strength = 0.0

        if evidence_list:
            for ev in evidence_list:
                if ev.evidence_type in (EvidenceType.SECURITY_CONTROL, EvidenceType.CONFIGURATION):
                    val = (ev.value or "").lower()
                    for keyword, pts in cls.CONTROL_WEIGHTS.items():
                        if keyword in val:
                            control_name = keyword.upper()
                            if control_name not in active_controls:
                                active_controls.append(control_name)
                                total_strength += pts
                                risk_reducers.append(f"{control_name} active / mitigating: {ev.value}")
                                reasons.append(f"Compensating control identified: {control_name}")

        # Maximum mitigation discount capped at 80.0
        control_score = min(80.0, total_strength)
        # Control Gap (unmitigated exposure, 0-100)
        # Strong controls -> low gap (e.g. 20-35); No controls -> 100 gap
        control_gap = round(max(15.0, 100.0 - control_score), 2)

        if not active_controls:
            reasons.append("No active compensating controls or mitigations identified (maximum control gap).")
        else:
            reasons.append(f"Security controls reduce vulnerability exploitation probability ({', '.join(active_controls)}).")

        return ControlEngineResult(
            control_score=round(control_score, 2),
            control_gap=control_gap,
            active_controls=active_controls,
            risk_reducers=risk_reducers,
            reasons=reasons,
        )
