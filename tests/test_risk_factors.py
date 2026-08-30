"""Unit tests for Phase 5 risk factor calculation engines."""
import uuid
import pytest

from app.engines.control_engine import ControlEngine
from app.engines.exposure_engine import ExposureEngine
from app.engines.impact_engine import ImpactEngine
from app.engines.likelihood_engine import LikelihoodEngine
from app.models.asset import Asset
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetType,
    DataClassification,
    EvidenceResult,
    EvidenceSource,
    EvidenceType,
    ExploitAvailability,
    VulnerabilitySeverity,
)
from app.models.evidence import Evidence
from app.models.vulnerability import Vulnerability


def test_cvss_normalization():
    """CVSS 0.0 -> 0, 5.0 -> 50, 10.0 -> 100."""
    cases = [(0.0, 0.0), (5.0, 50.0), (9.8, 98.0), (10.0, 100.0)]
    for raw, expected in cases:
        norm = round(min(100.0, max(0.0, raw * 10.0)), 2)
        assert norm == expected


def test_asset_criticality_mapping():
    """Criticality maps LOW -> 25, MEDIUM -> 50, HIGH -> 75, CRITICAL -> 100."""
    mapping = ImpactEngine.CRITICALITY_MAPPING
    assert mapping[AssetCriticality.LOW] == 25.0
    assert mapping[AssetCriticality.MEDIUM] == 50.0
    assert mapping[AssetCriticality.HIGH] == 75.0
    assert mapping[AssetCriticality.CRITICAL] == 100.0


def test_data_classification_mapping():
    """Data classification maps PUBLIC -> 20, INTERNAL -> 40, CONFIDENTIAL -> 70, RESTRICTED -> 100."""
    mapping = ImpactEngine.DATA_CLASSIFICATION_MAPPING
    assert mapping[DataClassification.PUBLIC] == 20.0
    assert mapping[DataClassification.INTERNAL] == 40.0
    assert mapping[DataClassification.CONFIDENTIAL] == 70.0
    assert mapping[DataClassification.RESTRICTED] == 100.0


def test_exposure_engine_internet_vs_internal_vs_local():
    """Internet exposed -> 100, Internal only -> 40, Local only -> 20."""
    asset_internet = Asset(
        id=uuid.uuid4(),
        name="Public-Web",
        asset_type=AssetType.SERVER,
        internet_exposed=True,
    )
    res_internet = ExposureEngine.evaluate(asset_internet)
    assert res_internet.exposure_score == 100.0
    assert res_internet.internet_exposed is True

    asset_internal = Asset(
        id=uuid.uuid4(),
        name="Internal-DB",
        asset_type=AssetType.DATABASE,
        internet_exposed=False,
    )
    res_internal = ExposureEngine.evaluate(asset_internal)
    assert res_internal.exposure_score == 40.0

    # Local-only evidence
    ev_local = Evidence(
        id=uuid.uuid4(),
        asset_id=asset_internal.id,
        evidence_type=EvidenceType.NETWORK_EXPOSURE,
        source=EvidenceSource.NETWORK_SCAN,
        value="127.0.0.1 loopback only",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )
    res_local = ExposureEngine.evaluate(asset_internal, [ev_local])
    assert res_local.exposure_score == 20.0


def test_exploitability_engine_kev_and_poc():
    """CISA KEV = high score (~95-100), Exploit Available = ~85, No exploit = ~30."""
    # 1. KEV
    vuln_kev = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-44228",
        description="Apache Log4j RCE",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=10.0,
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    res_kev = LikelihoodEngine.evaluate(vuln_kev)
    assert res_kev.exploitability_score >= 95.0
    assert res_kev.known_exploited is True

    # 2. Public exploit available (not KEV)
    vuln_exp = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2023-12345",
        description="Public exploit available",
        severity=VulnerabilitySeverity.HIGH,
        cvss_score=8.0,
        known_exploited=False,
        exploit_available=ExploitAvailability.YES,
    )
    res_exp = LikelihoodEngine.evaluate(vuln_exp)
    assert 80.0 <= res_exp.exploitability_score <= 95.0

    # 3. No public exploit
    vuln_no_exp = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2023-99999",
        description="Theoretical vulnerability",
        severity=VulnerabilitySeverity.MEDIUM,
        cvss_score=5.0,
        known_exploited=False,
        exploit_available=ExploitAvailability.NO,
    )
    res_no_exp = LikelihoodEngine.evaluate(vuln_no_exp)
    assert res_no_exp.exploitability_score <= 40.0


def test_control_engine_mitigation_reduction():
    """Active security controls reduce control gap and risk contribution."""
    # No controls -> 100% gap
    res_none = ControlEngine.evaluate([])
    assert res_none.control_gap == 100.0
    assert len(res_none.active_controls) == 0

    # Strong controls: WAF + EDR + Segmentation
    ev_waf = Evidence(
        id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        evidence_type=EvidenceType.SECURITY_CONTROL,
        source=EvidenceSource.SECURITY_TOOL,
        value="WAF virtual patching active",
        result=EvidenceResult.CONFIRMED,
        confidence=0.95,
    )
    ev_edr = Evidence(
        id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        evidence_type=EvidenceType.SECURITY_CONTROL,
        source=EvidenceSource.SECURITY_TOOL,
        value="EDR agent operational with block mode",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )
    res_controls = ControlEngine.evaluate([ev_waf, ev_edr])
    assert res_controls.control_score >= 45.0
    assert res_controls.control_gap <= 55.0
    assert "WAF" in res_controls.active_controls
    assert "EDR" in res_controls.active_controls
    assert len(res_controls.risk_reducers) >= 2
