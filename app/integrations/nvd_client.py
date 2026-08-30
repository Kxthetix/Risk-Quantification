"""NVD (National Vulnerability Database) REST API 2.0 Client with rate-limiting, retries, and normalization."""
import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.models.enums import ExploitAvailability, VulnerabilitySeverity
from app.utils.cpe_utils import parse_cpe_23

logger = logging.getLogger("nvd_client")


class NVDClient:
    """Async client for NVD 2.0 CVE API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 30,
        rate_limit_delay: Optional[float] = None,
    ):
        self.api_key = api_key or settings.NVD_API_KEY
        self.base_url = base_url or settings.NVD_BASE_URL
        self.timeout = timeout or settings.NVD_REQUEST_TIMEOUT
        # 0.6s delay with API key (~50 req / 30s), 6.0s without (~5 req / 30s)
        if rate_limit_delay is not None:
            self.rate_limit_delay = rate_limit_delay
        else:
            self.rate_limit_delay = 0.6 if self.api_key else 6.0

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/json",
            "User-Agent": "CyberRiskPlatform/1.0",
        }
        if self.api_key:
            headers["apiKey"] = self.api_key
        return headers

    async def fetch_cves(
        self,
        start_index: int = 0,
        results_per_page: int = 100,
        last_mod_start_date: Optional[datetime] = None,
        last_mod_end_date: Optional[datetime] = None,
        cve_id: Optional[str] = None,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """Fetch CVEs from NVD with pagination and rate limit resilience."""
        params: Dict[str, Any] = {
            "startIndex": start_index,
            "resultsPerPage": min(results_per_page, 2000),
        }

        if cve_id:
            params["cveId"] = cve_id.strip().upper()

        if last_mod_start_date and last_mod_end_date:
            # Format: 2023-01-01T00:00:00.000%2B01:00 or ISO8601
            params["lastModStartDate"] = last_mod_start_date.strftime("%Y-%m-%dT%H:%M:%S.000 UTC")
            params["lastModEndDate"] = last_mod_end_date.strftime("%Y-%m-%dT%H:%M:%S.000 UTC")

        url = self.base_url
        headers = self._get_headers()

        attempt = 0
        backoff = 2.0

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            while attempt < max_retries:
                attempt += 1
                try:
                    logger.info("Fetching NVD CVEs from %s (startIndex=%d, attempt=%d)", url, start_index, attempt)
                    response = await client.get(url, params=params, headers=headers)

                    if response.status_code == 200:
                        # Wait rate limit window before next call
                        await asyncio.sleep(self.rate_limit_delay)
                        return response.json()

                    if response.status_code == 429:
                        logger.warning("NVD API rate limit hit (429). Backing off for %.1f seconds...", backoff)
                        await asyncio.sleep(backoff)
                        backoff *= 2
                        continue

                    if response.status_code in (500, 502, 503, 504):
                        logger.warning("NVD API server error (%d). Retrying in %.1f seconds...", response.status_code, backoff)
                        await asyncio.sleep(backoff)
                        backoff *= 2
                        continue

                    response.raise_for_status()

                except (httpx.RequestError, httpx.TimeoutException) as exc:
                    logger.warning("NVD API connection error on attempt %d: %s", attempt, str(exc))
                    if attempt >= max_retries:
                        raise
                    await asyncio.sleep(backoff)
                    backoff *= 2

        raise httpx.HTTPStatusError("Max retries exceeded communicating with NVD API", request=None, response=None)

    @staticmethod
    def parse_nvd_cve_item(item: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize an NVD 2.0 CVE JSON object into structured application fields."""
        cve_data = item.get("cve", {})
        cve_id = cve_data.get("id", "").strip().upper()

        # 1. Descriptions (prefer English)
        descriptions = cve_data.get("descriptions", [])
        desc_text = ""
        for d in descriptions:
            if d.get("lang") == "en":
                desc_text = d.get("value", "")
                break
        if not desc_text and descriptions:
            desc_text = descriptions[0].get("value", "")

        # 2. Dates
        def _parse_dt(val: Optional[str]) -> Optional[datetime]:
            if not val:
                return None
            try:
                # Handle standard ISO8601 with or without Z/offset
                cleaned = val.replace("Z", "+00:00")
                return datetime.fromisoformat(cleaned)
            except Exception:
                return None

        published_at = _parse_dt(cve_data.get("published"))
        last_modified_at = _parse_dt(cve_data.get("lastModified"))

        # 3. CVSS Metrics (prefer v3.1 -> v3.0 -> v2.0)
        metrics = cve_data.get("metrics", {})
        cvss_score: Optional[float] = None
        cvss_version: Optional[str] = None
        cvss_vector: Optional[str] = None
        severity_enum = VulnerabilitySeverity.NONE

        attack_vector = None
        attack_complexity = None
        privileges_required = None
        user_interaction = None
        scope = None
        confidentiality_impact = None
        integrity_impact = None
        availability_impact = None

        if "cvssMetricV31" in metrics and metrics["cvssMetricV31"]:
            m = metrics["cvssMetricV31"][0]
            cvss_data = m.get("cvssData", {})
            cvss_version = "3.1"
            cvss_score = float(cvss_data.get("baseScore", 0.0))
            cvss_vector = cvss_data.get("vectorString")
            sev_str = (cvss_data.get("baseSeverity") or m.get("baseSeverity") or "NONE").upper()
            severity_enum = VulnerabilitySeverity.__members__.get(sev_str, VulnerabilitySeverity.NONE)

            attack_vector = cvss_data.get("attackVector")
            attack_complexity = cvss_data.get("attackComplexity")
            privileges_required = cvss_data.get("privilegesRequired")
            user_interaction = cvss_data.get("userInteraction")
            scope = cvss_data.get("scope")
            confidentiality_impact = cvss_data.get("confidentialityImpact")
            integrity_impact = cvss_data.get("integrityImpact")
            availability_impact = cvss_data.get("availabilityImpact")

        elif "cvssMetricV30" in metrics and metrics["cvssMetricV30"]:
            m = metrics["cvssMetricV30"][0]
            cvss_data = m.get("cvssData", {})
            cvss_version = "3.0"
            cvss_score = float(cvss_data.get("baseScore", 0.0))
            cvss_vector = cvss_data.get("vectorString")
            sev_str = (cvss_data.get("baseSeverity") or m.get("baseSeverity") or "NONE").upper()
            severity_enum = VulnerabilitySeverity.__members__.get(sev_str, VulnerabilitySeverity.NONE)

            attack_vector = cvss_data.get("attackVector")
            attack_complexity = cvss_data.get("attackComplexity")
            privileges_required = cvss_data.get("privilegesRequired")
            user_interaction = cvss_data.get("userInteraction")
            scope = cvss_data.get("scope")
            confidentiality_impact = cvss_data.get("confidentialityImpact")
            integrity_impact = cvss_data.get("integrityImpact")
            availability_impact = cvss_data.get("availabilityImpact")

        elif "cvssMetricV2" in metrics and metrics["cvssMetricV2"]:
            m = metrics["cvssMetricV2"][0]
            cvss_data = m.get("cvssData", {})
            cvss_version = "2.0"
            cvss_score = float(cvss_data.get("baseScore", 0.0))
            cvss_vector = cvss_data.get("vectorString")
            sev_str = (m.get("baseSeverity") or "NONE").upper()
            severity_enum = VulnerabilitySeverity.__members__.get(sev_str, VulnerabilitySeverity.NONE)
            attack_vector = cvss_data.get("accessVector")
            attack_complexity = cvss_data.get("accessComplexity")
            confidentiality_impact = cvss_data.get("confidentialityImpact")
            integrity_impact = cvss_data.get("integrityImpact")
            availability_impact = cvss_data.get("availabilityImpact")

        # 4. Weaknesses / CWEs
        cwes_found = []
        primary_cwe = None
        for w in cve_data.get("weaknesses", []):
            for d in w.get("description", []):
                val = d.get("value", "").strip()
                if val.startswith("CWE-"):
                    cwes_found.append(val)
                    if not primary_cwe and val != "CWE-Other" and val != "CWE-noinfo":
                        primary_cwe = val

        if not primary_cwe and cwes_found:
            primary_cwe = cwes_found[0]

        # 5. References
        references_list = []
        for r in cve_data.get("references", []):
            url = r.get("url")
            if url:
                references_list.append({
                    "url": url,
                    "source": r.get("source"),
                    "tags": r.get("tags", []),
                })

        # 6. Affected CPE Criteria
        cpe_matches: List[Dict[str, Any]] = []
        configurations = cve_data.get("configurations", [])
        for config in configurations:
            for node in config.get("nodes", []):
                for cm in node.get("cpeMatch", []):
                    criteria = cm.get("criteria", "")
                    if criteria.startswith("cpe:2.3:"):
                        cpe_matches.append({
                            "cpe_string": criteria,
                            "vulnerable": cm.get("vulnerable", True),
                            "criteria": criteria,
                            "version_start_including": cm.get("versionStartIncluding"),
                            "version_start_excluding": cm.get("versionStartExcluding"),
                            "version_end_including": cm.get("versionEndIncluding"),
                            "version_end_excluding": cm.get("versionEndExcluding"),
                        })

        # 7. Known Exploited & Exploit Availability
        # Check CISA KEV tags in references or explicit tags
        known_exploited = False
        exploit_available = ExploitAvailability.UNKNOWN
        for ref in references_list:
            tags = [t.lower() for t in ref.get("tags", [])]
            if "exploit" in tags:
                exploit_available = ExploitAvailability.YES
            if "us-cert" in str(ref.get("source", "")).lower() or "cisa" in str(ref.get("url", "")).lower():
                if "known-exploited" in str(ref.get("url", "")).lower():
                    known_exploited = True

        return {
            "cve_id": cve_id,
            "description": desc_text,
            "published_at": published_at,
            "last_modified_at": last_modified_at,
            "source": "NVD",
            "severity": severity_enum,
            "cvss_score": cvss_score,
            "cvss_version": cvss_version,
            "cvss_vector": cvss_vector,
            "attack_vector": attack_vector,
            "attack_complexity": attack_complexity,
            "privileges_required": privileges_required,
            "user_interaction": user_interaction,
            "scope": scope,
            "confidentiality_impact": confidentiality_impact,
            "integrity_impact": integrity_impact,
            "availability_impact": availability_impact,
            "exploit_available": exploit_available,
            "known_exploited": known_exploited,
            "cwe_id": primary_cwe,
            "cwes": cwes_found,
            "references": references_list,
            "cpe_matches": cpe_matches,
            "raw_data": item,
        }


nvd_client = NVDClient()
