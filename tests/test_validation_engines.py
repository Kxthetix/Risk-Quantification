"""Unit tests for Phase 4 validation engines (Version, Configuration, Exposure, and Validation Decision Engine)."""
import uuid
import pytest

from app.engines.configuration_validation import (
    ConfigurationValidationEngine,
    ConfigurationValidationResult,
)
from app.engines.exposure_validation import (
    ExposureValidationEngine,
    ExposureValidationResult,
)
from app.engines.version_validation import (
    VersionValidationEngine,
    VersionValidationResult,
)
from app.engines.validation_engine import (
    ValidationEngine,
    ValidationEngineOutput,
)
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.cpe import CPE
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetStatus,
    AssetType,
    AssetVulnerabilityStatus,
    EvidenceResult,
    EvidenceSource,
    EvidenceType,
    ExploitAvailability,
    ExposureLevel,
    ValidationStatus,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.evidence import Evidence
from app.models.software import Software
from app.models.validation_rule import ValidationRule
from app.models.vulnerability import Vulnerability, VulnerabilityCPE


# ===========================================================================
# 1. Version Validation Tests
# ===========================================================================

def test_version_validation_affected_version():
    """Installed version is within the CVE affected range."""
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=uuid.uuid4(),
        cpe_id=uuid.uuid4(),
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    )

    res = VersionValidationEngine.evaluate(
        installed_version="2.4.49",
        vulnerability_cpes=[vcpe],
    )

    assert res.status == "CONFIRMED"
    assert res.confidence == 0.95
    assert "within affected range" in res.reason


def test_version_validation_unaffected_version():
    """Installed version is higher than affected upper boundary."""
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=uuid.uuid4(),
        cpe_id=uuid.uuid4(),
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    )

    res = VersionValidationEngine.evaluate(
        installed_version="2.4.52",
        vulnerability_cpes=[vcpe],
    )

    assert res.status == "NOT_VULNERABLE"
    assert res.confidence >= 0.90
    assert "outside all known affected version boundaries" in res.reason


def test_version_validation_unknown_version():
    """Installed version cannot be verified or is unknown wildcard."""
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=uuid.uuid4(),
        cpe_id=uuid.uuid4(),
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    )

    res = VersionValidationEngine.evaluate(
        installed_version="*",
        vulnerability_cpes=[vcpe],
    )

    assert res.status == "UNKNOWN"
    assert res.confidence <= 0.40


def test_version_validation_patch_evidence():
    """Compensating patch evidence renders asset not vulnerable."""
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=uuid.uuid4(),
        cpe_id=uuid.uuid4(),
        version_end_excluding="2.4.51",
    )
    patch_ev = Evidence(
        id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        evidence_type=EvidenceType.PATCH_STATUS,
        source=EvidenceSource.SECURITY_TOOL,
        value="Vendor hotfix CVE-2021-41773 applied",
        result=EvidenceResult.CONFIRMED,
        confidence=0.99,
    )

    res = VersionValidationEngine.evaluate(
        installed_version="2.4.49",
        vulnerability_cpes=[vcpe],
        version_evidence=[patch_ev],
    )

    assert res.status == "NOT_VULNERABLE"
    assert "Patch status confirmed" in res.reason


# ===========================================================================
# 2. Configuration Validation Tests
# ===========================================================================

def test_configuration_validation_confirmed():
    """Vulnerable feature or module is confirmed active."""
    ev = Evidence(
        id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        evidence_type=EvidenceType.CONFIGURATION,
        source=EvidenceSource.CONFIGURATION_SCAN,
        value="mod_cgi enabled",
        result=EvidenceResult.CONFIRMED,
        confidence=0.90,
    )

    res = ConfigurationValidationEngine.evaluate(config_evidence=[ev])

    assert res.status == "CONFIRMED"
    assert res.confidence == 0.90
    assert "Vulnerable configuration or feature active" in res.reason


def test_configuration_validation_not_confirmed():
    """Vulnerable configuration is verified disabled or absent."""
    ev = Evidence(
        id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        evidence_type=EvidenceType.CONFIGURATION,
        source=EvidenceSource.MANUAL,
        value="mod_cgi disabled in httpd.conf",
        result=EvidenceResult.NOT_CONFIRMED,
        confidence=0.85,
    )

    res = ConfigurationValidationEngine.evaluate(config_evidence=[ev])

    assert res.status == "NOT_CONFIRMED"
    assert res.confidence == 0.85
    assert "absent or disabled" in res.reason


def test_configuration_validation_unknown():
    """No configuration evidence available."""
    res = ConfigurationValidationEngine.evaluate(config_evidence=[])

    assert res.status == "UNKNOWN"
    assert res.confidence == 0.50


# ===========================================================================
# 3. Exposure Validation Tests
# ===========================================================================

def test_exposure_validation_internet_exposed():
    """Asset is public internet exposed with open listening port."""
    port_ev = Evidence(
        id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        evidence_type=EvidenceType.PORT,
        source=EvidenceSource.NETWORK_SCAN,
        value="443/tcp open",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )
    svc_ev = Evidence(
        id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        evidence_type=EvidenceType.SERVICE,
        source=EvidenceSource.NETWORK_SCAN,
        value="httpd active",
        result=EvidenceResult.CONFIRMED,
        confidence=0.95,
    )

    res = ExposureValidationEngine.evaluate(
        asset_internet_exposed=True,
        network_evidence=[port_ev, svc_ev],
    )

    assert res.level == ExposureLevel.INTERNET.value
    assert res.service_active is True
    assert any("443/tcp" in p for p in res.ports)
    assert "httpd active" in res.services


