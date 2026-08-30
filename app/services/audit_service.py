"""Audit logging service — records security-relevant actions for compliance."""
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.enums import AuditAction
from app.models.user import User


class AuditService:
    @staticmethod
    async def log(
        db: AsyncSession,
        *,
        user: User,
        action: AuditAction,
        resource_type: str,
        resource_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Persist an audit log entry.

        Never pass passwords, tokens, or credential fields in metadata.
        """
        entry = AuditLog(
            id=uuid.uuid4(),
            organization_id=user.organization_id,
            user_id=user.id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=metadata,
        )
        db.add(entry)
        # Do not flush here — the calling transaction controls the commit boundary


audit_service = AuditService()
