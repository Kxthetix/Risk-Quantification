"""Detection Rules API endpoints (Phase 9)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.detection_rules import (
    DetectionRuleCreate,
    DetectionRuleDetailResponse,
    DetectionRuleItem,
    DetectionRuleTestRequest,
    DetectionRuleTestResponse,
    DetectionRuleUpdate,
)
from app.services.detection_rule_service import detection_rule_service

router = APIRouter(prefix="/detection-rules", tags=["Detection Rules"])


@router.get("/", response_model=List[DetectionRuleItem], summary="List Detection Rules")
async def list_detection_rules(
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    source: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DetectionRuleItem]:
    return await detection_rule_service.get_rules(
        db, current_user.organization_id, severity=severity, status=status_filter, source=source
    )


@router.get("/{rule_id}", response_model=DetectionRuleDetailResponse, summary="Get Detection Rule Detail & Logic")
async def get_detection_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DetectionRuleDetailResponse:
    return await detection_rule_service.get_rule_by_id(db, current_user.organization_id, rule_id)


@router.post("/test", response_model=DetectionRuleTestResponse, summary="Test Detection Rule against Sample Event")
async def test_detection_rule(
    payload: DetectionRuleTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DetectionRuleTestResponse:
    return await detection_rule_service.test_rule(db, current_user.organization_id, payload)
