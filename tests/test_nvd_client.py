"""Unit tests for NVD 2.0 API client parser and response normalization."""
import pytest
from app.integrations.nvd_client import NVDClient
from app.models.enums import ExploitAvailability, VulnerabilitySeverity

SAMPLE_NVD_CVE_ITEM = {
    "cve": {
        "id": "CVE-2021-41773",
        "sourceIdentifier": "cve@mitre.org",
        "published": "2021-10-05T11:15:00.000Z",
        "lastModified": "2021-12-03T18:30:00.000Z",
        "descriptions": [
            {
                "lang": "en",
                "value": "A flaw was found in a change made to path normalization in Apache HTTP Server 2.4.49. An attacker could use a path traversal attack to map URLs to files outside the expected document root.",
            }
        ],
        "metrics": {
            "cvssMetricV31": [
                {
                    "source": "nvd@nist.gov",
                    "type": "Primary",
                    "cvssData": {
                        "version": "3.1",
                        "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
                        "attackVector": "NETWORK",
                        "attackComplexity": "LOW",
                        "privilegesRequired": "NONE",
                        "userInteraction": "NONE",
                        "scope": "UNCHANGED",
                        "confidentialityImpact": "HIGH",
                        "integrityImpact": "NONE",
                        "availabilityImpact": "NONE",
                        "baseScore": 7.5,
                        "baseSeverity": "HIGH",
                    },
                    "exploitabilityScore": 3.9,
                    "impactScore": 3.6,
                }
            ]
        },
        "weaknesses": [
            {
                "source": "nvd@nist.gov",
                "type": "Primary",
                "description": [{"lang": "en", "value": "CWE-22"}],
            }
        ],
        "configurations": [
            {
                "nodes": [
                    {
                        "operator": "OR",
                        "negate": False,
                        "cpeMatch": [
                            {
                                "vulnerable": True,
                                "criteria": "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*",
                                "matchCriteriaId": "D3C9D553-DA38-4C70-985B-F1186D9E3A56",
                            }
                        ],
                    }
                ]
            }
        ],
        "references": [
            {
                "url": "http://httpd.apache.org/security/vulnerabilities_24.html",
                "source": "cve@mitre.org",
                "tags": ["Vendor Advisory"],
            },
            {
                "url": "http://packetstormsecurity.com/files/164418/Apache-HTTP-Server-2.4.49-Path-Traversal.html",
                "source": "cve@mitre.org",
                "tags": ["Exploit", "Third Party Advisory"],
            },
        ],
    }
}


def test_parse_nvd_cve_item_cvss_v31():
    parsed = NVDClient.parse_nvd_cve_item(SAMPLE_NVD_CVE_ITEM)

    assert parsed["cve_id"] == "CVE-2021-41773"
    assert "path normalization" in parsed["description"]
    assert parsed["severity"] == VulnerabilitySeverity.HIGH
    assert parsed["cvss_score"] == 7.5
    assert parsed["cvss_version"] == "3.1"
    assert parsed["cvss_vector"] == "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N"
    assert parsed["attack_vector"] == "NETWORK"
    assert parsed["attack_complexity"] == "LOW"
    assert parsed["cwe_id"] == "CWE-22"
    assert "CWE-22" in parsed["cwes"]
    assert parsed["exploit_available"] == ExploitAvailability.YES
    assert len(parsed["cpe_matches"]) == 1
    assert parsed["cpe_matches"][0]["criteria"] == "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*"


def test_parse_nvd_cve_item_cvss_v2_fallback():
    v2_item = {
        "cve": {
            "id": "CVE-2014-0160",
            "descriptions": [{"lang": "en", "value": "Heartbleed vulnerability in OpenSSL"}],
            "metrics": {
                "cvssMetricV2": [
                    {
                        "cvssData": {
                            "version": "2.0",
                            "vectorString": "AV:N/AC:L/Au:N/C:P/I:N/A:N",
                            "accessVector": "NETWORK",
                            "accessComplexity": "LOW",
                            "baseScore": 5.0,
                        },
                        "baseSeverity": "MEDIUM",
                    }
                ]
            },
        }
    }
    parsed = NVDClient.parse_nvd_cve_item(v2_item)
    assert parsed["cve_id"] == "CVE-2014-0160"
    assert parsed["cvss_score"] == 5.0
    assert parsed["severity"] == VulnerabilitySeverity.MEDIUM
    assert parsed["cvss_version"] == "2.0"
