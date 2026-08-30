"""Revenue Loss calculation engine (Phase 6).

Calculates direct business revenue loss:
Revenue Loss = Hourly Revenue * Downtime Hours * Revenue Dependency Factor
"""
from dataclasses import dataclass

from app.engines.downtime_engine import DowntimeParameters
from app.models.asset import Asset
from app.models.business_service import BusinessService
from app.models.financial_profile import FinancialProfile


@dataclass
class RevenueLossParameters:
    """Estimated direct revenue loss distribution bounds."""
    hourly_revenue: float
    dependency_factor: float
    minimum_loss: float
    most_likely_loss: float
    maximum_loss: float
    explanation: str


class RevenueLossEngine:
    """Computes revenue interruption loss distributions."""

    @classmethod
    def evaluate(
        cls,
        financial_profile: FinancialProfile,
        asset: Asset,
        downtime: DowntimeParameters,
        business_service: BusinessService = None,
    ) -> RevenueLossParameters:
        """Derive revenue interruption loss parameters."""
        hourly_rev = float(financial_profile.hourly_revenue or 0.0)
        if hourly_rev <= 0.0:
            # derive from annual if needed
            annual = float(financial_profile.annual_revenue or 0.0)
            days = max(1, financial_profile.operating_days_per_year or 250)
            hours = max(1, financial_profile.hours_per_day or 8)
            hourly_rev = annual / (days * hours)

        # Revenue dependency factor: check business service first, then asset, default to 1.0
        dep_factor = float(asset.financial_dependency_factor or 1.0)
        if business_service and business_service.revenue_dependency is not None:
            dep_factor = float(business_service.revenue_dependency)
        dep_factor = max(0.0, min(1.0, dep_factor))

        min_loss = round(hourly_rev * downtime.minimum_hours * dep_factor, 2)
        mode_loss = round(hourly_rev * downtime.most_likely_hours * dep_factor, 2)
        max_loss = round(hourly_rev * downtime.maximum_hours * dep_factor, 2)

        return RevenueLossParameters(
            hourly_revenue=hourly_rev,
            dependency_factor=dep_factor,
            minimum_loss=min_loss,
            most_likely_loss=mode_loss,
            maximum_loss=max_loss,
            explanation=(
                f"Revenue loss derived from {financial_profile.currency} {hourly_rev:,.2f}/hr revenue, "
                f"{dep_factor * 100:.0f}% business dependency, and {downtime.most_likely_hours}h estimated downtime."
            ),
        )
