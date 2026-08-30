"""Financial Impact Engine (Phase 6).

Decomposes potential cyber incidents into distinct probabilistic loss factors:
Downtime, Revenue Loss, Incident Response, Forensics, Recovery, Productivity Loss,
Data Breach Impact, Regulatory Penalties, Customer Compensation, Third-Party, Reputational.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.engines.downtime_engine import DowntimeEngine, DowntimeParameters
from app.engines.revenue_loss_engine import RevenueLossEngine, RevenueLossParameters
from app.models.asset import Asset
from app.models.business_service import BusinessService
from app.models.enums import AssetCriticality, DataClassification
from app.models.financial_profile import FinancialProfile
from app.models.risk_assessment import RiskAssessment
from app.models.vulnerability import Vulnerability


@dataclass
class FactorDefinition:
    """Specification of an individual loss component distribution."""
    factor_type: str
    distribution_type: str
    minimum: float
    most_likely: float
    maximum: float
    probability: float = 1.0  # Hurdle / occurrence probability
    metadata: Dict[str, Any] = field(default_factory=dict)
    assumptions: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class FinancialFactorSet:
    """Complete collection of probabilistic financial factors for an assessment."""
    factors: List[FactorDefinition]
    downtime: DowntimeParameters
    revenue_loss: RevenueLossParameters
    currency: str


class FinancialImpactEngine:
    """Generates parameterized cost component distributions for Monte Carlo simulation."""

    @classmethod
    def generate_factors(
        cls,
        financial_profile: FinancialProfile,
        asset: Asset,
        vulnerability: Optional[Vulnerability] = None,
        risk_assessment: Optional[RiskAssessment] = None,
        business_service: Optional[BusinessService] = None,
        overrides: Optional[Dict[str, Any]] = None,
    ) -> FinancialFactorSet:
        """Derive all probabilistic loss factors combining business, asset, and risk context."""
        ov = overrides or {}
        currency = financial_profile.currency or "INR"

        # 1. Downtime
        custom_dt = ov.get("downtime", {})
        downtime = DowntimeEngine.evaluate(
            asset=asset,
            custom_min=custom_dt.get("minimum"),
            custom_mode=custom_dt.get("most_likely"),
            custom_max=custom_dt.get("maximum"),
        )

        # 2. Revenue Loss
        revenue_loss = RevenueLossEngine.evaluate(
            financial_profile=financial_profile,
            asset=asset,
            downtime=downtime,
            business_service=business_service,
        )

        factor_list: List[FactorDefinition] = []

        # Factor: DOWNTIME
        factor_list.append(
            FactorDefinition(
                factor_type="DOWNTIME",
                distribution_type="TRIANGULAR",
                minimum=downtime.minimum_hours,
                most_likely=downtime.most_likely_hours,
                maximum=downtime.maximum_hours,
                probability=1.0,
                metadata={"unit": "hours", "explanation": downtime.explanation},
                assumptions=[
                    {
                        "parameter": "downtime_hours",
                        "value": str(downtime.most_likely_hours),
                        "unit": "hours",
                        "source": "downtime_engine",
                        "confidence": 0.85,
                        "user_provided": bool(custom_dt),
                    }
                ],
            )
        )

        # Factor: REVENUE_LOSS
        factor_list.append(
            FactorDefinition(
                factor_type="REVENUE_LOSS",
                distribution_type="TRIANGULAR",
                minimum=revenue_loss.minimum_loss,
                most_likely=revenue_loss.most_likely_loss,
                maximum=revenue_loss.maximum_loss,
                probability=1.0,
                metadata={"unit": currency, "explanation": revenue_loss.explanation},
                assumptions=[
                    {
                        "parameter": "revenue_dependency",
                        "value": str(revenue_loss.dependency_factor),
                        "unit": "ratio",
                        "source": "asset_or_service",
                        "confidence": 0.90,
                        "user_provided": True,
                    }
                ],
            )
        )

        # Factor: INCIDENT_RESPONSE
        resp_rate = float(financial_profile.incident_response_hourly_cost or 2500.0)
        min_resp_hrs, mode_resp_hrs, max_resp_hrs = (15.0, 40.0, 100.0)
        factor_list.append(
            FactorDefinition(
                factor_type="INCIDENT_RESPONSE",
                distribution_type="TRIANGULAR",
                minimum=round(min_resp_hrs * resp_rate, 2),
                most_likely=round(mode_resp_hrs * resp_rate, 2),
                maximum=round(max_resp_hrs * resp_rate, 2),
                probability=1.0,
                metadata={"unit": currency, "hourly_rate": resp_rate},
                assumptions=[
                    {
                        "parameter": "incident_response_hourly_cost",
                        "value": str(resp_rate),
                        "unit": f"{currency}/hour",
                        "source": "financial_profile",
                        "confidence": 0.95,
                        "user_provided": True,
                    }
                ],
            )
        )

        # Factor: FORENSICS
        min_for_hrs, mode_for_hrs, max_for_hrs = (10.0, 25.0, 60.0)
        factor_list.append(
            FactorDefinition(
                factor_type="FORENSICS",
                distribution_type="TRIANGULAR",
                minimum=round(min_for_hrs * resp_rate, 2),
                most_likely=round(mode_for_hrs * resp_rate, 2),
                maximum=round(max_for_hrs * resp_rate, 2),
                probability=1.0,
                metadata={"unit": currency, "hourly_rate": resp_rate},
            )
        )

        # Factor: RECOVERY
        rec_rate = float(financial_profile.backup_recovery_hourly_cost or 1800.0)
        # Scale recovery by asset criticality
        crit_scale = {
            AssetCriticality.LOW: 1.0,
            AssetCriticality.MEDIUM: 2.0,
            AssetCriticality.HIGH: 4.0,
            AssetCriticality.CRITICAL: 8.0,
        }.get(asset.criticality, 2.0)
        min_rec = round(20.0 * rec_rate * crit_scale, 2)
        mode_rec = round(50.0 * rec_rate * crit_scale, 2)
        max_rec = round(120.0 * rec_rate * crit_scale, 2)
        factor_list.append(
            FactorDefinition(
                factor_type="RECOVERY",
                distribution_type="TRIANGULAR",
                minimum=min_rec,
                most_likely=mode_rec,
                maximum=max_rec,
                probability=1.0,
                metadata={"unit": currency, "hourly_rate": rec_rate},
            )
        )

        # Factor: EMPLOYEE_PRODUCTIVITY
        emp_count = int(financial_profile.employee_count or 100)
        emp_rate = float(financial_profile.average_hourly_employee_cost or 350.0)
        affected_pct = 0.20 if asset.criticality == AssetCriticality.CRITICAL else 0.05
        affected_emps = max(1, int(emp_count * affected_pct))
        min_prod = round(affected_emps * downtime.minimum_hours * emp_rate * 0.5, 2)
        mode_prod = round(affected_emps * downtime.most_likely_hours * emp_rate * 0.75, 2)
        max_prod = round(affected_emps * downtime.maximum_hours * emp_rate * 1.0, 2)
        factor_list.append(
            FactorDefinition(
                factor_type="EMPLOYEE_PRODUCTIVITY",
                distribution_type="TRIANGULAR",
                minimum=min_prod,
                most_likely=mode_prod,
                maximum=max_prod,
                probability=1.0,
                metadata={"affected_employees": affected_emps},
            )
        )

        # Factor: DATA_BREACH (Probabilistic hurdle)
        data_class = asset.data_classification or DataClassification.INTERNAL
        breach_prob = 0.0
        if data_class == DataClassification.RESTRICTED:
            breach_prob = 0.65
        elif data_class == DataClassification.CONFIDENTIAL:
            breach_prob = 0.40
        elif data_class == DataClassification.INTERNAL:
            breach_prob = 0.15

        # Incorporate Phase 5 risk score into breach likelihood
        if risk_assessment and risk_assessment.final_risk_score:
            breach_prob = min(1.0, breach_prob * (risk_assessment.final_risk_score / 60.0))

        cost_per_record = float(financial_profile.cost_per_record or 250.0)
        records_exposed = max(100, int(financial_profile.customer_count or 1000) * 2)
        min_breach = round(records_exposed * cost_per_record * 0.5, 2)
        mode_breach = round(records_exposed * cost_per_record * 1.0, 2)
        max_breach = round(records_exposed * cost_per_record * 2.5, 2)
        factor_list.append(
            FactorDefinition(
                factor_type="DATA_BREACH",
                distribution_type="TRIANGULAR",
                minimum=min_breach,
                most_likely=mode_breach,
                maximum=max_breach,
                probability=round(breach_prob, 2),
                metadata={
                    "data_classification": data_class.value,
                    "records_exposed": records_exposed,
                    "cost_per_record": cost_per_record,
                },
                assumptions=[
                    {
                        "parameter": "data_exposure_probability",
                        "value": f"{breach_prob * 100:.1f}%",
                        "unit": "probability",
                        "source": "data_classification_and_risk",
                        "confidence": 0.80,
                        "user_provided": False,
                    }
                ],
            )
        )

        # Factor: REGULATORY
        reg_prob = round(breach_prob * 0.5, 2)
        reg_min = 0.0
        reg_mode = round(mode_breach * 0.25, 2)
        reg_max = round(mode_breach * 0.75, 2)
        factor_list.append(
            FactorDefinition(
                factor_type="REGULATORY",
                distribution_type="TRIANGULAR",
                minimum=reg_min,
                most_likely=reg_mode,
                maximum=reg_max,
                probability=reg_prob,
                metadata={"unit": currency},
            )
        )

        # Factor: CUSTOMER_COMPENSATION
        cust_prob = round(breach_prob * 0.6, 2)
        comp_per_cust = float(financial_profile.average_customer_value or 5000.0) * 0.05
        cust_min = 0.0
        cust_mode = round(int(records_exposed * 0.2) * comp_per_cust, 2)
        cust_max = round(int(records_exposed * 0.5) * comp_per_cust, 2)
        factor_list.append(
            FactorDefinition(
                factor_type="CUSTOMER_COMPENSATION",
                distribution_type="TRIANGULAR",
                minimum=cust_min,
                most_likely=cust_mode,
                maximum=cust_max,
                probability=cust_prob,
                metadata={"unit": currency},
            )
        )

        # Factor: THIRD_PARTY
        tp_min = round(min_rec * 0.2, 2)
        tp_mode = round(mode_rec * 0.35, 2)
        tp_max = round(max_rec * 0.5, 2)
        factor_list.append(
            FactorDefinition(
                factor_type="THIRD_PARTY",
                distribution_type="TRIANGULAR",
                minimum=tp_min,
                most_likely=tp_mode,
                maximum=tp_max,
                probability=0.75,
                metadata={"unit": currency},
            )
        )

        # Factor: REPUTATIONAL
        rep_min = 0.0
        rep_mode = round(revenue_loss.most_likely_loss * 0.20, 2)
        rep_max = round(revenue_loss.maximum_loss * 0.50, 2)
        factor_list.append(
            FactorDefinition(
                factor_type="REPUTATIONAL",
                distribution_type="TRIANGULAR",
                minimum=rep_min,
                most_likely=rep_mode,
                maximum=rep_max,
                probability=0.50,
                metadata={"unit": currency, "label": "Assumption"},
            )
        )

        return FinancialFactorSet(
            factors=factor_list,
            downtime=downtime,
            revenue_loss=revenue_loss,
            currency=currency,
        )
