"""Unit and scenario tests for the central Cyber Risk Engine (Phase 5)."""
import uuid
import pytest

from app.engines.risk_engine import RiskEngine
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetType,
    AssetVulnerabilityStatus,
    DataClassification,
    EvidenceResult,
    EvidenceSource,
    EvidenceType,
    ExploitAvailability,
    RiskLevel,
    ValidationStatus,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.evidence import Evidence
from app.models.vulnerability import Vulnerability
from app.models.vulnerability_validation import VulnerabilityValidation


def test_scenario_a_critical_high_impact():
    """Scenario A: CVSS 9.8, Critical asset, Internet exposed, KEV, High confidence, Weak controls -> CRITICAL."""
    asset = Asset(
        id=uuid.uuid4(),
        name="Production Payment Gateway",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        data_classification=DataClassification.RESTRICTED,
        internet_exposed=True,
        business_value=5000000.0,
    )
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-44228",
        description="Log4j RCE flaw",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    validation = VulnerabilityValidation(
        id=uuid.uuid4(),
        asset_vulnerability_id=av.id,
        validation_status=ValidationStatus.CONFIRMED,
        validation_score=92.0,
        confidence=0.95,
        version_check="CONFIRMED",
        configuration_check="CONFIRMED",
        exposure_check="INTERNET",
        exploit_check="KNOWN_EXPLOITED",
        mitigation_check="NONE",
        evidence_count=3,
    )

    output = RiskEngine.evaluate(
        asset=asset,
        asset_vulnerability=av,
        vulnerability=vuln,
        validation=validation,
        evidence_list=[],
    )

    assert output.risk_level == RiskLevel.CRITICAL
    assert output.final_risk_score >= 80.0
    assert len(output.factors) == 7
    assert any("CVSS" in f.name for f in output.factors)
    assert any("EXPLOITABILITY" in f.name for f in output.factors)


def test_scenario_b_low_impact_mitigated():
    """Scenario B: CVSS 9.8, Low-criticality dev asset, Internal only, No exploit, Low confidence, Strong controls."""
    asset = Asset(
        id=uuid.uuid4(),
        name="Dev Sandbox Worker",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.DEVELOPMENT,
        criticality=AssetCriticality.LOW,
        data_classification=DataClassification.PUBLIC,
        internet_exposed=False,
        business_value=10000.0,
    )
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-44228",
        description="Log4j theoretical match",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        known_exploited=False,
        exploit_available=ExploitAvailability.NO,
    )
    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.VENDOR_PRODUCT_VERSION,
        match_confidence=0.50,
        status=AssetVulnerabilityStatus.OPEN,
    )
    validation = VulnerabilityValidation(
        id=uuid.uuid4(),
        asset_vulnerability_id=av.id,
        validation_status=ValidationStatus.UNKNOWN,
        validation_score=35.0,
        confidence=0.25,
        version_check="UNKNOWN",
        configuration_check="NOT_CONFIRMED",
        exposure_check="INTERNAL",
        exploit_check="NONE",
        mitigation_check="WAF",
        evidence_count=1,
    )
    ev_waf = Evidence(
        id=uuid.uuid4(),
        asset_id=asset.id,
        evidence_type=EvidenceType.SECURITY_CONTROL,
        source=EvidenceSource.SECURITY_TOOL,
        value="WAF active and firewall blocking inbound traffic",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )

    output = RiskEngine.evaluate(
        asset=asset,
        asset_vulnerability=av,
        vulnerability=vuln,
        validation=validation,
        evidence_list=[ev_waf],
    )

    # Risk should be significantly lower than Scenario A
    assert output.final_risk_score < 50.0
    assert output.risk_level in (RiskLevel.LOW, RiskLevel.MEDIUM)
    assert len(output.risk_reducers) >= 1


def test_scenario_c_medium_cvss_high_contextual_risk():
    """Scenario C: CVSS = 5.0, Critical production asset, Internet exposed, Known exploited, High confidence."""
    asset = Asset(
        id=uuid.uuid4(),
        name="Core Prod Router",
        asset_type=AssetType.ROUTER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        data_classification=DataClassification.CONFIDENTIAL,
        internet_exposed=True,
    )
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2023-55555",
        description="Authentication bypass bypasses perimeter",
        severity=VulnerabilitySeverity.MEDIUM,
        cvss_score=5.0,
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    validation = VulnerabilityValidation(
        id=uuid.uuid4(),
        asset_vulnerability_id=av.id,
        validation_status=ValidationStatus.CONFIRMED,
        validation_score=85.0,
        confidence=0.90,
        version_check="CONFIRMED",
        configuration_check="CONFIRMED",
        exposure_check="INTERNET",
        exploit_check="KNOWN_EXPLOITED",
        mitigation_check="NONE",
        evidence_count=2,
    )

    output = RiskEngine.evaluate(
        asset=asset,
        asset_vulnerability=av,
        vulnerability=vuln,
        validation=validation,
        evidence_list=[],
    )

    # Even with CVSS 5.0, the contextual risk is elevated to HIGH / VERY_HIGH
    assert output.final_risk_score >= 60.0
    assert output.risk_level in (RiskLevel.HIGH, RiskLevel.VERY_HIGH, RiskLevel.CRITICAL)


def test_explainability_and_snapshots_present():
    """Every calculated risk output must contain factors, weights, contributions, explanation, and snapshots."""
    asset = Asset(
        id=uuid.uuid4(),
        name="App-Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        data_classification=DataClassification.INTERNAL,
        internet_exposed=True,
    )
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2022-1234",
        description="Sample bug",
        severity=VulnerabilitySeverity.HIGH,
        cvss_score=8.5,
        known_exploited=False,
        exploit_available=ExploitAvailability.YES,
    )
    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )

    output = RiskEngine.evaluate(
        asset=asset,
        asset_vulnerability=av,
        vulnerability=vuln,
    )

    assert output.risk_model_version == "1.0"
    assert output.risk_method == "CONTEXTUAL_WEIGHTED"
    assert len(output.factors) == 7
    assert len(output.explanation) >= 3
    assert "weights" in output.configuration_snapshot
    assert "asset_id" in output.input_snapshot
