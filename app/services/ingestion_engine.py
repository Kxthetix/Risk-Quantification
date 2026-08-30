"""Unified Ingestion, Normalization, Deduplication & Correlation Engine (Phase 13).

Authoritative backend service responsible for importing telemetry and records
from external systems (SIEM, EDR, Scanners, IAM, Cloud, Threat Intel, Ticketing,
Webhooks, and CSV/Excel uploads) without allowing external systems to directly
manipulate platform risk scores.
"""
import hashlib
import hmac
import ipaddress
import json
import logging
import re
import socket
import time
import urllib.parse
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.vulnerability import Vulnerability
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetStatus,
    AssetType,
    AssetVulnerabilityStatus,
    VulnerabilitySeverity,
)
from app.models.integration import Integration
from app.models.integration_log import IntegrationLog

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. SSRF Protection Helper
# ---------------------------------------------------------------------------
def validate_outbound_url(url_str: str, allow_private: bool = True) -> Tuple[bool, Optional[str]]:
    """Validate endpoint URL to prevent SSRF and protocol manipulation."""
    if not url_str:
        return False, "URL cannot be empty"

    try:
        parsed = urllib.parse.urlparse(url_str)
        if parsed.scheme not in ("http", "https"):
            return False, f"Unsupported scheme: {parsed.scheme}. Only HTTP and HTTPS are permitted."

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL host"

        if not allow_private:
            # Check for localhost / loopback / metadata endpoints
            if hostname.lower() in ("localhost", "127.0.0.1", "::1", "169.254.169.254"):
                return False, f"Host {hostname} is forbidden (private network protection)."

            try:
                ip_obj = ipaddress.ip_address(hostname)
                if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                    return False, f"IP address {hostname} is a restricted private address."
            except ValueError:
                pass  # Hostname, not direct IP

        return True, None
    except Exception as e:
        return False, f"URL parse error: {str(e)}"


# ---------------------------------------------------------------------------
# 2. Canonical Normalization Helpers
# ---------------------------------------------------------------------------
SEVERITY_MAP: Dict[str, VulnerabilitySeverity] = {
    "CRITICAL": VulnerabilitySeverity.CRITICAL,
    "SEVERE": VulnerabilitySeverity.CRITICAL,
    "HIGH": VulnerabilitySeverity.HIGH,
    "MEDIUM": VulnerabilitySeverity.MEDIUM,
    "MODERATE": VulnerabilitySeverity.MEDIUM,
    "LOW": VulnerabilitySeverity.LOW,
    "INFO": VulnerabilitySeverity.LOW,
    "INFORMATIONAL": VulnerabilitySeverity.LOW,
}

CRITICALITY_MAP: Dict[str, AssetCriticality] = {
    "CRITICAL": AssetCriticality.CRITICAL,
    "HIGH": AssetCriticality.HIGH,
    "MEDIUM": AssetCriticality.MEDIUM,
    "LOW": AssetCriticality.LOW,
}


def normalize_severity(val: Optional[str]) -> VulnerabilitySeverity:
    if not val:
        return VulnerabilitySeverity.MEDIUM
    return SEVERITY_MAP.get(val.strip().upper(), VulnerabilitySeverity.MEDIUM)


def normalize_criticality(val: Optional[str]) -> AssetCriticality:
    if not val:
        return AssetCriticality.MEDIUM
    return CRITICALITY_MAP.get(val.strip().upper(), AssetCriticality.MEDIUM)


def normalize_asset_type(val: Optional[str]) -> AssetType:
    if not val:
        return AssetType.SERVER
    cleaned = val.strip().upper().replace(" ", "_")
    for at in AssetType:
        if at.value == cleaned:
            return at
    return AssetType.SERVER


def normalize_environment(val: Optional[str]) -> AssetEnvironment:
    if not val:
        return AssetEnvironment.PRODUCTION
    cleaned = val.strip().upper()
    for env in AssetEnvironment:
        if env.value == cleaned:
            return env
    return AssetEnvironment.PRODUCTION


