"""Asset service — all asset CRUD, search, statistics, CSV import/export.

Organization isolation is enforced at every query: assets are always filtered
by the authenticated user's organization_id. Never trust organization_id from
the client payload.
"""
import csv
import io
import uuid
from typing import Any, List, Optional, Tuple

from sqlalchemy import Select, func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import DuplicateResourceError, NotFoundError
from app.models.asset import Asset
from app.models.asset_software import AssetSoftware
from app.models.asset_vulnerability import AssetVulnerability
from app.models.vulnerability import Vulnerability
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetStatus,
    AssetType,
    AuditAction,
    DataClassification,
    ExploitAvailability,
    SoftwareSource,
    VulnerabilitySeverity,
)
from app.models.user import User
from app.schemas.asset import (
    AssetCreate,
    AssetPatch,
    AssetStatisticsResponse,
    AssetUpdate,
    ImportResultResponse,
    ImportRowError,
)
from app.services.audit_service import audit_service
from app.utils.asset_helpers import (
    coerce_bool,
    parse_csv_content,
    sanitize_string,
    validate_csv_headers,
    validate_ip_address,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _apply_filters(
    stmt: Select,
    *,
    asset_type: Optional[AssetType],
    criticality: Optional[AssetCriticality],
    environment: Optional[AssetEnvironment],
    status: Optional[AssetStatus],
    data_classification: Optional[DataClassification],
    internet_exposed: Optional[bool],
) -> Select:
    if asset_type:
        stmt = stmt.where(Asset.asset_type == asset_type)
    if criticality:
        stmt = stmt.where(Asset.criticality == criticality)
    if environment:
        stmt = stmt.where(Asset.environment == environment)
    if status:
        stmt = stmt.where(Asset.status == status)
    if data_classification:
        stmt = stmt.where(Asset.data_classification == data_classification)
    if internet_exposed is not None:
        stmt = stmt.where(Asset.internet_exposed == internet_exposed)
    return stmt


# ---------------------------------------------------------------------------
# AssetService
# ---------------------------------------------------------------------------

class AssetService:

    # ------------------------------------------------------------------
    # Core CRUD
    # ------------------------------------------------------------------

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        asset_id: uuid.UUID,
        organization_id: uuid.UUID,
    ) -> Asset:
        """Fetch a single asset — enforces org isolation."""
        stmt = select(Asset).where(
            Asset.id == asset_id,
            Asset.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        asset = result.scalar_one_or_none()
        if not asset:
            raise NotFoundError(
                message=f"Asset '{asset_id}' was not found in your organization.",
                error_code="ASSET_NOT_FOUND",
            )
        return asset

    @staticmethod
    async def _check_hostname_unique(
        db: AsyncSession,
        organization_id: uuid.UUID,
        hostname: Optional[str],
        exclude_asset_id: Optional[uuid.UUID] = None,
    ) -> None:
        if not hostname:
            return
        stmt = select(Asset).where(
            Asset.organization_id == organization_id,
            Asset.hostname == hostname,
        )
        if exclude_asset_id:
            stmt = stmt.where(Asset.id != exclude_asset_id)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise DuplicateResourceError(
                message=f"An asset with hostname '{hostname}' already exists in your organization.",
                error_code="ASSET_HOSTNAME_DUPLICATE",
            )

    @staticmethod
    async def create(
        db: AsyncSession,
        asset_in: AssetCreate,
        current_user: User,
    ) -> Asset:
        await AssetService._check_hostname_unique(
            db, current_user.organization_id, asset_in.hostname
        )
        asset = Asset(
            id=uuid.uuid4(),
            organization_id=current_user.organization_id,
            **asset_in.model_dump(),
        )
        db.add(asset)
        await db.flush()
        await db.refresh(asset)
        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.ASSET_CREATED,
            resource_type="asset",
            resource_id=str(asset.id),
            metadata={"name": asset.name, "type": asset.asset_type.value},
        )
        return asset

    @staticmethod
    async def update(
        db: AsyncSession,
        asset_id: uuid.UUID,
        asset_in: AssetUpdate,
        current_user: User,
    ) -> Asset:
        asset = await AssetService.get_by_id(db, asset_id, current_user.organization_id)
        await AssetService._check_hostname_unique(
            db, current_user.organization_id, asset_in.hostname, exclude_asset_id=asset_id
        )
        for field, value in asset_in.model_dump().items():
            setattr(asset, field, value)
        await db.flush()
        await db.refresh(asset)
        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.ASSET_UPDATED,
            resource_type="asset",
            resource_id=str(asset.id),
        )
        return asset

    @staticmethod
    async def patch(
        db: AsyncSession,
        asset_id: uuid.UUID,
        asset_in: AssetPatch,
        current_user: User,
    ) -> Asset:
        asset = await AssetService.get_by_id(db, asset_id, current_user.organization_id)
        update_data = asset_in.model_dump(exclude_none=True)
        if "hostname" in update_data:
            await AssetService._check_hostname_unique(
                db, current_user.organization_id, update_data["hostname"], exclude_asset_id=asset_id
            )
        for field, value in update_data.items():
            setattr(asset, field, value)
        await db.flush()
        await db.refresh(asset)
        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.ASSET_UPDATED,
            resource_type="asset",
            resource_id=str(asset.id),
            metadata={"fields": list(update_data.keys())},
        )
        return asset

    @staticmethod
    async def delete(
        db: AsyncSession,
        asset_id: uuid.UUID,
        current_user: User,
    ) -> None:
        asset = await AssetService.get_by_id(db, asset_id, current_user.organization_id)
        asset_name = asset.name
        await db.delete(asset)
        await db.flush()
        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.ASSET_DELETED,
            resource_type="asset",
            resource_id=str(asset_id),
            metadata={"name": asset_name},
        )

    # ------------------------------------------------------------------
    # List & Search
    # ------------------------------------------------------------------

    @staticmethod
    async def list_assets(
        db: AsyncSession,
        organization_id: uuid.UUID,
        *,
        page: int = 1,
        limit: int = 20,
        asset_type: Optional[AssetType] = None,
        criticality: Optional[AssetCriticality] = None,
        environment: Optional[AssetEnvironment] = None,
        status: Optional[AssetStatus] = None,
        data_classification: Optional[DataClassification] = None,
        internet_exposed: Optional[bool] = None,
    ) -> Tuple[List[Asset], int]:
        offset = (page - 1) * limit

        base_stmt = select(Asset).where(Asset.organization_id == organization_id)
        base_stmt = _apply_filters(
            base_stmt,
            asset_type=asset_type,
            criticality=criticality,
            environment=environment,
            status=status,
            data_classification=data_classification,
            internet_exposed=internet_exposed,
        )

        # Count total matching records
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one()

        # Fetch paginated results
        stmt = base_stmt.order_by(Asset.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    @staticmethod
    async def search_assets(
        db: AsyncSession,
        organization_id: uuid.UUID,
        query: str,
        *,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Asset], int]:
        """Full-text substring search across name, hostname, ip_address, description, owner."""
        offset = (page - 1) * limit
        search_term = f"%{query.strip()}%"

        base_stmt = select(Asset).where(
            Asset.organization_id == organization_id,
            or_(
                Asset.name.ilike(search_term),
                Asset.hostname.ilike(search_term),
                Asset.ip_address.ilike(search_term),
                Asset.description.ilike(search_term),
                Asset.owner.ilike(search_term),
            ),
        )

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one()

        stmt = base_stmt.order_by(Asset.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    # ------------------------------------------------------------------
    # Statistics
    # ------------------------------------------------------------------

    @staticmethod
    async def get_statistics(
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> AssetStatisticsResponse:
        base = select(Asset).where(Asset.organization_id == organization_id)

        async def _count(stmt) -> int:
            c = await db.execute(select(func.count()).select_from(stmt.subquery()))
            return c.scalar_one()

        total = await _count(base)
        active = await _count(base.where(Asset.status == AssetStatus.ACTIVE))
        critical = await _count(base.where(Asset.criticality == AssetCriticality.CRITICAL))
        exposed = await _count(base.where(Asset.internet_exposed == True))
        production = await _count(base.where(Asset.environment == AssetEnvironment.PRODUCTION))
        servers = await _count(base.where(Asset.asset_type == AssetType.SERVER))
        databases = await _count(base.where(Asset.asset_type == AssetType.DATABASE))
        network = await _count(base.where(
            Asset.asset_type.in_([AssetType.NETWORK_DEVICE, AssetType.FIREWALL, AssetType.ROUTER, AssetType.SWITCH])
        ))

        # Breakdown by type
        type_result = await db.execute(
            select(Asset.asset_type, func.count()).where(Asset.organization_id == organization_id)
            .group_by(Asset.asset_type)
        )
        by_type = {row[0].value: row[1] for row in type_result.all()}

        # Breakdown by criticality
        crit_result = await db.execute(
            select(Asset.criticality, func.count()).where(Asset.organization_id == organization_id)
            .group_by(Asset.criticality)
        )
        by_criticality = {row[0].value: row[1] for row in crit_result.all()}

        # Breakdown by environment
        env_result = await db.execute(
            select(Asset.environment, func.count()).where(Asset.organization_id == organization_id)
            .group_by(Asset.environment)
        )
        by_environment = {row[0].value: row[1] for row in env_result.all()}

        # Breakdown by status
        status_result = await db.execute(
            select(Asset.status, func.count()).where(Asset.organization_id == organization_id)
            .group_by(Asset.status)
        )
        by_status = {row[0].value: row[1] for row in status_result.all()}

        return AssetStatisticsResponse(
            total_assets=total,
            active_assets=active,
            critical_assets=critical,
            internet_exposed_assets=exposed,
            production_assets=production,
            servers=servers,
            databases=databases,
            network_devices=network,
            by_type=by_type,
            by_criticality=by_criticality,
            by_environment=by_environment,
            by_status=by_status,
        )

    # ------------------------------------------------------------------
    # CSV Import
    # ------------------------------------------------------------------

    @staticmethod
    async def import_csv(
        db: AsyncSession,
        content: bytes,
        current_user: User,
        dry_run: bool = False,
    ) -> ImportResultResponse:
        """Parse and import assets from a CSV file upload.

        Validates each row, rejects invalid records, and returns
        per-row error details without executing uploaded content.
        If dry_run is True, performs full validation without persisting to DB.
        """
        rows, headers = parse_csv_content(content)
        missing_headers = validate_csv_headers(headers)
        if missing_headers:
            raise ValueError(
                f"CSV is missing required headers: {', '.join(missing_headers)}"
            )

        errors: List[ImportRowError] = []
        successful = 0

        for row_num, raw_row in enumerate(rows, start=2):  # Row 1 = headers
            row = {k.strip().lower(): sanitize_string(v) for k, v in raw_row.items() if k}
            row_errors = []

            # Required fields
            name = row.get("name", "")
            if not name:
                row_errors.append(ImportRowError(row=row_num, field="name", message="'name' is required"))

            # Enum validation
            asset_type_val = row.get("asset_type", "")
            try:
                asset_type = AssetType(asset_type_val.upper()) if asset_type_val else None
                if not asset_type:
                    raise ValueError
            except (ValueError, KeyError):
                row_errors.append(ImportRowError(
                    row=row_num, field="asset_type",
                    message=f"Invalid asset_type '{asset_type_val}'. Valid values: {[e.value for e in AssetType]}"
                ))
                asset_type = None

            criticality_val = row.get("criticality", "")
            try:
                criticality = AssetCriticality(criticality_val.upper()) if criticality_val else AssetCriticality.MEDIUM
            except ValueError:
                row_errors.append(ImportRowError(
                    row=row_num, field="criticality",
                    message=f"Invalid criticality '{criticality_val}'. Valid: {[e.value for e in AssetCriticality]}"
                ))
                criticality = None

            environment_val = row.get("environment", "")
            try:
                environment = AssetEnvironment(environment_val.upper()) if environment_val else AssetEnvironment.OTHER
            except ValueError:
                row_errors.append(ImportRowError(
                    row=row_num, field="environment",
                    message=f"Invalid environment '{environment_val}'. Valid: {[e.value for e in AssetEnvironment]}"
                ))
                environment = None

            status_val = row.get("status", "")
            try:
                status = AssetStatus(status_val.upper()) if status_val else AssetStatus.ACTIVE
            except ValueError:
                row_errors.append(ImportRowError(
                    row=row_num, field="status",
                    message=f"Invalid status '{status_val}'"
                ))
                status = None

            # IP validation
            ip = row.get("ip_address") or None
            if ip and not validate_ip_address(ip):
                row_errors.append(ImportRowError(
                    row=row_num, field="ip_address",
                    message=f"'{ip}' is not a valid IP address"
                ))
                ip = None

            # Business value
            business_value = None
            bv_raw = row.get("business_value")
            if bv_raw:
                try:
                    bv = float(bv_raw)
                    if bv < 0:
                        row_errors.append(ImportRowError(
                            row=row_num, field="business_value",
                            message="business_value cannot be negative"
                        ))
                    else:
                        business_value = bv
                except ValueError:
                    row_errors.append(ImportRowError(
                        row=row_num, field="business_value",
                        message=f"'{bv_raw}' is not a valid number"
                    ))

            internet_exposed = coerce_bool(row.get("internet_exposed", "false"))

            if row_errors:
                errors.extend(row_errors)
                continue

            # Skip row if required fields failed validation
            if not all([name, asset_type, criticality, environment, status]):
                continue

            # Check hostname uniqueness
            hostname = row.get("hostname") or None
            if hostname:
                existing = await db.execute(
                    select(Asset).where(
                        Asset.organization_id == current_user.organization_id,
                        Asset.hostname == hostname,
                    )
                )
                if existing.scalar_one_or_none():
                    errors.append(ImportRowError(
                        row=row_num, field="hostname",
                        message=f"An asset with hostname '{hostname}' already exists"
                    ))
                    continue

            if not dry_run:
                asset = Asset(
                    id=uuid.uuid4(),
                    organization_id=current_user.organization_id,
                    name=name,
                    asset_type=asset_type,
                    hostname=hostname,
                    ip_address=ip,
                    operating_system=sanitize_string(row.get("operating_system", "")),
                    os_version=sanitize_string(row.get("os_version", "")),
                    criticality=criticality,
                    environment=environment,
                    status=status,
                    internet_exposed=internet_exposed,
                    business_value=business_value,
                    data_classification=DataClassification.INTERNAL,
                    description=sanitize_string(row.get("description", ""), 2000),
                    location=sanitize_string(row.get("location", "")),
                    owner=sanitize_string(row.get("owner", "")),
                )
                db.add(asset)
            successful += 1

        # Flush all successful rows in one go if not dry run
        if not dry_run and successful > 0:
            await db.flush()
            await audit_service.log(
                db,
                user=current_user,
                action=AuditAction.INVENTORY_IMPORTED,
                resource_type="asset",
                metadata={"total": len(rows), "successful": successful, "failed": len(errors)},
            )

        return ImportResultResponse(
            total_rows=len(rows),
            successful=successful,
            failed=len(errors),
            errors=errors,
        )

    # ------------------------------------------------------------------
    # CSV Export
    # ------------------------------------------------------------------

    @staticmethod
    async def export_csv(
        db: AsyncSession,
        current_user: User,
    ) -> str:
        """Export all organization assets as CSV string."""
        stmt = select(Asset).where(
            Asset.organization_id == current_user.organization_id
        ).order_by(Asset.name)
        result = await db.execute(stmt)
        assets = result.scalars().all()

        output = io.StringIO()
        fieldnames = [
            "name", "asset_type", "hostname", "ip_address", "mac_address",
            "operating_system", "os_version", "environment", "criticality",
            "data_classification", "business_value", "internet_exposed",
            "status", "location", "owner", "description",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for a in assets:
            writer.writerow({
                "name": a.name,
                "asset_type": a.asset_type.value,
                "hostname": a.hostname or "",
                "ip_address": a.ip_address or "",
                "mac_address": a.mac_address or "",
                "operating_system": a.operating_system or "",
                "os_version": a.os_version or "",
                "environment": a.environment.value,
                "criticality": a.criticality.value,
                "data_classification": a.data_classification.value,
                "business_value": str(a.business_value or 0),
                "internet_exposed": str(a.internet_exposed).lower(),
                "status": a.status.value,
                "location": a.location or "",
                "owner": a.owner or "",
                "description": a.description or "",
            })
        return output.getvalue()

    # ------------------------------------------------------------------
    # Asset Vulnerability Operations (Phase 3)
    # ------------------------------------------------------------------

    @staticmethod
    async def list_vulnerabilities(
        db: AsyncSession,
        asset_id: uuid.UUID,
        organization_id: uuid.UUID,
    ) -> List[Any]:
        """List all vulnerabilities associated with a specific asset."""
        # Verify asset ownership
        await AssetService.get_by_id(db, asset_id, organization_id)

        stmt = (
            select(AssetVulnerability)
            .options(
                selectinload(AssetVulnerability.vulnerability),
                selectinload(AssetVulnerability.software),
            )
            .where(AssetVulnerability.asset_id == asset_id)
            .order_by(AssetVulnerability.created_at.desc())
        )
        result = await db.execute(stmt)
        rows = result.scalars().all()

        return [
            {
                "id": av.id,
                "asset_id": av.asset_id,
                "vulnerability_id": av.vulnerability_id,
                "software_id": av.software_id,
                "cve_id": av.vulnerability.cve_id if av.vulnerability else "",
                "description": av.vulnerability.description if av.vulnerability else "",
                "severity": av.vulnerability.severity if av.vulnerability else VulnerabilitySeverity.NONE,
                "cvss_score": av.vulnerability.cvss_score if av.vulnerability else None,
                "cvss_vector": av.vulnerability.cvss_vector if av.vulnerability else None,
                "cwe_id": av.vulnerability.cwe_id if av.vulnerability else None,
                "match_method": av.match_method,
                "match_confidence": av.match_confidence,
                "status": av.status,
                "known_exploited": av.vulnerability.known_exploited if av.vulnerability else False,
                "exploit_available": av.vulnerability.exploit_available if av.vulnerability else ExploitAvailability.UNKNOWN,
                "first_detected_at": av.first_detected_at,
                "last_detected_at": av.last_detected_at,
                "notes": av.notes,
                "software_name": f"{av.software.vendor} {av.software.product_name}" if av.software else None,
                "installed_version": av.software.product_version if av.software else None,
            }
            for av in rows
        ]

    @staticmethod
    async def get_vulnerability(
        db: AsyncSession,
        asset_id: uuid.UUID,
        cve_id: str,
        organization_id: uuid.UUID,
    ) -> Any:
        """Get detail of a specific vulnerability identified on an asset."""
        await AssetService.get_by_id(db, asset_id, organization_id)
        norm_cve = cve_id.strip().upper()

        stmt = (
            select(AssetVulnerability)
            .join(Vulnerability, Vulnerability.id == AssetVulnerability.vulnerability_id)
            .options(
                selectinload(AssetVulnerability.vulnerability),
                selectinload(AssetVulnerability.software),
            )
            .where(
                AssetVulnerability.asset_id == asset_id,
                Vulnerability.cve_id == norm_cve,
            )
        )
        result = await db.execute(stmt)
        av = result.scalar_one_or_none()
        if not av:
            raise NotFoundError(
                message=f"Vulnerability '{norm_cve}' is not recorded for this asset.",
                error_code="ASSET_VULNERABILITY_NOT_FOUND",
            )

        return {
            "id": av.id,
            "asset_id": av.asset_id,
            "vulnerability_id": av.vulnerability_id,
            "software_id": av.software_id,
            "cve_id": av.vulnerability.cve_id if av.vulnerability else norm_cve,
            "description": av.vulnerability.description if av.vulnerability else "",
            "severity": av.vulnerability.severity if av.vulnerability else VulnerabilitySeverity.NONE,
            "cvss_score": av.vulnerability.cvss_score if av.vulnerability else None,
            "cvss_vector": av.vulnerability.cvss_vector if av.vulnerability else None,
            "cwe_id": av.vulnerability.cwe_id if av.vulnerability else None,
            "match_method": av.match_method,
            "match_confidence": av.match_confidence,
            "status": av.status,
            "known_exploited": av.vulnerability.known_exploited if av.vulnerability else False,
            "exploit_available": av.vulnerability.exploit_available if av.vulnerability else ExploitAvailability.UNKNOWN,
            "first_detected_at": av.first_detected_at,
            "last_detected_at": av.last_detected_at,
            "notes": av.notes,
            "software_name": f"{av.software.vendor} {av.software.product_name}" if av.software else None,
            "installed_version": av.software.product_version if av.software else None,
        }

    @staticmethod
    async def patch_vulnerability(
        db: AsyncSession,
        asset_id: uuid.UUID,
        cve_id: str,
        patch_in: Any,
        current_user: User,
    ) -> Any:
        """Update the remediation status or notes of an asset vulnerability."""
        await AssetService.get_by_id(db, asset_id, current_user.organization_id)
        norm_cve = cve_id.strip().upper()

        stmt = (
            select(AssetVulnerability)
            .join(Vulnerability, Vulnerability.id == AssetVulnerability.vulnerability_id)
            .options(
                selectinload(AssetVulnerability.vulnerability),
                selectinload(AssetVulnerability.software),
            )
            .where(
                AssetVulnerability.asset_id == asset_id,
                Vulnerability.cve_id == norm_cve,
            )
        )
        result = await db.execute(stmt)
        av = result.scalar_one_or_none()
        if not av:
            raise NotFoundError(
                message=f"Vulnerability '{norm_cve}' is not recorded for this asset.",
                error_code="ASSET_VULNERABILITY_NOT_FOUND",
            )

        if patch_in.status is not None:
            av.status = patch_in.status
        if patch_in.notes is not None:
            av.notes = patch_in.notes

        await db.flush()
        await db.refresh(av)

        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.ASSET_VULNERABILITY_UPDATED,
            resource_type="asset_vulnerability",
            resource_id=str(av.id),
            metadata={"asset_id": str(asset_id), "cve_id": norm_cve, "status": av.status.value},
        )

        return await AssetService.get_vulnerability(db, asset_id, cve_id, current_user.organization_id)

    @staticmethod
    async def delete_vulnerability(
        db: AsyncSession,
        asset_id: uuid.UUID,
        cve_id: str,
        current_user: User,
    ) -> None:
        """Dismiss or delete an asset vulnerability record."""
        await AssetService.get_by_id(db, asset_id, current_user.organization_id)
        norm_cve = cve_id.strip().upper()

        stmt = (
            select(AssetVulnerability)
            .join(Vulnerability, Vulnerability.id == AssetVulnerability.vulnerability_id)
            .where(
                AssetVulnerability.asset_id == asset_id,
                Vulnerability.cve_id == norm_cve,
            )
        )
        result = await db.execute(stmt)
        av = result.scalar_one_or_none()
        if not av:
            raise NotFoundError(
                message=f"Vulnerability '{norm_cve}' is not recorded for this asset.",
                error_code="ASSET_VULNERABILITY_NOT_FOUND",
            )

        av_id = av.id
        await db.delete(av)
        await db.flush()

        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.ASSET_VULNERABILITY_DELETED,
            resource_type="asset_vulnerability",
            resource_id=str(av_id),
            metadata={"asset_id": str(asset_id), "cve_id": norm_cve},
        )


asset_service = AssetService()

