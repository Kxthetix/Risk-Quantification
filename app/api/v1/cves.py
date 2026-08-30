"""CVE alias API router."""
from fastapi import APIRouter
from app.api.v1.vulnerabilities import (
    get_vulnerability_detail,
    list_vulnerabilities,
)
from app.schemas.vulnerability import (
    VulnerabilityDetailResponse,
    VulnerabilityListResponse,
)

router = APIRouter(prefix="/cves", tags=["CVEs"])

# Forward /cves endpoints to the vulnerability service handlers
router.add_api_route(
    "",
    list_vulnerabilities,
    methods=["GET"],
    response_model=VulnerabilityListResponse,
    summary="List CVEs",
    description="Alias to /api/v1/vulnerabilities",
)
router.add_api_route(
    "/{cve_id}",
    get_vulnerability_detail,
    methods=["GET"],
    response_model=VulnerabilityDetailResponse,
    summary="Get CVE Detail",
    description="Alias to /api/v1/vulnerabilities/{cve_id}",
)