def test_exposure_validation_local_only():
    """Network scan confirms service bound to localhost only."""
    net_ev = Evidence(
        id=uuid.uuid4(),
        asset_id=uuid.uuid4(),
        evidence_type=EvidenceType.NETWORK_EXPOSURE,
        source=EvidenceSource.NETWORK_SCAN,
        value="127.0.0.1 loopback only",
        result=EvidenceResult.CONFIRMED,
        confidence=0.95,
    )

    res = ExposureValidationEngine.evaluate(
        asset_internet_exposed=False,
        network_evidence=[net_ev],
    )

    assert res.level == ExposureLevel.LOCAL_ONLY.value


# ===========================================================================
# 4. Validation Engine Decision & Scoring Tests
# ===========================================================================

def test_validation_engine_confirmed_pipeline():
    """Strong evidence pipeline produces CONFIRMED status with score >= 80."""
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-41773",
        description="Path traversal in Apache HTTP Server 2.4.49",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        exploit_available=ExploitAvailability.YES,
        known_exploited=True,
    )
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=vuln.id,
        cpe_id=uuid.uuid4(),
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    )
    vuln.vulnerability_cpes = [vcpe]

    asset = Asset(
        id=uuid.uuid4(),
        name="Prod-Web-Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        internet_exposed=True,
    )
    software = Software(
        id=uuid.uuid4(),
        product_name="Apache HTTP Server",
        product_version="2.4.49",
        vendor="Apache",
    )
    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        software_id=software.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    av.asset = asset
    av.vulnerability = vuln
    av.software = software

    # Evidence: active service + active cgi config
    ev_svc = Evidence(
        id=uuid.uuid4(),
        asset_id=asset.id,
        asset_vulnerability_id=av.id,
        evidence_type=EvidenceType.SERVICE,
        source=EvidenceSource.NETWORK_SCAN,
        value="apache2 service active",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )
    ev_cfg = Evidence(
        id=uuid.uuid4(),
        asset_id=asset.id,
        asset_vulnerability_id=av.id,
        evidence_type=EvidenceType.CONFIGURATION,
        source=EvidenceSource.CONFIGURATION_SCAN,
        value="mod_cgi enabled",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )

    output: ValidationEngineOutput = ValidationEngine.evaluate(
        asset_vulnerability=av,
        evidence_list=[ev_svc, ev_cfg],
    )

    assert output.validation_status == ValidationStatus.CONFIRMED
    assert output.validation_score >= 80.0
    assert output.confidence >= 0.85
    assert len(output.reasons) >= 3


def test_validation_engine_mitigation_deduction():
    """Compensating security control deducts score and prevents high confirmation."""
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-41773",
        description="Path traversal in Apache HTTP Server",
        severity=VulnerabilitySeverity.HIGH,
        cvss_score=8.5,
        exploit_available=ExploitAvailability.YES,
        known_exploited=False,
    )
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=vuln.id,
        cpe_id=uuid.uuid4(),
        version_end_excluding="2.4.51",
    )
    vuln.vulnerability_cpes = [vcpe]

    asset = Asset(
        id=uuid.uuid4(),
        name="Internal-App",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.DEVELOPMENT,
        criticality=AssetCriticality.MEDIUM,
        internet_exposed=False,
    )
    software = Software(
        id=uuid.uuid4(),
        product_name="Apache",
        product_version="2.4.49",
    )
    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        software_id=software.id,
    )
    av.asset = asset
    av.vulnerability = vuln
    av.software = software

    # Mitigating control: WAF blocks traversal
    waf_ev = Evidence(
        id=uuid.uuid4(),
        asset_id=asset.id,
        evidence_type=EvidenceType.SECURITY_CONTROL,
        source=EvidenceSource.MANUAL,
        value="Cloudflare WAF rule active blocking path traversal",
        result=EvidenceResult.CONFIRMED,
        confidence=0.95,
    )

    output = ValidationEngine.evaluate(
        asset_vulnerability=av,
        evidence_list=[waf_ev],
    )

    assert output.mitigation_check == "MITIGATED"
    assert output.rule_contributions.get("MITIGATION_PRESENT", 0.0) < 0.0
    assert "Compensating security control active" in " ".join(output.reasons)


def test_validation_engine_false_positive_when_unaffected_version():
    """When installed version is outside range, status is LIKELY_NOT_VULNERABLE or FALSE_POSITIVE."""
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-41773",
        description="Path traversal",
        severity=VulnerabilitySeverity.HIGH,
    )
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=vuln.id,
        cpe_id=uuid.uuid4(),
        version_end_excluding="2.4.51",
    )
    vuln.vulnerability_cpes = [vcpe]

    asset = Asset(
        id=uuid.uuid4(),
        name="Server-Patched",
        internet_exposed=True,
    )
    software = Software(
        id=uuid.uuid4(),
        product_name="Apache",
        product_version="2.4.54",  # Outside affected range
    )
    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        software_id=software.id,
    )
    av.asset = asset
    av.vulnerability = vuln
    av.software = software

    output = ValidationEngine.evaluate(asset_vulnerability=av)

    assert output.version_check == "NOT_VULNERABLE"
    assert output.validation_status in (
        ValidationStatus.FALSE_POSITIVE,
        ValidationStatus.LIKELY_NOT_VULNERABLE,
    )
