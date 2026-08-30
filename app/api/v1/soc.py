"""FastAPI Router for SOC Dashboard, Metrics, Triage, Investigation & Tasks (Phase 10)."""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.soc import (
    SOCDashboardResponse,
    SOCMetricsResponse,
    IncidentTriageRequest,
    IncidentTriageResponse,
    IncidentAssignmentRequest,
    IncidentNoteCreate,
    IncidentNoteItem,
    IncidentReviewCreate,
    IncidentCommunicationCreate,
    IncidentRelationshipGraphResponse,
    SOCTrendResponse,
    SOCHitMapResponse,
    SOCTaskItem,
    SOCTaskCreate,
    SOCTaskUpdate,
)
from app.services.soc_service import SOCService

router = APIRouter(prefix="/soc", tags=["Security Operations Center (SOC)"])


@router.get("/dashboard", response_model=SOCDashboardResponse)
async def get_soc_dashboard(
    current_user: User = Depends(get_current_user),
) -> SOCDashboardResponse:
    """Retrieve high-level SOC executive dashboard KPIs and active operational state."""
    return SOCService.get_dashboard(str(current_user.organization_id))


@router.get("/metrics", response_model=SOCMetricsResponse)
async def get_soc_metrics(
    current_user: User = Depends(get_current_user),
) -> SOCMetricsResponse:
    """Retrieve MTTD, MTTA, MTTC, MTTR and automation effectiveness metrics."""
    return SOCService.get_metrics(str(current_user.organization_id))


@router.get("/trends", response_model=SOCTrendResponse)
async def get_soc_trends(
    period: str = Query("30d", description="7d, 30d, 90d"),
    current_user: User = Depends(get_current_user),
) -> SOCTrendResponse:
    """Retrieve historical trends for incidents and financial risk reduction."""
    return SOCService.get_trends(str(current_user.organization_id), period=period)


@router.get("/risk-map", response_model=SOCHitMapResponse)
async def get_soc_risk_map(
    current_user: User = Depends(get_current_user),
) -> SOCHitMapResponse:
    """Retrieve operational heatmap by Asset Criticality vs Incident Severity vs Business Impact."""
    return SOCService.get_risk_map(str(current_user.organization_id))


@router.post("/incidents/{incident_id}/triage", response_model=IncidentTriageResponse)
async def triage_incident(
    incident_id: str,
    payload: IncidentTriageRequest,
    current_user: User = Depends(get_current_user),
) -> IncidentTriageResponse:
    """Record analyst triage decision (CONFIRMED, FALSE_POSITIVE, ESCALATED, ASSIGNED)."""
    return SOCService.triage_incident(
        organization_id=str(current_user.organization_id),
        incident_id=incident_id,
        request=payload,
        analyst_name=current_user.name if hasattr(current_user, "name") else "SOC Analyst",
    )


@router.post("/incidents/{incident_id}/assign")
async def assign_incident(
    incident_id: str,
    payload: IncidentAssignmentRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Assign an incident to an analyst, team, or commander."""
    return SOCService.assign_incident(
        organization_id=str(current_user.organization_id),
        incident_id=incident_id,
        request=payload,
    )


@router.get("/incidents/{incident_id}/notes", response_model=List[Dict[str, Any]])
async def get_incident_notes(
    incident_id: str,
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Retrieve structured investigation notes for an incident."""
    return SOCService.get_notes(str(current_user.organization_id), incident_id)


@router.post("/incidents/{incident_id}/notes", response_model=IncidentNoteItem, status_code=status.HTTP_201_CREATED)
async def add_incident_note(
    incident_id: str,
    payload: IncidentNoteCreate,
    current_user: User = Depends(get_current_user),
) -> IncidentNoteItem:
    """Add a structured investigation note (Finding, Hypothesis, Observation, Recommendation)."""
    return SOCService.add_note(
        organization_id=str(current_user.organization_id),
        incident_id=incident_id,
        request=payload,
        author=current_user.name if hasattr(current_user, "name") else "SOC Investigator",
    )


@router.get("/incidents/{incident_id}/review", response_model=Dict[str, Any])
async def get_incident_review(
    incident_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve post-incident review (RCA), contributing factors, lessons learned."""
    return SOCService.get_review(str(current_user.organization_id), incident_id)


@router.post("/incidents/{incident_id}/review", response_model=Dict[str, Any])
async def create_incident_review(
    incident_id: str,
    payload: IncidentReviewCreate,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Submit post-incident review and root cause analysis."""
    return SOCService.create_review(
        organization_id=str(current_user.organization_id),
        incident_id=incident_id,
        request=payload,
    )


@router.post("/incidents/{incident_id}/communications", response_model=Dict[str, Any])
async def send_incident_communication(
    incident_id: str,
    payload: IncidentCommunicationCreate,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Dispatch internal/external stakeholder notification regarding incident status."""
    return SOCService.send_communication(
        organization_id=str(current_user.organization_id),
        incident_id=incident_id,
        request=payload,
    )


@router.get("/incidents/{incident_id}/relationship-graph", response_model=IncidentRelationshipGraphResponse)
async def get_incident_relationship_graph(
    incident_id: str,
    current_user: User = Depends(get_current_user),
) -> IncidentRelationshipGraphResponse:
    """Retrieve graph connecting Actor -> IOC -> Event -> Alert -> Incident -> Asset -> Path -> Service -> Impact."""
    return SOCService.get_relationship_graph(str(current_user.organization_id), incident_id)


@router.get("/tasks", response_model=List[SOCTaskItem])
async def get_soc_tasks(
    current_user: User = Depends(get_current_user),
) -> List[SOCTaskItem]:
    """Retrieve all SOC investigation and response tasks with SLA status."""
    return SOCService.get_tasks(str(current_user.organization_id))


@router.post("/tasks", response_model=SOCTaskItem, status_code=status.HTTP_201_CREATED)
async def create_soc_task(
    payload: SOCTaskCreate,
    current_user: User = Depends(get_current_user),
) -> SOCTaskItem:
    """Create a new SOC task assigned to a team or investigator."""
    return SOCService.create_task(str(current_user.organization_id), payload)


@router.put("/tasks/{task_id}", response_model=SOCTaskItem)
async def update_soc_task(
    task_id: str,
    payload: SOCTaskUpdate,
    current_user: User = Depends(get_current_user),
) -> SOCTaskItem:
    """Update SOC task status, owner, or priority."""
    try:
        return SOCService.update_task(str(current_user.organization_id), task_id, payload)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
