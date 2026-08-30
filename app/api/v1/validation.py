"""Vulnerability Validation API Endpoints."""
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError
from app.models.enums import ValidationStatus
from app.models.user import User, UserRole
from app.schemas.validation import (
    ValidationBulkRequest,
    ValidationBulkResponse,
    ValidationDetailedResponse,
    ValidationResponse,
    ValidationRuleResponse,
    ValidationRuleUpdate,
    ValidationRunRequest,
    ValidationRunResponse,
    ValidationStatisticsResponse,
)
from app.services.validation_rule_service import validation_rule_service
from app.services.validation_service import validation_service
from app.workers.validation_worker import (
    dispatch_bulk_validation_task,
    dispatch_validation_task,
)

router = APIRouter(prefix="/validation", tags=["Validation Engine"])


def _require_analyst_or_admin(current_user: User) -> None:
    if not current_user.role.has_permission(UserRole.SECURITY_ANALYST):
        raise AuthorizationError(
            message="This action requires SECURITY_ANALYST role or above.",
            error_code="INSUFFICIENT_PERMISSIONS",
        )


@router.post(
    "/run",
    response_model=ValidationRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger Vulnerability Validation",
    description="Run multi-stage validation engine on an identified asset vulnerability.",
)
async def run_validation_endpoint(
    payload: ValidationRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationRunResponse:
    _require_analyst_or_admin(current_user)

    if payload.synchronous:
        val = await validation_service.run_validation(
            db=db,
            asset_vulnerability_id=payload.asset_vulnerability_id,
            current_user=current_user,
        )
        return ValidationRunResponse(
            validation_id=val.id,
            status=val.validation_status,
        )

    # For async evaluation, generate or find validation record, then dispatch worker
    # We execute synchronously or queue background worker task
    task = dispatch_validation_task(
        asset_vulnerability_id=payload.asset_vulnerability_id,
        user=current_user,
    )
    # Temporary placeholder UUID if record not committed yet
    temp_id = uuid.uuid4()
    return ValidationRunResponse(
        validation_id=temp_id,
        status=ValidationStatus.VALIDATING,
    )


@router.get(
    "/statistics",
    response_model=ValidationStatisticsResponse,
    summary="Validation Statistics",
    description="Retrieve aggregated validation status metrics and manual review counts.",
)
async def get_validation_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationStatisticsResponse:
    stats = await validation_service.get_statistics(db=db, current_user=current_user)
    return ValidationStatisticsResponse(**stats)


@router.get(
    "/review-queue",
    response_model=List[ValidationResponse],
    summary="Analyst Review Queue",
    description="Retrieve findings requiring human verification (low confidence, conflicting evidence, critical CVSS).",
)
async def get_review_queue_endpoint(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ValidationResponse]:
    _require_analyst_or_admin(current_user)
    items = await validation_service.get_review_queue(
        db=db, current_user=current_user, limit=limit, offset=offset
    )
    return [ValidationResponse.model_validate(item) for item in items]


@router.get(
    "/rules",
    response_model=List[ValidationRuleResponse],
    summary="List Validation Rules",
    description="Retrieve active validation scoring weights and rule definitions.",
)
async def list_validation_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ValidationRuleResponse]:
    rules = await validation_rule_service.get_effective_rules(
        db=db, organization_id=current_user.organization_id
    )
    return [ValidationRuleResponse.model_validate(r) for r in rules]


@router.put(
    "/rules/{rule_id}",
    response_model=ValidationRuleResponse,
    summary="Update Validation Rule",
    description="Configure score weight or active toggle for a validation rule.",
)
async def update_validation_rule(
    rule_id: str,
    payload: ValidationRuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationRuleResponse:
    _require_analyst_or_admin(current_user)
    rule = await validation_rule_service.update_rule(
        db=db,
        rule_id=rule_id,
        payload=payload,
        current_user=current_user,
    )
    return ValidationRuleResponse.model_validate(rule)


@router.get(
    "/{validation_id}",
    response_model=ValidationResponse,
    summary="Get Validation Details",
    description="Retrieve status, score, confidence, and explainability reasons for a validation record.",
)
async def get_validation(
    validation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationResponse:
    val = await validation_service.get_validation_by_id(
        db=db,
        validation_id=validation_id,
        current_user=current_user,
    )
    return ValidationResponse.model_validate(val)


@router.get(
    "/{validation_id}/detailed",
    response_model=ValidationDetailedResponse,
    summary="Get Full Explainability Document",
    description="Structured explainability document showing asset, software, vulnerability, validation score, and all evidence.",
)
async def get_detailed_validation_endpoint(
    validation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationDetailedResponse:
    data = await validation_service.get_detailed_validation(
        db=db,
        validation_id=validation_id,
        current_user=current_user,
    )
    return ValidationDetailedResponse(**data)


@router.post(
    "/{validation_id}/rerun",
    response_model=ValidationResponse,
    summary="Rerun Validation",
    description="Re-execute multi-stage validation with latest collected evidence.",
)
async def rerun_validation_endpoint(
    validation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationResponse:
    _require_analyst_or_admin(current_user)
    val = await validation_service.rerun_validation(
        db=db,
        validation_id=validation_id,
        current_user=current_user,
    )
    return ValidationResponse.model_validate(val)


@router.post(
    "/run-bulk",
    response_model=ValidationBulkResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger Bulk Validation",
    description="Execute bulk vulnerability validation across organization assets.",
)
async def run_bulk_validation_endpoint(
    payload: ValidationBulkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationBulkResponse:
    _require_analyst_or_admin(current_user)
    processed, job_id = await validation_service.run_bulk_validation(
        db=db,
        current_user=current_user,
        asset_ids=payload.asset_ids,
        organization_id=payload.organization_id,
    )
    return ValidationBulkResponse(
        queued_count=processed,
        job_id=job_id,
        status="COMPLETED",
    )
