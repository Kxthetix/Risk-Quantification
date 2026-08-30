"""Authoritative Service for Consolidated Major Incident Case Management (Phase 10)."""
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import uuid

from app.schemas.case_management import (
    CaseItem,
    CaseDetailResponse,
    CaseCreateRequest,
    CaseUpdateRequest,
)


class CaseService:
    """Manages multi-incident consolidated cases and campaign investigation workspaces."""

    _cases: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def _seed_cases_if_empty(cls):
        if cls._cases:
            return

        now = datetime.now(timezone.utc)
        cls._cases = {
            "case-001": {
                "id": "case-001",
                "case_number": "CASE-2026-004",
                "title": "Operation BearClaw: Coordinated Banking Infrastructure Campaign",
                "description": "Multi-stage intrusion campaign by APT29 targeting perimeter VPN gateways, harvesting SSO credentials, and attempting exfiltration of payment transaction databases.",
                "severity": "CRITICAL",
                "status": "INVESTIGATING",
                "owner": "Marcus Vance",
                "lead_investigator": "Sarah Chen (Incident Commander)",
                "created_at": now - timedelta(days=2),
                "updated_at": now - timedelta(hours=1),
                "linked_incidents_count": 2,
                "linked_alerts_count": 6,
                "risk_score": 88.5,
                "total_financial_exposure": 4000000.0,
                "linked_incidents": [
                    {
                        "id": "inc-001",
                        "incident_number": "INC-2026-089",
                        "title": "Cobalt Strike C2 Beaconing on Ingress Gateway",
                        "severity": "CRITICAL",
                        "status": "INVESTIGATING",
                        "financial_exposure": 2800000.0,
                    },
                    {
                        "id": "inc-002",
                        "incident_number": "INC-2026-088",
                        "title": "Credential Spray on Okta SSO IDP",
                        "severity": "HIGH",
                        "status": "CONTAINED",
                        "financial_exposure": 1200000.0,
                    },
                ],
                "linked_alerts": [
                    {"alert_id": "alt-01", "title": "Cobalt Strike Beacon Execution", "severity": "CRITICAL"},
                    {"alert_id": "alt-02", "title": "Suspicious Authentication from Tor", "severity": "HIGH"},
                    {"alert_id": "alt-03", "title": "Excessive API Token Creation", "severity": "HIGH"},
                ],
                "linked_events": [
                    {"event_id": "evt-01", "type": "PROCESS_EXEC", "source": "CrowdStrike", "timestamp": (now - timedelta(hours=2)).isoformat()},
                    {"event_id": "evt-02", "type": "AUTH_ANOMALY", "source": "Okta", "timestamp": (now - timedelta(hours=4)).isoformat()},
                ],
                "evidence_items": [
                    {"id": "ev-01", "title": "Memory Dump RAM Forensics", "file_name": "mem_dmz_gateway.raw", "uploaded_by": "Marcus Vance"},
                    {"id": "ev-02", "title": "WAF Access Logs Extract", "file_name": "waf_ingress_c2.csv", "uploaded_by": "SOC Ingestion"},
                ],
                "tasks": [
                    {"id": "ctask-01", "task": "Coordinate forensics report with Legal & Compliance", "owner": "Sarah Chen", "status": "IN_PROGRESS"},
                    {"id": "ctask-02", "task": "Verify domain blacklists with Threat Intel feeds", "owner": "Marcus Vance", "status": "COMPLETED"},
                ],
                "notes": [
                    {
                        "id": "cnote-01",
                        "content": "Adversary infrastructure overlaps with known Cozy Bear campaign tracked in US-CERT Alert AA24-101.",
                        "author": "Marcus Vance",
                        "timestamp": (now - timedelta(hours=5)).isoformat(),
                    }
                ],
                "threat_intel": {
                    "actor": "APT29 (Cozy Bear)",
                    "primary_technique": "T1190 - Exploit Public-Facing Application",
                    "target_sector": "Financial Services & Digital Banking",
                },
                "response_timeline": [
                    {"timestamp": (now - timedelta(hours=6)).isoformat(), "action": "Case Initialized", "actor": "Sarah Chen"},
                    {"timestamp": (now - timedelta(hours=4)).isoformat(), "action": "Linked INC-2026-088 & INC-2026-089", "actor": "Marcus Vance"},
                    {"timestamp": (now - timedelta(hours=2)).isoformat(), "action": "Containment Playbook Enforced", "actor": "Auto-SOAR Engine"},
                ],
            }
        }

    @classmethod
    def get_cases(cls, organization_id: str, status: Optional[str] = None) -> List[CaseItem]:
        cls._seed_cases_if_empty()
        items = []
        for c in cls._cases.values():
            if status and status != "ALL" and c["status"] != status:
                continue
            items.append(
                CaseItem(
                    id=c["id"],
                    case_number=c["case_number"],
                    title=c["title"],
                    description=c["description"],
                    severity=c["severity"],
                    status=c["status"],
                    owner=c["owner"],
                    lead_investigator=c.get("lead_investigator"),
                    created_at=c["created_at"],
                    updated_at=c["updated_at"],
                    linked_incidents_count=len(c.get("linked_incidents", [])),
                    linked_alerts_count=len(c.get("linked_alerts", [])),
                    risk_score=c.get("risk_score", 80.0),
                    total_financial_exposure=c.get("total_financial_exposure", 0.0),
                )
            )
        return items

    @classmethod
    def get_case(cls, organization_id: str, case_id: str) -> CaseDetailResponse:
        cls._seed_cases_if_empty()
        case = cls._cases.get(case_id)
        if not case:
            raise KeyError(f"Case {case_id} not found")
        return CaseDetailResponse(**case)

    @classmethod
    def create_case(cls, organization_id: str, request: CaseCreateRequest) -> CaseDetailResponse:
        cls._seed_cases_if_empty()
        now = datetime.now(timezone.utc)
        case_id = f"case-{uuid.uuid4().hex[:8]}"
        case_number = f"CASE-2026-{len(cls._cases) + 1:03d}"

        case_data = {
            "id": case_id,
            "case_number": case_number,
            "title": request.title,
            "description": request.description,
            "severity": request.severity,
            "status": "OPEN",
            "owner": request.owner,
            "lead_investigator": request.owner,
            "created_at": now,
            "updated_at": now,
            "linked_incidents_count": len(request.linked_incident_ids),
            "linked_alerts_count": len(request.linked_alert_ids),
            "risk_score": 75.0,
            "total_financial_exposure": 2500000.0,
            "linked_incidents": [{"id": i_id, "title": f"Incident {i_id}", "severity": "HIGH"} for i_id in request.linked_incident_ids],
            "linked_alerts": [{"alert_id": a_id, "title": f"Alert {a_id}", "severity": "HIGH"} for a_id in request.linked_alert_ids],
            "linked_events": [],
            "evidence_items": [],
            "tasks": [],
            "notes": [],
            "threat_intel": {"actor": "Investigating Threat Group"},
            "response_timeline": [{"timestamp": now.isoformat(), "action": "Case Created", "actor": request.owner}],
        }
        cls._cases[case_id] = case_data
        return CaseDetailResponse(**case_data)

    @classmethod
    def update_case(cls, organization_id: str, case_id: str, request: CaseUpdateRequest) -> CaseDetailResponse:
        cls._seed_cases_if_empty()
        case = cls._cases.get(case_id)
        if not case:
            raise KeyError(f"Case {case_id} not found")

        if request.title:
            case["title"] = request.title
        if request.description:
            case["description"] = request.description
        if request.severity:
            case["severity"] = request.severity
        if request.status:
            case["status"] = request.status
        if request.owner:
            case["owner"] = request.owner
        if request.lead_investigator:
            case["lead_investigator"] = request.lead_investigator

        case["updated_at"] = datetime.now(timezone.utc)
        cls._cases[case_id] = case
        return CaseDetailResponse(**case)
