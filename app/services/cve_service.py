"""Alias module pointing to vulnerability_service for CVE operations."""
from app.services.vulnerability_service import (
    CVEService,
    VulnerabilityService,
    cve_service,
    vulnerability_service,
)

__all__ = [
    "CVEService",
    "VulnerabilityService",
    "cve_service",
    "vulnerability_service",
]
