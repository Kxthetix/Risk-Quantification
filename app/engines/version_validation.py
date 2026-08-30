"""Version validation engine correlating installed software versions against CVE version ranges."""
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass

from app.models.enums import EvidenceResult
from app.models.evidence import Evidence
from app.models.vulnerability import VulnerabilityCPE
from app.utils.version_utils import (
    compare_versions,
    is_version_in_range,
    parse_version_safe,
)


@dataclass
class VersionValidationResult:
    """Outcome of version validation checking."""
    status: str  # "CONFIRMED", "NOT_VULNERABLE", "UNKNOWN"
    confidence: float  # 0.0 to 1.0
    reason: str
    installed_version: Optional[str]
    matched_boundary: Optional[str] = None


class VersionValidationEngine:
    """Evaluates installed asset software version against CVE affected CPE boundaries."""

    @staticmethod
    def evaluate(
        installed_version: Optional[str],
        vulnerability_cpes: List[VulnerabilityCPE],
        version_evidence: Optional[List[Evidence]] = None,
    ) -> VersionValidationResult:
        """Execute version validation logic.

        Args:
            installed_version: The version string from asset software inventory.
            vulnerability_cpes: List of VulnerabilityCPE constraints for this CVE.
            version_evidence: Optional external evidence items of type VERSION or PATCH_STATUS.

        Returns:
            VersionValidationResult containing status, confidence, and explainable reason.
        """
        # 1. Check if evidence overrides or provides version
        effective_version = installed_version
        patch_confirmed = False

        if version_evidence:
            for ev in version_evidence:
                if ev.evidence_type.value == "PATCH_STATUS" and ev.result == EvidenceResult.CONFIRMED:
                    patch_confirmed = True
                elif ev.evidence_type.value == "VERSION" and ev.result == EvidenceResult.CONFIRMED and ev.value:
                    effective_version = ev.value.strip()

        # If a compensating patch has been confirmed
        if patch_confirmed:
            return VersionValidationResult(
                status="NOT_VULNERABLE",
                confidence=0.95,
                reason="Patch status confirmed: asset has received compensating patch for this vulnerability.",
                installed_version=effective_version,
            )

        # 2. Check if installed version is indeterminate
        if not effective_version or effective_version.strip() in ("*", "-", "UNKNOWN", ""):
            return VersionValidationResult(
                status="UNKNOWN",
                confidence=0.30,
                reason="Installed software version is unknown or not specified in inventory.",
                installed_version=effective_version,
            )

        # 3. If there are no CPE version boundaries recorded
        if not vulnerability_cpes:
            return VersionValidationResult(
                status="UNKNOWN",
                confidence=0.50,
                reason=f"Installed version is '{effective_version}', but CVE has no specific CPE version ranges defined.",
                installed_version=effective_version,
            )

        # 4. Evaluate against vulnerability CPE boundaries
        has_applicable_boundaries = False
        any_matched = False
        all_unaffected = True
        matched_rule_desc = ""

        for vcpe in vulnerability_cpes:
            has_range = any([
                vcpe.version_start_including,
                vcpe.version_start_excluding,
                vcpe.version_end_including,
                vcpe.version_end_excluding,
            ])
            if has_range:
                has_applicable_boundaries = True
                in_range = is_version_in_range(
                    effective_version,
                    version_start_including=vcpe.version_start_including,
                    version_start_excluding=vcpe.version_start_excluding,
                    version_end_including=vcpe.version_end_including,
                    version_end_excluding=vcpe.version_end_excluding,
                )
                if in_range:
                    any_matched = True
                    all_unaffected = False
                    # Format human-readable boundary
                    bounds = []
                    if vcpe.version_start_including:
                        bounds.append(f">= {vcpe.version_start_including}")
                    if vcpe.version_start_excluding:
                        bounds.append(f"> {vcpe.version_start_excluding}")
                    if vcpe.version_end_including:
                        bounds.append(f"<= {vcpe.version_end_including}")
                    if vcpe.version_end_excluding:
                        bounds.append(f"< {vcpe.version_end_excluding}")
                    matched_rule_desc = " and ".join(bounds)
                    break
            else:
                # Direct CPE match without range (exact version in CPE or wildcard)
                if vcpe.cpe:
                    cpe_ver = vcpe.cpe.version
                    if cpe_ver and cpe_ver not in ("*", "-"):
                        has_applicable_boundaries = True
                        if compare_versions(effective_version, cpe_ver) == 0:
                            any_matched = True
                            all_unaffected = False
                            matched_rule_desc = f"= {cpe_ver}"
                            break

        if any_matched:
            return VersionValidationResult(
                status="CONFIRMED",
                confidence=0.95,
                reason=f"Installed software version '{effective_version}' is within affected range ({matched_rule_desc}).",
                installed_version=effective_version,
                matched_boundary=matched_rule_desc,
            )

        if has_applicable_boundaries and all_unaffected:
            return VersionValidationResult(
                status="NOT_VULNERABLE",
                confidence=0.90,
                reason=f"Installed software version '{effective_version}' is outside all known affected version boundaries.",
                installed_version=effective_version,
            )

        # Fallback if boundaries are unparseable
        return VersionValidationResult(
            status="UNKNOWN",
            confidence=0.50,
            reason=f"Installed version '{effective_version}' could not be definitively matched against affected ranges.",
            installed_version=effective_version,
        )
