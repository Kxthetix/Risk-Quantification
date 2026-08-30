"""Authoritative Service for SOAR Approvals & High-Risk Safeguards (Phase 10)."""
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import uuid

from app.schemas.approval import (
    ApprovalItem,
    ApprovalDetailResponse,
    ApprovalActionRequest,
)


class ApprovalService:
    """Manages high-risk action approval queue and authorization enforcement."""

    _approvals: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def _seed_approvals_if_empty(cls):
        if cls._approvals:
            return

        now = datetime.now(timezone.utc)
        cls._approvals = {
            "appr-001": {
                "id": "appr-001",
                "incident_id": "inc-001",
                "incident_number": "INC-2026-089",
                "playbook_id": "pb-ransomware-01",
                "playbook_name": "Ransomware & Active C2 Ingress Containment",
                "execution_id": "exec-9921",
                "action_type": "ISOLATE_ASSET",
                "target": "Payments-DMZ-Gateway-01 (10.0.1.15)",
                "reason": "Host exhibiting unauthenticated Cobalt Strike beaconing; network isolation required to prevent lateral traversal to core ledger database.",
                "requested_by": "Auto-SOAR Ingestion Engine",
                "potential_impact": "Temporary failover of payments ingress traffic to backup gateway cluster. < 15s latency degradation.",
                "current_risk_exposure": 2800000.0,
                "projected_risk_exposure": 650000.0,
                "status": "PENDING",
                "created_at": now - timedelta(minutes=15),
                "expires_at": now + timedelta(minutes=45),
                "is_high_risk": True,
                "target_details": {
                    "hostname": "Payments-DMZ-Gateway-01",
                    "ip": "10.0.1.15",
                    "os": "Ubuntu 22.04 LTS (Hardened)",
                    "criticality": "CRITICAL",
                    "owner": "Infrastructure Core Team",
                },
                "affected_services": ["Digital Banking Core", "Card Authorization Gateway"],
                "affected_assets": ["ast-gw-01", "ast-db-04"],
            },
            "appr-002": {
                "id": "appr-002",
                "incident_id": "inc-002",
                "incident_number": "INC-2026-088",
                "playbook_id": "pb-cloud-03",
                "playbook_name": "Cloud IAM Privilege Escalation Lockdown",
                "execution_id": "exec-9922",
                "action_type": "DISABLE_ACCOUNT",
                "target": "svc-prod-deployer (IAM Principal)",
                "reason": "Suspicious role assumption from unapproved geographic region (Tor exit node).",
                "requested_by": "SOC Tier 2 Analyst",
                "potential_impact": "Automated CI/CD deployments will be queued until credential rotation.",
                "current_risk_exposure": 1200000.0,
                "projected_risk_exposure": 180000.0,
                "status": "PENDING",
                "created_at": now - timedelta(minutes=30),
                "expires_at": now + timedelta(minutes=30),
                "is_high_risk": True,
                "target_details": {
                    "principal_arn": "arn:aws:iam::123456789012:user/svc-prod-deployer",
                    "mfa_enabled": False,
                    "last_active": "5 mins ago",
                },
                "affected_services": ["Production Build Pipeline"],
                "affected_assets": ["ast-ci-runner-01"],
            },
        }

    @classmethod
    def get_approvals(cls, organization_id: str, status: Optional[str] = None) -> List[ApprovalItem]:
        cls._seed_approvals_if_empty()
        items = []
        for app in cls._approvals.values():
            if status and status != "ALL" and app["status"] != status:
                continue
            items.append(ApprovalItem(**app))
        return items

    @classmethod
    def get_approval(cls, organization_id: str, approval_id: str) -> ApprovalDetailResponse:
        cls._seed_approvals_if_empty()
        app = cls._approvals.get(approval_id)
        if not app:
            raise KeyError(f"Approval request {approval_id} not found")
        return ApprovalDetailResponse(**app)

    @classmethod
    def process_decision(
        cls,
        organization_id: str,
        approval_id: str,
        request: ApprovalActionRequest,
    ) -> ApprovalDetailResponse:
        cls._seed_approvals_if_empty()
        app = cls._approvals.get(approval_id)
        if not app:
            raise KeyError(f"Approval request {approval_id} not found")

        now = datetime.now(timezone.utc)
        if request.decision == "APPROVE":
            app["status"] = "APPROVED"
        else:
            app["status"] = "REJECTED"

        app["decision_by"] = request.approver_name or "SOC Incident Commander"
        app["decision_at"] = now
        app["decision_notes"] = request.justification

        cls._approvals[approval_id] = app
        return ApprovalDetailResponse(**app)
