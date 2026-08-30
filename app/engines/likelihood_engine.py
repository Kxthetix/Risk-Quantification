"""Likelihood & Exploitability calculation engine (Phase 5)."""
from dataclasses import dataclass
from typing import List, Optional

from app.models.enums import ExploitAvailability
from app.models.evidence import Evidence
from app.models.vulnerability import Vulnerability


@dataclass
class LikelihoodEngineResult:
    exploitability_score: float  # 0.0 to 100.0
    likelihood_score: float      # 0.0 to 100.0
    known_exploited: bool
    exploit_available: str
    reasons: List[str]


class LikelihoodEngine:
    """Evaluates the technical likelihood and threat intelligence around vulnerability exploitation."""

    @staticmethod
    def evaluate(
        vulnerability: Vulnerability,
        evidence_list: Optional[List[Evidence]] = None,
    ) -> LikelihoodEngineResult:
        reasons: List[str] = []
        score = 30.0  # baseline for confirmed vulnerability without public exploit

        # 1. CISA Known Exploited Vulnerability (KEV)
        is_kev = bool(vulnerability.known_exploited)
        if is_kev:
            score = 95.0
            reasons.append("Vulnerability is cataloged on CISA Known Exploited Vulnerabilities (KEV).")
        elif vulnerability.exploit_available == ExploitAvailability.YES:
            score = 85.0
            reasons.append("Functional weaponized exploit is publicly available.")
        elif vulnerability.exploit_available == ExploitAvailability.UNKNOWN:
            score = 45.0
        else:
            score = 30.0
            reasons.append("No active public weaponized exploit currently recorded.")

        # 2. Attack Vector characteristics from CVSS
        # Vector string or description parsing if available
        desc_lower = (vulnerability.description or "").lower()
        if "remote code execution" in desc_lower or "rce" in desc_lower:
            score = min(score + 10.0, 100.0)
            reasons.append("Vulnerability enables remote code execution (RCE).")
        elif "denial of service" in desc_lower or "dos" in desc_lower:
            score = max(score - 5.0, 15.0)

        # 3. Corroborate with exploit telemetry evidence
        if evidence_list:
            for ev in evidence_list:
                if ev.evidence_type.value == "EXPLOIT":
                    score = min(score + 15.0, 100.0)
                    reasons.append(f"Empirical exploit telemetry recorded: {ev.value}")
                    break

        exploitability_score = round(max(0.0, min(100.0, score)), 2)
        # Likelihood combines exploitability with ease of exploitation
        likelihood_score = exploitability_score

        return LikelihoodEngineResult(
            exploitability_score=exploitability_score,
            likelihood_score=likelihood_score,
            known_exploited=is_kev,
            exploit_available=vulnerability.exploit_available.value if vulnerability.exploit_available else "UNKNOWN",
            reasons=reasons,
        )
