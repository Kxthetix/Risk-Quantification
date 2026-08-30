"""Authoritative Service for SOC Dashboard, Triage, Investigation, Metrics, Graphs & Tasks (Phase 10)."""
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import uuid

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
    IncidentRelationshipNode,
    IncidentRelationshipEdge,
    SOCTrendResponse,
    SOCTrendDataPoint,
    SOCHitMapResponse,
    SOCHitMapItem,
    SOCTaskItem,
    SOCTaskCreate,
    SOCTaskUpdate,
)


class SOCService:
    """Manages SOC Operational telemetry, triage decisions, metrics and investigation graphs."""

    _tasks: Dict[str, Dict[str, Any]] = {}
    _notes: Dict[str, List[Dict[str, Any]]] = {}
    _reviews: Dict[str, Dict[str, Any]] = {}
    _communications: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def get_dashboard(cls, organization_id: str) -> SOCDashboardResponse:
        now = datetime.now(timezone.utc)
        return SOCDashboardResponse(
            critical_alerts=14,
            open_incidents=6,
            incidents_investigating=4,
            assets_under_attack=9,
            active_playbooks=8,
            pending_approvals=3,
            failed_actions=0,
            financial_exposure=5400000.0,
            recent_timeline=[
                {
                    "timestamp": (now - timedelta(minutes=4)).isoformat(),
                    "actor": "Auto-SOAR Engine",
                    "action": "ISOLATE_ASSET",
                    "source": "CrowdStrike EDR",
                    "description": "Quarantined host DB-PROD-01 interface after detecting unauthenticated lateral movement.",
                },
                {
                    "timestamp": (now - timedelta(minutes=18)).isoformat(),
                    "actor": "SOC Tier 2 Lead",
                    "action": "TRIAGE_CONFIRMED",
                    "source": "Incident Triage",
                    "description": "Confirmed incident INC-2026-089 (Cobalt Strike C2 Beaconing) as valid active threat.",
                },
                {
                    "timestamp": (now - timedelta(minutes=35)).isoformat(),
                    "actor": "WAF Automation",
                    "action": "BLOCK_IP",
                    "source": "Cloudflare Edge",
                    "description": "Blacklisted adversary ingress IP 185.220.101.5 on edge gateway.",
                },
            ],
            active_incidents=[
                {
                    "id": "inc-001",
                    "incident_number": "INC-2026-089",
                    "title": "Cobalt Strike C2 Beaconing on Ingress Gateway",
                    "severity": "CRITICAL",
                    "status": "INVESTIGATING",
                    "owner": "Sarah Chen (SOC Lead)",
                    "business_service": "Digital Banking Core",
                    "financial_exposure": 2800000.0,
                    "created_at": (now - timedelta(hours=1, minutes=20)).isoformat(),
                },
                {
                    "id": "inc-002",
                    "incident_number": "INC-2026-088",
                    "title": "Credential Spray on Okta SSO IDP",
                    "severity": "HIGH",
                    "status": "CONTAINED",
                    "owner": "Marcus Vance",
                    "business_service": "Corporate Identity & SSO",
                    "financial_exposure": 1200000.0,
                    "created_at": (now - timedelta(hours=3, minutes=10)).isoformat(),
                },
            ],
            assets_under_response=[
                {
                    "asset_id": "ast-gw-01",
                    "name": "Payments-DMZ-Gateway-01",
                    "ip": "10.0.1.15",
                    "criticality": "CRITICAL",
                    "status": "ISOLATED",
                    "action_in_progress": "Memory Forensics & Snapshot",
                },
                {
                    "asset_id": "ast-db-04",
                    "name": "Core-Postgres-Cluster-Master",
                    "ip": "10.0.4.22",
                    "criticality": "CRITICAL",
                    "status": "MONITORING_REINFORCED",
                    "action_in_progress": "Session Revocation",
                },
            ],
            response_activity=[
                {
                    "action": "Isolate Endpoint",
                    "target": "Payments-DMZ-Gateway-01",
                    "status": "SUCCESS",
                    "executed_at": (now - timedelta(minutes=12)).isoformat(),
                },
                {
                    "action": "Block Ingress IP",
                    "target": "185.220.101.5",
                    "status": "SUCCESS",
                    "executed_at": (now - timedelta(minutes=30)).isoformat(),
                },
                {
                    "action": "Revoke User OAuth Tokens",
                    "target": "svc-billing-daemon",
                    "status": "SUCCESS",
                    "executed_at": (now - timedelta(minutes=45)).isoformat(),
                },
            ],
        )

    @classmethod
    def get_metrics(cls, organization_id: str) -> SOCMetricsResponse:
        return SOCMetricsResponse(
            mttd_minutes=4.2,
            mtta_minutes=6.8,
            mttc_minutes=18.5,
            mttr_minutes=42.0,
            incident_volume_30d=142,
            critical_incident_rate_pct=11.4,
            false_positive_rate_pct=3.2,
            playbook_success_rate_pct=98.6,
            automation_rate_pct=84.2,
            sla_compliance_pct=96.5,
            auto_contained_count=118,
            manually_contained_count=24,
            failed_actions_count=0,
        )

    @classmethod
    def triage_incident(
        cls,
        organization_id: str,
        incident_id: str,
        request: IncidentTriageRequest,
        analyst_name: str = "SOC Analyst",
    ) -> IncidentTriageResponse:
        now = datetime.now(timezone.utc)
        audit_id = f"aud-{uuid.uuid4().hex[:8]}"

        new_status = "INVESTIGATING" if request.decision in ("CONFIRMED", "ESCALATED") else (
            "FALSE_POSITIVE" if request.decision == "FALSE_POSITIVE" else "TRIAGED"
        )

        return IncidentTriageResponse(
            incident_id=incident_id,
            decision=request.decision,
            status=new_status,
            severity=request.severity or "HIGH",
            analyst=analyst_name,
            timestamp=now,
            audit_id=audit_id,
            next_step="Execute Ransomware & Ingress Isolation Playbook" if request.decision == "CONFIRMED" else "Archive Alert & Update Suppression Filter",
        )

    @classmethod
    def assign_incident(
        cls,
        organization_id: str,
        incident_id: str,
        request: IncidentAssignmentRequest,
    ) -> Dict[str, Any]:
        return {
            "incident_id": incident_id,
            "assigned_to": request.assigned_to,
            "assigned_team": request.assigned_team or "SOC Tier 2 Escalations",
            "role": request.role,
            "assigned_at": datetime.now(timezone.utc).isoformat(),
            "status": "ASSIGNED",
        }

    @classmethod
    def add_note(
        cls,
        organization_id: str,
        incident_id: str,
        request: IncidentNoteCreate,
        author: str = "Lead Investigator",
    ) -> IncidentNoteItem:
        now = datetime.now(timezone.utc)
        note_id = f"note-{uuid.uuid4().hex[:8]}"
        item = IncidentNoteItem(
            id=note_id,
            note_type=request.note_type,
            content=request.content,
            author=author,
            created_at=now,
        )
        if incident_id not in cls._notes:
            cls._notes[incident_id] = []
        cls._notes[incident_id].insert(0, item.model_dump())
        return item

    @classmethod
    def get_notes(cls, organization_id: str, incident_id: str) -> List[Dict[str, Any]]:
        default_notes = [
            {
                "id": "note-01",
                "note_type": "FINDING",
                "content": "PowerShell process execution spawned abnormal named pipe `\\\\.\\pipe\\msagent_52` indicating standard Cobalt Strike default profile.",
                "author": "Marcus Vance (Forensics)",
                "created_at": (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat(),
            },
            {
                "id": "note-02",
                "note_type": "HYPOTHESIS",
                "content": "Initial ingress vulnerability CVE-2024-3400 was leveraged via unauthenticated SSL VPN gateway probe.",
                "author": "Sarah Chen (SOC Commander)",
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            },
        ]
        return cls._notes.get(incident_id, default_notes)

    @classmethod
    def create_review(
        cls,
        organization_id: str,
        incident_id: str,
        request: IncidentReviewCreate,
    ) -> Dict[str, Any]:
        review_data = {
            "incident_id": incident_id,
            "root_cause_category": request.root_cause_category,
            "root_cause_description": request.root_cause_description,
            "contributing_factors": request.contributing_factors,
            "affected_controls": request.affected_controls,
            "detection_gaps": request.detection_gaps or "Edge WAF inspection bypass via chunked encoding.",
            "response_gaps": request.response_gaps or "Manual approval delay for isolated DMZ node.",
            "lessons_learned": request.lessons_learned,
            "corrective_actions": request.corrective_actions,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "status": "COMPLETED",
        }
        cls._reviews[incident_id] = review_data
        return review_data

    @classmethod
    def get_review(cls, organization_id: str, incident_id: str) -> Dict[str, Any]:
        if incident_id in cls._reviews:
            return cls._reviews[incident_id]
        return {
            "incident_id": incident_id,
            "root_cause_category": "Vulnerability",
            "root_cause_description": "Unauthenticated RCE vulnerability on legacy ingress appliance.",
            "contributing_factors": ["Delayed patch window", "Publicly exposed management interface"],
            "affected_controls": ["NIST CSF PR.IP-1", "CIS Control 7.1"],
            "detection_gaps": "Initial probe evaded signature due to polymorphic payload.",
            "response_gaps": "Asset containment took 18 minutes due to approval gating.",
            "lessons_learned": "Automate instant isolation for perimeter hosts with CVSS 9.8 detections.",
            "corrective_actions": [
                "Decommission legacy gateway interface",
                "Enforce strict egress zero-trust filtering",
            ],
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "status": "COMPLETED",
        }

    @classmethod
    def send_communication(
        cls,
        organization_id: str,
        incident_id: str,
        request: IncidentCommunicationCreate,
    ) -> Dict[str, Any]:
        comm_item = {
            "id": f"comm-{uuid.uuid4().hex[:8]}",
            "communication_type": request.communication_type,
            "subject": request.subject,
            "message": request.message,
            "recipients": request.recipients or ["exec-security-briefings@enterprise.internal"],
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
            "delivery_status": "DELIVERED",
        }
        if incident_id not in cls._communications:
            cls._communications[incident_id] = []
        cls._communications[incident_id].append(comm_item)
        return comm_item

    @classmethod
    def get_relationship_graph(cls, organization_id: str, incident_id: str) -> IncidentRelationshipGraphResponse:
        nodes = [
            IncidentRelationshipNode(
                id="actor-apt29",
                label="APT29 (Cozy Bear)",
                node_type="threat_actor",
                severity="CRITICAL",
                metadata={"origin": "State-Sponsored", "confidence": "HIGH"},
            ),
            IncidentRelationshipNode(
                id="ioc-ip-185",
                label="185.220.101.5",
                node_type="ioc",
                severity="HIGH",
                metadata={"type": "IPv4", "reputation": "Malicious C2"},
            ),
            IncidentRelationshipNode(
                id="evt-cmd-01",
                label="Process Exec: powershell.exe",
                node_type="event",
                severity="HIGH",
                metadata={"source": "CrowdStrike EDR"},
            ),
            IncidentRelationshipNode(
                id="alt-rce-01",
                label="Alert: Ingress Gateway RCE",
                node_type="alert",
                severity="CRITICAL",
                metadata={"rule": "SIGMA-RCE-991"},
            ),
            IncidentRelationshipNode(
                id="inc-current",
                label=f"Incident {incident_id}",
                node_type="incident",
                severity="CRITICAL",
                metadata={"status": "INVESTIGATING"},
            ),
            IncidentRelationshipNode(
                id="ast-dmz-01",
                label="Payments-DMZ-Gateway",
                node_type="asset",
                severity="CRITICAL",
                metadata={"ip": "10.0.1.15", "criticality": "CRITICAL"},
            ),
            IncidentRelationshipNode(
                id="path-dmz-db",
                label="Attack Path: Perimeter -> Core DB",
                node_type="attack_path",
                severity="CRITICAL",
                metadata={"hops": 3, "chokepoint": "Internal Firewall"},
            ),
            IncidentRelationshipNode(
                id="srv-banking",
                label="Digital Banking Core",
                node_type="business_service",
                severity="CRITICAL",
                metadata={"revenue_impact": "$125,000/hr"},
            ),
            IncidentRelationshipNode(
                id="fin-loss",
                label="$2.8M Financial Loss Exposure",
                node_type="financial_impact",
                severity="CRITICAL",
                metadata={"currency": "USD", "tier": "CRITICAL_EXPOSURE"},
            ),
        ]

        edges = [
            IncidentRelationshipEdge(id="e1", source="actor-apt29", target="ioc-ip-185", label="operates"),
            IncidentRelationshipEdge(id="e2", source="ioc-ip-185", target="evt-cmd-01", label="generates"),
            IncidentRelationshipEdge(id="e3", source="evt-cmd-01", target="alt-rce-01", label="triggers"),
            IncidentRelationshipEdge(id="e4", source="alt-rce-01", target="inc-current", label="escalated_to"),
            IncidentRelationshipEdge(id="e5", source="inc-current", target="ast-dmz-01", label="compromises"),
            IncidentRelationshipEdge(id="e6", source="ast-dmz-01", target="path-dmz-db", label="traverses"),
            IncidentRelationshipEdge(id="e7", source="path-dmz-db", target="srv-banking", label="threatens"),
            IncidentRelationshipEdge(id="e8", source="srv-banking", target="fin-loss", label="exposes"),
        ]

        return IncidentRelationshipGraphResponse(incident_id=incident_id, nodes=nodes, edges=edges)

    @classmethod
    def get_trends(cls, organization_id: str, period: str = "30d") -> SOCTrendResponse:
        data_points = []
        now = datetime.now(timezone.utc)
        days = 30 if period == "30d" else (7 if period == "7d" else 90)

        for i in range(days, -1, -5):
            date_str = (now - timedelta(days=i)).strftime("%b %d")
            data_points.append(
                SOCTrendDataPoint(
                    date=date_str,
                    incident_count=max(2, 14 - (i // 5)),
                    critical_count=max(0, 4 - (i // 10)),
                    resolved_count=max(1, 10 - (i // 6)),
                    avg_resolution_time_min=round(48.0 - (i * 0.2), 1),
                    potential_loss=round(6200000.0 - (i * 45000), 2),
                    actual_loss=round(380000.0 - (i * 2000), 2),
                    risk_reduced=round(5820000.0 - (i * 43000), 2),
                )
            )

        return SOCTrendResponse(period=period, trends=data_points)

    @classmethod
    def get_risk_map(cls, organization_id: str) -> SOCHitMapResponse:
        return SOCHitMapResponse(
            items=[
                SOCHitMapItem(
                    asset_criticality="CRITICAL",
                    incident_severity="CRITICAL",
                    business_impact="SEVERE",
                    incident_count=3,
                    financial_exposure=3800000.0,
                    risk_score=92.5,
                ),
                SOCHitMapItem(
                    asset_criticality="CRITICAL",
                    incident_severity="HIGH",
                    business_impact="MODERATE",
                    incident_count=4,
                    financial_exposure=1200000.0,
                    risk_score=78.0,
                ),
                SOCHitMapItem(
                    asset_criticality="HIGH",
                    incident_severity="HIGH",
                    business_impact="MODERATE",
                    incident_count=6,
                    financial_exposure=750000.0,
                    risk_score=68.5,
                ),
                SOCHitMapItem(
                    asset_criticality="MEDIUM",
                    incident_severity="MEDIUM",
                    business_impact="LOW",
                    incident_count=9,
                    financial_exposure=180000.0,
                    risk_score=42.0,
                ),
            ]
        )

    @classmethod
    def get_tasks(cls, organization_id: str) -> List[SOCTaskItem]:
        now = datetime.now(timezone.utc)
        if not cls._tasks:
            cls._tasks = {
                "task-01": {
                    "id": "task-01",
                    "incident_id": "inc-001",
                    "incident_number": "INC-2026-089",
                    "task": "Perform Volatility memory dump on Payments DMZ Gateway",
                    "owner": "Marcus Vance",
                    "priority": "CRITICAL",
                    "status": "IN_PROGRESS",
                    "due_date": now + timedelta(hours=2),
                    "created_at": now - timedelta(hours=1),
                    "sla_status": "ON_TRACK",
                },
                "task-02": {
                    "id": "task-02",
                    "incident_id": "inc-001",
                    "incident_number": "INC-2026-089",
                    "task": "Rotate compromised API keys and TLS client certificates",
                    "owner": "Sarah Chen",
                    "priority": "HIGH",
                    "status": "OPEN",
                    "due_date": now + timedelta(hours=4),
                    "created_at": now - timedelta(minutes=40),
                    "sla_status": "ON_TRACK",
                },
                "task-03": {
                    "id": "task-03",
                    "incident_id": "inc-002",
                    "incident_number": "INC-2026-088",
                    "task": "Verify Okta user session termination across all active sessions",
                    "owner": "Identity Response Team",
                    "priority": "HIGH",
                    "status": "COMPLETED",
                    "due_date": now - timedelta(hours=1),
                    "created_at": now - timedelta(hours=3),
                    "sla_status": "ON_TRACK",
                },
            }
        return [SOCTaskItem(**t) for t in cls._tasks.values()]

    @classmethod
    def create_task(cls, organization_id: str, request: SOCTaskCreate) -> SOCTaskItem:
        now = datetime.now(timezone.utc)
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        task_data = {
            "id": task_id,
            "incident_id": request.incident_id,
            "incident_number": "INC-2026-089",
            "task": request.task,
            "owner": request.owner,
            "priority": request.priority,
            "status": "OPEN",
            "due_date": request.due_date or (now + timedelta(hours=4)),
            "created_at": now,
            "sla_status": "ON_TRACK",
        }
        cls._tasks[task_id] = task_data
        return SOCTaskItem(**task_data)

    @classmethod
    def update_task(cls, organization_id: str, task_id: str, request: SOCTaskUpdate) -> SOCTaskItem:
        if task_id not in cls._tasks:
            cls.get_tasks(organization_id)
        task = cls._tasks.get(task_id)
        if not task:
            raise KeyError(f"Task {task_id} not found")

        if request.status:
            task["status"] = request.status
        if request.owner:
            task["owner"] = request.owner
        if request.priority:
            task["priority"] = request.priority

        cls._tasks[task_id] = task
        return SOCTaskItem(**task)