# ---------------------------------------------------------------------------
# 3. Ingestion & Correlation Service
# ---------------------------------------------------------------------------
class IngestionEngine:
    """Core synchronization and canonical data ingestion engine."""

    @staticmethod
    async def correlate_and_upsert_asset(
        db: AsyncSession,
        organization_id: uuid.UUID,
        raw_record: Dict[str, Any],
        source_name: str,
    ) -> Tuple[Asset, bool]:
        """Correlate an external host record with existing assets or create a new one."""
        name = raw_record.get("name") or raw_record.get("hostname") or raw_record.get("host") or f"Asset-{uuid.uuid4().hex[:6]}"
        ip_address = raw_record.get("ip_address") or raw_record.get("ip")
        mac_address = raw_record.get("mac_address") or raw_record.get("mac")

        # 1. Search for matching asset by (Organization, IP) or (Organization, Name)
        query = select(Asset).where(Asset.organization_id == organization_id)
        if ip_address:
            query = query.where(or_(Asset.name == name, Asset.ip_address == ip_address))
        else:
            query = query.where(Asset.name == name)

        result = await db.execute(query)
        existing_asset = result.scalars().first()

        if existing_asset:
            # Update existing asset metadata without overwriting critical admin configs
            if ip_address:
                existing_asset.ip_address = ip_address
            if raw_record.get("operating_system") or raw_record.get("os"):
                existing_asset.operating_system = raw_record.get("operating_system") or raw_record.get("os")
            existing_asset.updated_at = datetime.now(timezone.utc)
            return existing_asset, False

        # 2. Create new asset
        new_asset = Asset(
            organization_id=organization_id,
            name=name,
            asset_type=normalize_asset_type(raw_record.get("asset_type") or raw_record.get("type")),
            environment=normalize_environment(raw_record.get("environment") or raw_record.get("env")),
            criticality=normalize_criticality(raw_record.get("criticality") or raw_record.get("priority")),
            status=AssetStatus.ACTIVE,
            ip_address=ip_address,
            operating_system=raw_record.get("operating_system") or raw_record.get("os"),
            description=f"Imported from {source_name}",
        )
        db.add(new_asset)
        await db.flush()
        return new_asset, True

    @staticmethod
    async def correlate_and_upsert_vulnerability(
        db: AsyncSession,
        asset: Asset,
        raw_vuln: Dict[str, Any],
        source_name: str,
    ) -> Tuple[Optional[AssetVulnerability], bool]:
        """Correlate CVE/vulnerability record to an asset, ensuring deduplication."""
        cve_id = raw_vuln.get("cve_id") or raw_vuln.get("cve") or raw_vuln.get("id")
        if not cve_id:
            cve_id = f"VULN-{hashlib.sha256(json.dumps(raw_vuln, sort_keys=True).encode()).hexdigest()[:8].upper()}"

        title = raw_vuln.get("title") or raw_vuln.get("name") or cve_id
        severity = normalize_severity(raw_vuln.get("severity"))
        cvss_score = float(raw_vuln.get("cvss_score") or raw_vuln.get("cvss") or 5.0)

        # 1. Look up or create global Vulnerability catalog item
        v_query = select(Vulnerability).where(Vulnerability.cve_id == cve_id)
        v_res = await db.execute(v_query)
        vuln = v_res.scalars().first()

        if not vuln:
            vuln = Vulnerability(
                cve_id=cve_id,
                description=raw_vuln.get("description") or f"Imported vulnerability {cve_id} from {source_name}",
                source=source_name,
                severity=severity,
                cvss_score=cvss_score,
            )
            db.add(vuln)
            await db.flush()

        # 2. Check if already linked to this asset
        av_query = select(AssetVulnerability).where(
            AssetVulnerability.asset_id == asset.id,
            AssetVulnerability.vulnerability_id == vuln.id,
        )
        av_res = await db.execute(av_query)
        existing_av = av_res.scalars().first()

        if existing_av:
            existing_av.last_detected_at = datetime.now(timezone.utc)
            return existing_av, False

        # Link to asset
        new_av = AssetVulnerability(
            asset_id=asset.id,
            vulnerability_id=vuln.id,
            status=AssetVulnerabilityStatus.OPEN,
            notes=f"Imported via {source_name}",
        )
        db.add(new_av)
        await db.flush()
        return new_av, True

    @staticmethod
    async def process_sync_batch(
        db: AsyncSession,
        integration: Integration,
        records: List[Dict[str, Any]],
        sync_mode: str = "INCREMENTAL",
    ) -> IntegrationLog:
        """Process a normalized batch of incoming records for an integration."""
        start_time = time.time()
        received = len(records)
        accepted = 0
        rejected = 0
        created = 0
        updated = 0

        for r in records:
            try:
                # Apply custom field transformations if defined
                transformed = dict(r)
                if integration.field_mappings:
                    for ext_k, int_k in integration.field_mappings.items():
                        if ext_k in r:
                            transformed[int_k] = r[ext_k]

                # Ingest as Asset and/or Vulnerability
                asset, is_new_asset = await IngestionEngine.correlate_and_upsert_asset(
                    db,
                    integration.organization_id,
                    transformed,
                    integration.name,
                )
                if is_new_asset:
                    created += 1
                else:
                    updated += 1
                accepted += 1

                # If record contains vulnerabilities array, link them
                vulns = transformed.get("vulnerabilities") or []
                for v in vulns:
                    _, is_new_vuln = await IngestionEngine.correlate_and_upsert_vulnerability(
                        db,
                        asset,
                        v,
                        integration.name,
                    )
                    if is_new_vuln:
                        created += 1
            except Exception as e:
                logger.error(f"Error processing record in integration {integration.id}: {e}")
                rejected += 1

        duration_ms = round((time.time() - start_time) * 1000, 2)
        status = "SUCCESS" if rejected == 0 else ("PARTIAL" if accepted > 0 else "FAILED")

        # Update integration status & timestamps
        integration.last_sync_at = datetime.now(timezone.utc)
        integration.last_sync_status = status
        integration.status = "CONNECTED" if status in ("SUCCESS", "PARTIAL") else "FAILED"
        if rejected > 0:
            integration.last_error = f"{rejected} of {received} records rejected during sync."
        else:
            integration.last_error = None

        # Create immutable log record
        log = IntegrationLog(
            organization_id=integration.organization_id,
            integration_id=integration.id,
            operation="SYNC" if sync_mode == "INCREMENTAL" else "FULL_SYNC",
            status=status,
            records_received=received,
            records_accepted=accepted,
            records_rejected=rejected,
            records_updated=updated,
            records_created=created,
            duration_ms=duration_ms,
            error_message=integration.last_error,
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    @staticmethod
    def verify_webhook_signature(payload_bytes: bytes, secret: str, received_signature: str) -> bool:
        """Verify HMAC-SHA256 signature on inbound webhooks."""
        if not secret or not received_signature:
            return False
        expected_sig = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
        # Support both raw hex and sha256=hex format
        cleaned_rec = received_signature.replace("sha256=", "").strip()
        return hmac.compare_digest(expected_sig.lower(), cleaned_rec.lower())
