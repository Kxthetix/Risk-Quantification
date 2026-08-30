"""Annualized Loss Expectancy (ALE) engine (Phase 6).

Calculates:
Annual Expected Loss (ALE) = Annual Incident Frequency / Probability * Single-Event Expected Loss
"""
from dataclasses import dataclass
from typing import Optional

from app.models.enums import RiskLevel
from app.models.risk_assessment import RiskAssessment


@dataclass
class AnnualizedLossResult:
    """Calculated annual loss expectancy and incident likelihood."""
    annual_probability: float
    annual_frequency: float
    expected_single_loss: float
    annual_expected_loss: float
    frequency_band: str
    explanation: str


class AnnualizedLossEngine:
    """Translates single-incident financial loss and Phase 5 cyber risk score into annual loss expectancy."""

    # Default configurable probability bands based on Phase 5 Cyber Risk Score (0-100)
    SCORE_PROBABILITY_MAPPING = [
        (20.0, 0.05, "VERY_LOW", "0.05 incidents/year (1 in 20 years)"),
        (40.0, 0.15, "LOW", "0.15 incidents/year (1 in ~7 years)"),
        (60.0, 0.35, "MODERATE", "0.35 incidents/year (1 in ~3 years)"),
        (80.0, 0.65, "HIGH", "0.65 incidents/year (1 in ~1.5 years)"),
        (100.0, 0.90, "VERY_HIGH", "0.90 incidents/year (~annual likelihood)"),
    ]

    @classmethod
    def map_risk_score_to_probability(cls, risk_score: float) -> tuple[float, str, str]:
        """Map a 0-100 cyber risk score to an annual incident probability."""
        score = max(0.0, min(100.0, float(risk_score)))
        for threshold, prob, band, desc in cls.SCORE_PROBABILITY_MAPPING:
            if score <= threshold:
                return prob, band, desc
        return 0.90, "VERY_HIGH", "0.90 incidents/year"

    @classmethod
    def evaluate(
        cls,
        expected_single_loss: float,
        risk_assessment: Optional[RiskAssessment] = None,
        custom_annual_prob: Optional[float] = None,
        custom_annual_freq: Optional[float] = None,
    ) -> AnnualizedLossResult:
        """Calculate Annual Expected Loss (ALE)."""
        loss = max(0.0, float(expected_single_loss))

        if custom_annual_prob is not None:
            prob = max(0.0, min(1.0, float(custom_annual_prob)))
            freq = custom_annual_freq if custom_annual_freq is not None else prob
            band = "CUSTOM"
            explanation = f"Using administrator specified annual probability of {prob * 100:.1f}%."
        elif risk_assessment and risk_assessment.final_risk_score is not None:
            prob, band, explanation = cls.map_risk_score_to_probability(risk_assessment.final_risk_score)
            freq = prob
        else:
            # Conservative default (10% annual probability)
            prob = 0.10
            freq = 0.10
            band = "DEFAULT"
            explanation = "Using default 10% annual incident probability assumption."

        ale = round(freq * loss, 2)

        return AnnualizedLossResult(
            annual_probability=prob,
            annual_frequency=freq,
            expected_single_loss=round(loss, 2),
            annual_expected_loss=ale,
            frequency_band=band,
            explanation=explanation,
        )
