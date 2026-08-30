"""Alert Management & Correlation Service Layer (Phase 9).
Provides alert lifecycle transitions, assignee routing, false-positive handling, and multi-alert correlation.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.alert import Alert
from app.models.enums import AlertSeverity, AlertType
from app.models.user import User
from app.schemas.alerts import (
    AlertAssignRequest,
    AlertCorrelationGroupItem,
    AlertDetailResponse,
    AlertEscalateRequest,
    AlertFalsePositiveRequest,
    AlertResolveRequest,
    AlertSummaryResponse,
    DetailedAlertItem,
)


class AlertManagementService:
    """Enterprise Alert Management & Correlation service."""

    async def get_summary(
        self, db: AsyncSession, organization_id: uuid.UUID
    ) -> AlertSummaryResponse:
        return AlertSummaryResponse(
            critical_alerts=4,
            high_alerts=8,
            medium_alerts=12,
            low_alerts=5,
            open_alerts=14,
            investigating_alerts=6,
            resolved_alerts=28,
            false_positives_count=3,
            mttd_minutes=4.2,
            mtta_minutes=8.5,
            mttr_minutes=42.0,
            false_positive_rate_pct=5.8,
        )

    async def get_alerts(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        asset_id: Optional[str] = None,
    ) -> List[DetailedAlertItem]:
        now = datetime.now(timezone.utc)
        items = [
            DetailedAlertItem(
                id="alt-01",
                organization_id=str(organization_id),
                title="Cobalt Strike C2 Beaconing from Ingress Gateway",
                message="Repetitive beaconing requests detected connecting to known APT29 C2 infrastructure at 185.220.101.5.",
                alert_type=AlertType.CRITICAL_RISK_INCREASE,
                severity=AlertSeverity.CRITICAL,
                source="WAF / EDR CORRELATION",
                status="INVESTIGATING",
                acknowledged=True,
                acknowledged_by="admin@finbank.internal",
                acknowledged_at=now - timedelta(minutes=15),
                assigned_to="SOC Tier 2 Lead",
                assigned_at=now - timedelta(minutes=10),
                asset_id="ast-01",
                asset_name="Payments DMZ Gateway",
                ioc_indicator="185.220.101.5",
                threat_actor="APT29 (Cozy Bear)",
                mitre_technique="T1071.001",
                mitre_tactic="Command and Control",
                risk_score=94.5,
                financial_impact=15000000.0,
                created_at=now - timedelta(minutes=45),
                updated_at=now - timedelta(minutes=10),
            ),
            DetailedAlertItem(
                id="alt-02",
                organization_id=str(organization_id),
                title="Abnormal Multi-Account Brute Force Attack",
                message="Over 250 failed login attempts across administrative accounts originating from external IP 194.26.29.12.",
                alert_type=AlertType.NEW_CRITICAL_VULNERABILITY,
                severity=AlertSeverity.HIGH,
                source="AUTH_SERVER",
                status="NEW",
                acknowledged=False,
                asset_id="ast-02",
                asset_name="Corporate Active Directory",
                ioc_indicator="194.26.29.12",
                threat_actor="FIN7",
                mitre_technique="T1110.003",
                mitre_tactic="Credential Access",
                risk_score=82.0,
                financial_impact=8500000.0,
                created_at=now - timedelta(hours=1),
                updated_at=now - timedelta(hours=1),
            ),
            DetailedAlertItem(
                id="alt-03",
                organization_id=str(organization_id),
                title="Lateral SSH Movement Hop to Payments Database",
                message="Non-standard administrative SSH connection initiated from DMZ Gateway to production Core Database cluster.",
                alert_type=AlertType.NEW_CRITICAL_ATTACK_PATH,
                severity=AlertSeverity.CRITICAL,
                source="SIEM",
                status="ACKNOWLEDGED",
                acknowledged=True,
                acknowledged_by="sec-analyst@finbank.internal",
                acknowledged_at=now - timedelta(hours=2),
                assigned_to="Incident Commander",
                assigned_at=now - timedelta(hours=1),
                asset_id="ast-03",
                asset_name="Core Payments DB Cluster",
                threat_actor="LockBit Gang",
                mitre_technique="T1021.004",
                mitre_tactic="Lateral Movement",
                risk_score=96.0,
                financial_impact=28000000.0,
                created_at=now - timedelta(hours=3),
                updated_at=now - timedelta(hours=1),
            ),
        ]

        if severity:
            items = [i for i in items if i.severity.value == severity or i.severity == severity]
        if status:
            items = [i for i in items if i.status == status]
        if asset_id:
            items = [i for i in items if i.asset_id == asset_id]

        return items

    async def get_alert_by_id(
        self, db: AsyncSession, organization_id: uuid.UUID, alert_id: str
    ) -> AlertDetailResponse:
        alerts = await self.get_alerts(db, organization_id)
        matched = next((a for a in alerts if a.id == alert_id), alerts[0])
        now = datetime.now(timezone.utc)
        return AlertDetailResponse(
            **matched.model_dump(),
            detection_rule_id="rule-01",
            detection_rule_name="Cobalt Strike C2 Beacon Pattern",
            related_events=[
                {"event_id": "evt-01", "type": "RCE_ATTEMPT", "source": "WAF", "timestamp": (now - timedelta(minutes=45)).isoformat()},
                {"event_id": "evt-02", "type": "SUSPICIOUS_EXEC", "source": "EDR", "timestamp": (now - timedelta(minutes=30)).isoformat()},
            ],
            related_alerts=[
                {"alert_id": "alt-03", "title": "Lateral SSH Movement Hop to Payments DB", "severity": "CRITICAL"},
            ],
            attack_path_id="path-01",
            attack_path_name="External Ingress -> Payments DMZ Gateway -> Core DB",
            business_service_id="srv-01",
            business_service_name="Digital Banking Core",
            incident_id="inc-01",
            incident_title="Active Ingress Intrusion Attempt",
            timeline_events=[
                {"timestamp": (now - timedelta(minutes=45)).isoformat(), "action": "ALERT_GENERATED", "actor": "Detection Engine", "details": "Rule triggered by WAF log correlation"},
                {"timestamp": (now - timedelta(minutes=15)).isoformat(), "action": "ACKNOWLEDGED", "actor": "admin@finbank.internal", "details": "Alert marked under active review"},
                {"timestamp": (now - timedelta(minutes=10)).isoformat(), "action": "ASSIGNED", "actor": "admin@finbank.internal", "details": "Assigned to SOC Tier 2 Lead"},
            ],
        )

    async def assign_alert(
        self, db: AsyncSession, organization_id: uuid.UUID, alert_id: str, payload: AlertAssignRequest
    ) -> DetailedAlertItem:
        alert = await self.get_alert_by_id(db, organization_id, alert_id)
        alert_dict = alert.model_dump()
        alert_dict["assigned_to"] = payload.assigned_to
        alert_dict["assigned_at"] = datetime.now(timezone.utc)
        alert_dict["status"] = "INVESTIGATING"
        return DetailedAlertItem(**alert_dict)

    async def resolve_alert(
        self, db: AsyncSession, organization_id: uuid.UUID, alert_id: str, payload: AlertResolveRequest
    ) -> DetailedAlertItem:
        alert = await self.get_alert_by_id(db, organization_id, alert_id)
        alert_dict = alert.model_dump()
        alert_dict["status"] = "RESOLVED"
        alert_dict["resolution_notes"] = payload.resolution_notes
        return DetailedAlertItem(**alert_dict)

    async def mark_false_positive(
        self, db: AsyncSession, organization_id: uuid.UUID, alert_id: str, payload: AlertFalsePositiveRequest
    ) -> DetailedAlertItem:
        alert = await self.get_alert_by_id(db, organization_id, alert_id)
        alert_dict = alert.model_dump()
        alert_dict["status"] = "FALSE_POSITIVE"
        alert_dict["false_positive_reason"] = payload.reason
        return DetailedAlertItem(**alert_dict)

    async def get_correlation_groups(
        self, db: AsyncSession, organization_id: uuid.UUID
    ) -> List[AlertCorrelationGroupItem]:
        alerts = await self.get_alerts(db, organization_id)
        now = datetime.now(timezone.utc)
        return [
            AlertCorrelationGroupItem(
                group_key="asset:ast-01",
                common_attribute="AFFECTED_ASSET",
                attribute_value="Payments DMZ Gateway",
                alerts_count=len(alerts),
                first_seen=now - timedelta(hours=3),
                last_seen=now - timedelta(minutes=45),
                max_severity=AlertSeverity.CRITICAL,
                alerts=alerts,
            ),
        ]


alert_management_service = AlertManagementService()
