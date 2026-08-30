"""Incidents Management API endpoints (Phase 9)."""
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.incident import (
    IncidentCommentCreate,
    IncidentCreateRequest,
    IncidentDetailResponse,
    IncidentEvidenceCreate,
    IncidentItem,
    IncidentResponseActionExecute,
    IncidentSummaryResponse,
    IncidentTaskCreate,
    IncidentTaskUpdate,
    IncidentUpdateRequest,
)
from app.services.incident_service import incident_service

router = APIRouter(prefix="/incidents-management", tags=["Incidents Management"])


@router.get("/summary", response_model=IncidentSummaryResponse, summary="Get Incident Management KPIs")
async def get_incident_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncidentSummaryResponse:
    return await incident_service.get_summary(db, current_user.organization_id)


@router.get("/", response_model=List[IncidentItem], summary="List & Filter Incidents")
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[IncidentItem]:
    return await incident_service.get_incidents(
        db, current_user.organization_id, status=status_filter, severity=severity, owner=owner
    )


@router.post("/", response_model=IncidentItem, status_code=status.HTTP_201_CREATED, summary="Create New Incident")
async def create_incident(
    payload: IncidentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncidentItem:
    return await incident_service.create_incident(db, current_user.organization_id, payload)


@router.get("/{incident_id}", response_model=IncidentDetailResponse, summary="Get Incident Deep Inspection")
async def get_incident_detail(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncidentDetailResponse:
    return await incident_service.get_incident_by_id(db, current_user.organization_id, incident_id)


@router.put("/{incident_id}", response_model=IncidentDetailResponse, summary="Update Incident Status / Details")
async def update_incident(
    incident_id: str,
    payload: IncidentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncidentDetailResponse:
    return await incident_service.update_incident(db, current_user.organization_id, incident_id, payload)


@router.post("/{incident_id}/comments", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, summary="Add Comment to Incident")
async def add_incident_comment(
    incident_id: str,
    payload: IncidentCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return await incident_service.add_comment(db, current_user.organization_id, incident_id, payload, author=current_user.email)


@router.post("/{incident_id}/tasks", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, summary="Add Task to Incident")
async def add_incident_task(
    incident_id: str,
    payload: IncidentTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return await incident_service.add_task(db, current_user.organization_id, incident_id, payload)


@router.post("/{incident_id}/evidence", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, summary="Attach Evidence Artifact to Incident")
async def add_incident_evidence(
    incident_id: str,
    payload: IncidentEvidenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return await incident_service.add_evidence(db, current_user.organization_id, incident_id, payload, uploader=current_user.email)


@router.post("/{incident_id}/actions", response_model=Dict[str, Any], summary="Execute Containment Response Action")
async def execute_response_action(
    incident_id: str,
    payload: IncidentResponseActionExecute,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return await incident_service.execute_action(db, current_user.organization_id, incident_id, payload, executor=current_user.email)
