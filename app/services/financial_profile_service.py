"""Financial Profile & Business Service operations service (Phase 6)."""
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.business_service import BusinessService
from app.models.enums import AuditAction
from app.models.financial_profile import FinancialProfile
from app.models.user import User
from app.schemas.financial import (
    BusinessServiceCreate,
    BusinessServiceUpdate,
    FinancialProfileCreate,
    FinancialProfileUpdate,
)
from app.services.audit_service import audit_service


class FinancialProfileService:
    """Manages organization financial assumptions and business services."""

    @staticmethod
    def _compute_derived(annual_rev: float, days: int, hours: int) -> dict:
        """Derive daily and hourly revenue figures."""
        safe_annual = max(0.0, float(annual_rev))
        safe_days = max(1, int(days))
        safe_hours = max(1, int(hours))

        daily = safe_annual / safe_days
        hourly = daily / safe_hours
        profit_hourly = hourly * 0.15  # default 15% operating profit margin baseline

        return {
            "daily_revenue": round(daily, 2),
            "hourly_revenue": round(hourly, 2),
            "average_hourly_revenue": round(hourly, 2),
            "average_hourly_profit": round(profit_hourly, 2),
        }

    async def get_or_create_profile(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> FinancialProfile:
        """Retrieve existing organization financial profile or initialize with defaults."""
        stmt = select(FinancialProfile).where(FinancialProfile.organization_id == organization_id)
        result = await db.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            derived = self._compute_derived(100000000.0, 250, 8)
            profile = FinancialProfile(
                organization_id=organization_id,
                currency="INR",
                annual_revenue=100000000.0,
                operating_days_per_year=250,
                hours_per_day=8,
                employee_count=100,
                average_hourly_employee_cost=350.0,
                incident_response_hourly_cost=2500.0,
                security_team_size=5,
                backup_recovery_hourly_cost=1800.0,
                customer_count=1000,
                average_customer_value=5000.0,
                cost_per_record=250.0,
                **derived,
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)

        return profile

    async def update_profile(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        payload: FinancialProfileUpdate,
        current_user: User,
    ) -> FinancialProfile:
        """Update organization financial profile and recalculate derived metrics."""
        profile = await self.get_or_create_profile(db=db, organization_id=organization_id)

        update_data = payload.model_dump(exclude_unset=True)
        for field_name, val in update_data.items():
            setattr(profile, field_name, val)

        # Re-derive daily & hourly revenues
        derived = self._compute_derived(
            annual_rev=profile.annual_revenue,
            days=profile.operating_days_per_year,
            hours=profile.hours_per_day,
        )
        for k, v in derived.items():
            setattr(profile, k, v)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.FINANCIAL_PROFILE_UPDATED,
            resource_type="financial_profile",
            resource_id=str(profile.id),
            metadata={"updated_fields": list(update_data.keys())},
        )
        await db.commit()
        await db.refresh(profile)
        return profile

    # ------------------------------------------------------------------
    # Business Services Management
    # ------------------------------------------------------------------
    async def create_business_service(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        payload: BusinessServiceCreate,
        current_user: User,
    ) -> BusinessService:
        """Create a new critical business service mapping."""
        service = BusinessService(
            organization_id=organization_id,
            name=payload.name,
            description=payload.description,
            revenue_dependency=payload.revenue_dependency,
            criticality=payload.criticality,
            daily_transaction_count=payload.daily_transaction_count or 0,
            average_transaction_value=payload.average_transaction_value or 0.0,
        )
        db.add(service)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.BUSINESS_SERVICE_CREATED,
            resource_type="business_service",
            resource_id=str(service.id),
            metadata={"name": service.name, "revenue_dependency": service.revenue_dependency},
        )
        await db.commit()
        await db.refresh(service)
        return service

    async def get_business_services(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> List[BusinessService]:
        """List all business services belonging to the organization."""
        stmt = (
            select(BusinessService)
            .where(BusinessService.organization_id == organization_id)
            .order_by(BusinessService.name)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_business_service(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        service_id: uuid.UUID,
    ) -> BusinessService:
        """Retrieve a specific business service ensuring tenant isolation."""
        stmt = select(BusinessService).where(
            BusinessService.id == service_id,
            BusinessService.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        service = result.scalar_one_or_none()
        if not service:
            raise NotFoundError(
                message=f"Business service {service_id} not found.",
                error_code="BUSINESS_SERVICE_NOT_FOUND",
            )
        return service

    async def update_business_service(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        service_id: uuid.UUID,
        payload: BusinessServiceUpdate,
        current_user: User,
    ) -> BusinessService:
        """Update an existing business service."""
        service = await self.get_business_service(db, organization_id, service_id)
        update_data = payload.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(service, k, v)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.BUSINESS_SERVICE_UPDATED,
            resource_type="business_service",
            resource_id=str(service.id),
            metadata={"updated_fields": list(update_data.keys())},
        )
        await db.commit()
        await db.refresh(service)
        return service


financial_profile_service = FinancialProfileService()
