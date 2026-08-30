"""Tests for Phase 9 Analytics Metrics Layer (Risk, Financial, Vulnerability, Attack Path, Remediation)."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.attack_path_metrics import AttackPathMetrics
from app.analytics.financial_metrics import FinancialMetrics
from app.analytics.remediation_metrics import RemediationMetrics
from app.analytics.risk_metrics import RiskMetrics
from app.analytics.vulnerability_metrics import VulnerabilityMetrics
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.control import Control
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetType,
    AssetVulnerabilityStatus,
    ControlType,
    ExploitAvailability,
    RiskLevel,
    RiskMethod,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.financial_assessment import FinancialAssessment
from app.models.organization import Organization
from app.models.risk_assessment import RiskAssessment
from app.models.vulnerability import Vulnerability


@pytest.mark.asyncio
async def test_risk_metrics_overview_and_heatmap(db_session: AsyncSession, test_org: Organization):
    # Create Asset & Vulnerabilities
    srv = Asset(
        organization_id=test_org.id,
        name="Production Web App",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        business_value=2000000.0,
        internet_exposed=True,
    )
    db_session.add(srv)
    await db_session.flush()

    v1 = Vulnerability(
        cve_id="CVE-2026-1111",
        description="Critical SQLi",
        cvss_score=9.4,
        severity=VulnerabilitySeverity.CRITICAL,
        exploit_available=ExploitAvailability.YES,
    )
    v2 = Vulnerability(
        cve_id="CVE-2026-2222",
        description="Medium XSS",
        cvss_score=5.5,
        severity=VulnerabilitySeverity.MEDIUM,
        exploit_available=ExploitAvailability.NO,
    )
    db_session.add_all([v1, v2])
    await db_session.flush()

    av1 = AssetVulnerability(
        asset_id=srv.id,
        vulnerability_id=v1.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    av2 = AssetVulnerability(
        asset_id=srv.id,
        vulnerability_id=v2.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add_all([av1, av2])
    await db_session.flush()

    r1 = RiskAssessment(
        organization_id=test_org.id,
        asset_id=srv.id,
        asset_vulnerability_id=av1.id,
        final_risk_score=90.0,
        likelihood_score=85.0,
        impact_score=95.0,
        risk_level=RiskLevel.CRITICAL,
    )
    r2 = RiskAssessment(
        organization_id=test_org.id,
        asset_id=srv.id,
        asset_vulnerability_id=av2.id,
        final_risk_score=50.0,
        likelihood_score=50.0,
        impact_score=50.0,
        risk_level=RiskLevel.MEDIUM,
    )
    db_session.add_all([r1, r2])
    await db_session.commit()

    overview = await RiskMetrics.get_risk_overview(db_session, test_org.id)
    assert overview.score == 70.0
    assert overview.level == "HIGH"
    assert overview.distribution["critical"] == 1
    assert overview.distribution["medium"] == 1

    heatmap = await RiskMetrics.get_risk_heatmap(db_session, test_org.id)
    assert heatmap.dimensions == {"likelihood": 5, "impact": 5}
    assert len(heatmap.cells) == 25
    assert sum(c.finding_count for c in heatmap.cells) >= 2


@pytest.mark.asyncio
async def test_vulnerability_aging_and_sla(db_session: AsyncSession, test_org: Organization):
    aging = await VulnerabilityMetrics.get_vulnerability_aging(db_session, test_org.id)
    assert "0-7 days" in aging.buckets
    assert aging.average_age_days >= 0.0

    sla = await VulnerabilityMetrics.get_sla_compliance(db_session, test_org.id)
    assert sla.compliance_rate >= 0.0
    assert sla.average_remediation_time_hours > 0.0


@pytest.mark.asyncio
async def test_compliance_framework_evaluation(db_session: AsyncSession, test_org: Organization):
    # Seed a control
    c = Control(
        organization_id=test_org.id,
        name="WAF Shield",
        control_type=ControlType.WAF,
        effectiveness=0.9,
        implementation_cost=50000.0,
        annual_cost=10000.0,
        enabled=True,
    )
    db_session.add(c)
    await db_session.commit()

    iso = await RemediationMetrics.get_compliance_framework_evaluation(db_session, test_org.id, "ISO/IEC 27001")
    assert iso["framework"] == "ISO/IEC 27001"
    assert iso["implemented_count"] >= 1
    assert iso["coverage"] > 0.0
