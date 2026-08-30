"""Service for managing configurable validation scoring rules and weights."""
from typing import Dict, List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.user import User
from app.models.validation_rule import ValidationRule
from app.schemas.validation import ValidationRuleUpdate


DEFAULT_RULES_DATA = [
    {
        "rule_id": "VERSION_MATCH",
        "name": "Version Boundary Match",
        "description": "Weight applied when installed version falls within vulnerable CPE boundaries.",
        "evidence_type": "VERSION",
        "weight": 40.0,
        "enabled": True,
    },
    {
        "rule_id": "CONFIGURATION_MATCH",
        "name": "Vulnerable Configuration Active",
        "description": "Weight applied when prerequisite features, modules, or directives are confirmed active.",
        "evidence_type": "CONFIGURATION",
        "weight": 25.0,
        "enabled": True,
    },
    {
        "rule_id": "ACTIVE_SERVICE",
        "name": "Target Service Active",
        "description": "Weight applied when affected daemon or network service is verified running.",
        "evidence_type": "SERVICE",
        "weight": 15.0,
        "enabled": True,
    },
    {
        "rule_id": "INTERNET_EXPOSURE",
        "name": "Internet Exposure",
        "description": "Weight applied when the host or affected port is exposed to the public Internet.",
        "evidence_type": "NETWORK_EXPOSURE",
        "weight": 10.0,
        "enabled": True,
    },
    {
        "rule_id": "KNOWN_EXPLOIT",
        "name": "Known Exploitation / KEV",
        "description": "Weight applied when active weaponization or CISA KEV listing is confirmed.",
        "evidence_type": "EXPLOIT",
        "weight": 10.0,
        "enabled": True,
    },
    {
        "rule_id": "MITIGATION_PRESENT",
        "name": "Mitigating Security Control",
        "description": "Score deduction applied when an effective compensating control (e.g. WAF, IPS) is active.",
        "evidence_type": "SECURITY_CONTROL",
        "weight": -25.0,
        "enabled": True,
    },
]


class ValidationRuleService:
    """Manages configurable validation rules and organization overrides."""

    @staticmethod
    async def get_effective_rules(
        db: AsyncSession,
        organization_id: Optional[uuid.UUID] = None,
    ) -> List[ValidationRule]:
        """Fetch all effective rules (organization overrides take precedence over global defaults)."""
        # Query global rules (organization_id is None) and org-specific rules
        query = select(ValidationRule)
        if organization_id:
            query = query.where(
                (ValidationRule.organization_id == organization_id)
                | (ValidationRule.organization_id.is_(None))
            )
        else:
            query = query.where(ValidationRule.organization_id.is_(None))

        res = await db.execute(query)
        all_rules = list(res.scalars().all())

        # If database has no rules at all, auto-seed defaults
        if not all_rules:
            for item in DEFAULT_RULES_DATA:
                r = ValidationRule(
                    id=uuid.uuid4(),
                    rule_id=item["rule_id"],
                    name=item["name"],
                    description=item["description"],
                    evidence_type=item["evidence_type"],
                    weight=item["weight"],
                    enabled=item["enabled"],
                    organization_id=None,
                )
                db.add(r)
            await db.commit()
            res = await db.execute(query)
            all_rules = list(res.scalars().all())

        # Organize by rule_id with org override precedence
        rule_map: Dict[str, ValidationRule] = {}
        for r in all_rules:
            if r.organization_id is None:
                if r.rule_id not in rule_map:
                    rule_map[r.rule_id] = r
            else:
                rule_map[r.rule_id] = r  # Org override wins

        return list(rule_map.values())

    @staticmethod
    async def update_rule(
        db: AsyncSession,
        rule_id: str,
        payload: ValidationRuleUpdate,
        current_user: User,
    ) -> ValidationRule:
        """Update or create an organization-specific rule override."""
        org_id = current_user.organization_id

        # Check if org-specific rule exists
        res = await db.execute(
            select(ValidationRule).where(
                ValidationRule.rule_id == rule_id,
                ValidationRule.organization_id == org_id,
            )
        )
        rule = res.scalar_one_or_none()

        if not rule:
            # Look up global rule template
            global_res = await db.execute(
                select(ValidationRule).where(
                    ValidationRule.rule_id == rule_id,
                    ValidationRule.organization_id.is_(None),
                )
            )
            template = global_res.scalar_one_or_none()
            if not template:
                raise NotFoundError(
                    message=f"Validation rule '{rule_id}' not found.",
                    error_code="RULE_NOT_FOUND",
                )
            # Fork global template into org override
            rule = ValidationRule(
                id=uuid.uuid4(),
                rule_id=template.rule_id,
                name=template.name,
                description=template.description,
                evidence_type=template.evidence_type,
                weight=payload.weight if payload.weight is not None else template.weight,
                enabled=payload.enabled if payload.enabled is not None else template.enabled,
                organization_id=org_id,
            )
            db.add(rule)
        else:
            if payload.weight is not None:
                rule.weight = payload.weight
            if payload.enabled is not None:
                rule.enabled = payload.enabled

        await db.commit()
        await db.refresh(rule)
        return rule


validation_rule_service = ValidationRuleService()
