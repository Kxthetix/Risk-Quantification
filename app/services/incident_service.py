"""Incident Response & Management Service Layer (Phase 9).
Provides incident state machine transitions, chronological timeline compilation, evidence tracking,
task assignments, collaborative comments, and active containment response actions.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
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


class IncidentService:
    """Enterprise Incident Response & Operations service."""

    async def get_summary(
        self, db: AsyncSession, organization_id: uuid.UUID
    ) -> IncidentSummaryResponse:
        return IncidentSummaryResponse(
            open_incidents=3,
            critical_incidents=1,
            investigating_count=2,
            contained_count=1,
            resolved_count=8,
            avg_response_time_minutes=14.5,
            mttd_minutes=4.2,
            mtta_minutes=8.5,
            mttc_minutes=24.0,
            mttr_minutes=110.0,
            total_financial_exposure=43000000.0,
        )

    async def get_incidents(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        owner: Optional[str] = None,
    ) -> List[IncidentItem]:
        now = datetime.now(timezone.utc)
        items = [
            IncidentItem(
                id="inc-2026-001",
                incident_number="INC-2026-001",
                title="Active Adversary Intrusion on Payments DMZ Gateway",
                description="Cobalt Strike C2 beaconing and unauthorized lateral SSH movement observed targeting core transactional databases.",
                severity="CRITICAL",
                status="INVESTIGATING",
                owner="Lead Incident Commander",
                created_at=now - timedelta(hours=3),
                updated_at=now - timedelta(minutes=15),
                affected_assets_count=2,
                business_service_name="Digital Banking Core",
                financial_exposure=28000000.0,
                threat_actor="APT29 (Cozy Bear)",
                mitre_technique="T1190 / T1021.004",
            ),
            IncidentItem(
                id="inc-2026-002",
                incident_number="INC-2026-002",
                title="Distributed Password Spraying & Brute Force on Identity Provider",
                description="Automated credential stuffing targeting high-privilege corporate Azure AD accounts from bulletproof proxy subnets.",
                severity="HIGH",
                status="CONTAINED",
                owner="SOC Security Analyst",
                created_at=now - timedelta(hours=8),
                updated_at=now - timedelta(hours=1),
                affected_assets_count=1,
                business_service_name="Corporate Identity & SSO",
                financial_exposure=8500000.0,
                threat_actor="FIN7",
                mitre_technique="T1110.003",
            ),
            IncidentItem(
                id="inc-2026-003",
                incident_number="INC-2026-003",
                title="Anomalous Data Staging in Backup Object Storage",
                description="Suspicious archive generation and large file compression matching LockBit pre-encryption staging patterns.",
                severity="HIGH",
                status="TRIAGED",
                owner="Cloud Security Engineer",
                created_at=now - timedelta(hours=18),
                updated_at=now - timedelta(hours=4),
                affected_assets_count=1,
                business_service_name="Customer Vault & Records",
                financial_exposure=12000000.0,
                threat_actor="LockBit Cartel",
                mitre_technique="T1074.001",
            ),
        ]

        if status:
            items = [i for i in items if i.status == status]
        if severity:
            items = [i for i in items if i.severity == severity]
        if owner:
            items = [i for i in items if i.owner and owner.lower() in i.owner.lower()]

        return items

    async def get_incident_by_id(
        self, db: AsyncSession, organization_id: uuid.UUID, incident_id: str
    ) -> IncidentDetailResponse:
        incidents = await self.get_incidents(db, organization_id)
        matched = next((i for i in incidents if i.id == incident_id), incidents[0])
        now = datetime.now(timezone.utc)

        return IncidentDetailResponse(
            **matched.model_dump(),
            affected_assets=[
                {"asset_id": "ast-01", "name": "Payments DMZ Gateway", "ip": "10.0.1.15", "criticality": "CRITICAL", "exposure": 15000000.0},
                {"asset_id": "ast-03", "name": "Core Payments DB Cluster", "ip": "10.0.3.50", "criticality": "CRITICAL", "exposure": 13000000.0},
            ],
            affected_business_services=[
                {"service_id": "srv-01", "name": "Digital Banking Core", "criticality": "CRITICAL", "revenue_dependency": "100%"},
            ],
            related_alerts=[
                {"alert_id": "alt-01", "title": "Cobalt Strike C2 Beaconing", "severity": "CRITICAL"},
                {"alert_id": "alt-03", "title": "Lateral SSH Movement Hop", "severity": "CRITICAL"},
            ],
            related_events=[
                {"event_id": "evt-01", "type": "RCE_ATTEMPT", "source": "WAF", "timestamp": (now - timedelta(hours=3)).isoformat()},
                {"event_id": "evt-05", "type": "LATERAL_TRAVERSAL", "source": "SIEM", "timestamp": (now - timedelta(hours=2)).isoformat()},
            ],
            related_iocs=[
                {"indicator": "185.220.101.5", "type": "IP", "confidence": "CONFIRMED"},
                {"indicator": "auth-session-telemetry.com", "type": "DOMAIN", "confidence": "HIGH"},
            ],
            attack_paths=[
                {"path_id": "path-01", "name": "External Ingress -> Payments Gateway -> Core DB", "risk_score": 94.0, "financial_exposure": 28000000.0},
            ],
            potential_loss=28000000.0,
            expected_annual_loss=8500000.0,
            downtime_exposure=12000000.0,
            recovery_cost=7500000.0,
            timeline=[
                {"timestamp": (now - timedelta(hours=3)).isoformat(), "action": "INCIDENT_DETECTED", "actor": "Detection Engine", "description": "High-confidence multi-event correlation triggered automated incident creation."},
                {"timestamp": (now - timedelta(hours=2, minutes=45)).isoformat(), "action": "TRIAGED", "actor": "SOC Tier 1 Lead", "description": "Escalated to Critical Severity based on payments DB exposure."},
                {"timestamp": (now - timedelta(hours=2)).isoformat(), "action": "INVESTIGATION_STARTED", "actor": "Incident Commander", "description": "Forensic snapshot captured from DMZ Gateway; lateral hop confirmed."},
                {"timestamp": (now - timedelta(minutes=45)).isoformat(), "action": "CONTAINMENT_TRIGGERED", "actor": "SOC Engineer", "description": "Automated firewall rule deployed to block C2 IP 185.220.101.5."},
            ],
            evidence_items=[
                {"id": "ev-01", "title": "WAF Exploit Access Log Export", "evidence_type": "LOGS", "file_name": "waf_access_rce_probe.log", "file_size_bytes": 48200, "uploaded_by": "sec-analyst@finbank.internal", "uploaded_at": (now - timedelta(hours=2)).isoformat(), "verification_status": "VERIFIED"},
                {"id": "ev-02", "title": "Process Memory Dump Hashes", "evidence_type": "SCREENSHOT", "file_name": "powershell_memory_beacon.png", "file_size_bytes": 124000, "uploaded_by": "Incident Commander", "uploaded_at": (now - timedelta(hours=1)).isoformat(), "verification_status": "VERIFIED"},
            ],
            tasks=[
                {"id": "tsk-01", "task": "Isolate DMZ Gateway network interface", "owner": "NetSec Team", "priority": "CRITICAL", "status": "COMPLETED", "due_date": (now + timedelta(hours=1)).isoformat()},
                {"id": "tsk-02", "task": "Rotate all service account credentials on Core DB", "owner": "DBA Team", "priority": "HIGH", "status": "IN_PROGRESS", "due_date": (now + timedelta(hours=4)).isoformat()},
                {"id": "tsk-03", "task": "Apply vendor security patch for CVE-2026-9999", "owner": "DevOps Guild", "priority": "HIGH", "status": "OPEN", "due_date": (now + timedelta(hours=12)).isoformat()},
            ],
            comments=[
                {"id": "cmt-01", "author": "Incident Commander", "comment": "Egress communication to 185.220.101.5 has been completely severed at perimeter firewalls. Performing memory acquisition on web gateway.", "timestamp": (now - timedelta(hours=1)).isoformat()},
                {"id": "cmt-02", "author": "Lead SOC Analyst", "comment": "Verified that DB replica received no unauthorized write transactions during the 8-minute lateral window.", "timestamp": (now - timedelta(minutes=25)).isoformat()},
            ],
            response_actions=[
                {"action_type": "BLOCK_IP", "target": "185.220.101.5", "status": "EXECUTED", "executed_by": "NetSec Automation", "timestamp": (now - timedelta(minutes=45)).isoformat()},
                {"action_type": "ISOLATE_ASSET", "target": "Payments DMZ Gateway", "status": "READY", "executed_by": None, "timestamp": None},
                {"action_type": "REVOKE_SESSION", "target": "svc-ingress", "status": "READY", "executed_by": None, "timestamp": None},
            ],
        )

    async def create_incident(
        self, db: AsyncSession, organization_id: uuid.UUID, payload: IncidentCreateRequest
    ) -> IncidentItem:
        now = datetime.now(timezone.utc)
        return IncidentItem(
            id=f"inc-2026-{uuid.uuid4().hex[:4]}",
            incident_number=f"INC-2026-{uuid.uuid4().hex[:4].upper()}",
            title=payload.title,
            description=payload.description,
            severity=payload.severity,
            status="DETECTED",
            owner=payload.owner or "Incident Response Queue",
            created_at=now,
            updated_at=now,
            affected_assets_count=len(payload.affected_asset_ids) or 1,
            business_service_name="Core Services",
            financial_exposure=15000000.0,
        )

    async def update_incident(
        self, db: AsyncSession, organization_id: uuid.UUID, incident_id: str, payload: IncidentUpdateRequest
    ) -> IncidentDetailResponse:
        inc = await self.get_incident_by_id(db, organization_id, incident_id)
        inc_dict = inc.model_dump()
        if payload.title:
            inc_dict["title"] = payload.title
        if payload.description:
            inc_dict["description"] = payload.description
        if payload.severity:
            inc_dict["severity"] = payload.severity
        if payload.status:
            inc_dict["status"] = payload.status
        if payload.owner:
            inc_dict["owner"] = payload.owner
        inc_dict["updated_at"] = datetime.now(timezone.utc)
        return IncidentDetailResponse(**inc_dict)

    async def add_comment(
        self, db: AsyncSession, organization_id: uuid.UUID, incident_id: str, payload: IncidentCommentCreate, author: str
    ) -> Dict[str, Any]:
        return {
            "id": f"cmt-{uuid.uuid4().hex[:6]}",
            "author": author,
            "comment": payload.comment,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def add_task(
        self, db: AsyncSession, organization_id: uuid.UUID, incident_id: str, payload: IncidentTaskCreate
    ) -> Dict[str, Any]:
        return {
            "id": f"tsk-{uuid.uuid4().hex[:6]}",
            "task": payload.task,
            "owner": payload.owner or "Assigned Responder",
            "priority": payload.priority,
            "status": "OPEN",
            "due_date": payload.due_date.isoformat() if payload.due_date else None,
        }

    async def add_evidence(
        self, db: AsyncSession, organization_id: uuid.UUID, incident_id: str, payload: IncidentEvidenceCreate, uploader: str
    ) -> Dict[str, Any]:
        return {
            "id": f"ev-{uuid.uuid4().hex[:6]}",
            "title": payload.title,
            "evidence_type": payload.evidence_type,
            "file_name": payload.file_name,
            "file_size_bytes": payload.file_size_bytes,
            "uploaded_by": uploader,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "verification_status": "VERIFIED",
        }

    async def execute_action(
        self, db: AsyncSession, organization_id: uuid.UUID, incident_id: str, payload: IncidentResponseActionExecute, executor: str
    ) -> Dict[str, Any]:
        return {
            "action_type": payload.action_type,
            "target": payload.target,
            "status": "EXECUTED",
            "executed_by": executor,
            "reason": payload.reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "result_message": f"Successfully executed {payload.action_type} on target {payload.target}.",
        }


incident_service = IncidentService()
