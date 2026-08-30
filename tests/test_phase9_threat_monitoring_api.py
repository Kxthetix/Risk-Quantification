"""Comprehensive Integration & Unit Tests for Phase 9: Threat Intelligence, Monitoring, Alerts, Detection Rules & Incidents."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.organization import Organization
from app.models.user import User


@pytest.mark.asyncio
async def test_threat_intelligence_endpoints(
    client: AsyncClient,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Threat Summary
    res = await client.get("/api/v1/threat-intelligence/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["active_threats"] > 0
    assert data["threat_risk"] >= 50.0

    # 2. Threat Feeds
    res = await client.get("/api/v1/threat-intelligence/feeds", headers=headers)
    assert res.status_code == 200
    feeds = res.json()
    assert len(feeds) >= 2
    feed_id = feeds[0]["id"]

    # 3. Test Feed Health
    test_res = await client.post(f"/api/v1/threat-intelligence/feeds/{feed_id}/test", headers=headers)
    assert test_res.status_code == 200
    assert test_res.json()["health"] == "HEALTHY"

    # 4. Sources
    src_res = await client.get("/api/v1/threat-intelligence/sources", headers=headers)
    assert src_res.status_code == 200
    assert len(src_res.json()) >= 1

    # 5. IOCs
    ioc_res = await client.get("/api/v1/threat-intelligence/iocs", headers=headers)
    assert ioc_res.status_code == 200
    iocs = ioc_res.json()
    assert len(iocs) >= 1
    ioc_id = iocs[0]["id"]

    # 6. IOC Detail
    detail_res = await client.get(f"/api/v1/threat-intelligence/iocs/{ioc_id}", headers=headers)
    assert detail_res.status_code == 200
    assert len(detail_res.json()["sources"]) > 0

    # 7. Threat Actors
    act_res = await client.get("/api/v1/threat-intelligence/actors", headers=headers)
    assert act_res.status_code == 200
    actors = act_res.json()
    assert len(actors) >= 1
    act_id = actors[0]["id"]

    # 8. Threat Actor Detail
    act_detail_res = await client.get(f"/api/v1/threat-intelligence/actors/{act_id}", headers=headers)
    assert act_detail_res.status_code == 200
    assert act_detail_res.json()["capability"] is not None

    # 9. Campaigns
    cmp_res = await client.get("/api/v1/threat-intelligence/campaigns", headers=headers)
    assert cmp_res.status_code == 200
    assert len(cmp_res.json()) >= 1

    # 10. Threat Risk & Geography & Watchlists
    risk_res = await client.get("/api/v1/threat-intelligence/risk", headers=headers)
    assert risk_res.status_code == 200
    assert risk_res.json()["threat_exposure_score"] > 0

    geo_res = await client.get("/api/v1/threat-intelligence/geography", headers=headers)
    assert geo_res.status_code == 200
    assert len(geo_res.json()) >= 1

    wtch_res = await client.get("/api/v1/threat-intelligence/watchlists", headers=headers)
    assert wtch_res.status_code == 200
    assert len(wtch_res.json()) >= 1

    # 11. Report & Global Search
    rep_res = await client.get("/api/v1/threat-intelligence/reports", headers=headers)
    assert rep_res.status_code == 200
    assert "executive_summary" in rep_res.json()

    search_res = await client.get("/api/v1/threat-intelligence/search?query=APT29", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()["threat_actors"]) >= 1


@pytest.mark.asyncio
async def test_security_monitoring_endpoints(
    client: AsyncClient,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Monitoring Dashboard
    dash_res = await client.get("/api/v1/monitoring/dashboard", headers=headers)
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert data["events_per_second"] > 0
    assert data["system_health_pct"] >= 95.0

    # 2. List Events
    ev_res = await client.get("/api/v1/monitoring/events", headers=headers)
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["total"] >= 1
    event_id = ev_data["events"][0]["id"]

    # 3. Event Detail
    detail_res = await client.get(f"/api/v1/monitoring/events/{event_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["affected_business_service"] is not None

    # 4. Data Sources & Health
    src_res = await client.get("/api/v1/monitoring/data-sources", headers=headers)
    assert src_res.status_code == 200
    assert len(src_res.json()) >= 1

    health_res = await client.get("/api/v1/monitoring/health", headers=headers)
    assert health_res.status_code == 200
    assert health_res.json()["connected_sources_count"] >= 1


@pytest.mark.asyncio
async def test_alerts_and_detection_rules_endpoints(
    client: AsyncClient,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Alerts Summary & List
    sum_res = await client.get("/api/v1/alerts-management/summary", headers=headers)
    assert sum_res.status_code == 200
    assert sum_res.json()["open_alerts"] > 0

    list_res = await client.get("/api/v1/alerts-management/", headers=headers)
    assert list_res.status_code == 200
    alerts = list_res.json()
    assert len(alerts) >= 1
    alert_id = alerts[0]["id"]

    # 2. Alert Detail & Correlation
    detail_res = await client.get(f"/api/v1/alerts-management/{alert_id}", headers=headers)
    assert detail_res.status_code == 200

    corr_res = await client.get("/api/v1/alerts-management/correlations", headers=headers)
    assert corr_res.status_code == 200
    assert len(corr_res.json()) >= 1

    # 3. Assign & Resolve Alert
    assign_res = await client.post(
        f"/api/v1/alerts-management/{alert_id}/assign",
        json={"assigned_to": "SOC Analyst Bob", "notes": "Taking ownership"},
        headers=headers,
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_to"] == "SOC Analyst Bob"

    resolve_res = await client.post(
        f"/api/v1/alerts-management/{alert_id}/resolve",
        json={"resolution_notes": "WAF blocked incoming payload and host was verified clean.", "root_cause": "External Probe"},
        headers=headers,
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"

    # 4. Detection Rules List & Detail
    rules_res = await client.get("/api/v1/detection-rules/", headers=headers)
    assert rules_res.status_code == 200
    rules = rules_res.json()
    assert len(rules) >= 1
    rule_id = rules[0]["id"]

    rule_detail = await client.get(f"/api/v1/detection-rules/{rule_id}", headers=headers)
    assert rule_detail.status_code == 200
    assert "detection_logic" in rule_detail.json()

    # 5. Test Detection Rule Simulation
    test_rule_res = await client.post(
        "/api/v1/detection-rules/test",
        json={"sample_event_payload": {"process_name": "powershell.exe", "source_ip": "185.220.101.5", "event_type": "SUSPICIOUS_EXEC"}},
        headers=headers,
    )
    assert test_rule_res.status_code == 200
    assert test_rule_res.json()["matched"] is True


@pytest.mark.asyncio
async def test_incidents_management_endpoints(
    client: AsyncClient,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Incidents Summary & List
    sum_res = await client.get("/api/v1/incidents-management/summary", headers=headers)
    assert sum_res.status_code == 200
    assert sum_res.json()["open_incidents"] > 0

    list_res = await client.get("/api/v1/incidents-management/", headers=headers)
    assert list_res.status_code == 200
    incidents = list_res.json()
    assert len(incidents) >= 1
    inc_id = incidents[0]["id"]

    # 2. Incident Detail
    detail_res = await client.get(f"/api/v1/incidents-management/{inc_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["timeline"]) >= 1
    assert len(detail["tasks"]) >= 1
    assert len(detail["evidence_items"]) >= 1

    # 3. Create Incident
    create_payload = {
        "title": "Suspected Credential Leak on Payment Gateway",
        "description": "Multiple unusual logins detected from Tor exit nodes.",
        "severity": "HIGH",
        "affected_asset_ids": ["ast-01"],
    }
    new_inc_res = await client.post("/api/v1/incidents-management/", json=create_payload, headers=headers)
    assert new_inc_res.status_code == 201
    new_inc_id = new_inc_res.json()["id"]

    # 4. Add Comment
    cmt_res = await client.post(
        f"/api/v1/incidents-management/{new_inc_id}/comments",
        json={"comment": "Investigating active sessions and SSH connection logs."},
        headers=headers,
    )
    assert cmt_res.status_code == 201
    assert "author" in cmt_res.json()

    # 5. Add Task
    tsk_res = await client.post(
        f"/api/v1/incidents-management/{new_inc_id}/tasks",
        json={"task": "Perform Memory Forensic Dump", "priority": "CRITICAL"},
        headers=headers,
    )
    assert tsk_res.status_code == 201
    assert tsk_res.json()["task"] == "Perform Memory Forensic Dump"

    # 6. Execute Containment Action
    act_res = await client.post(
        f"/api/v1/incidents-management/{new_inc_id}/actions",
        json={"action_type": "BLOCK_IP", "target": "185.220.101.5", "reason": "Immediate malicious C2 containment"},
        headers=headers,
    )
    assert act_res.status_code == 200
    assert act_res.json()["status"] == "EXECUTED"
