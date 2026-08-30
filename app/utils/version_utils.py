"""Safe semantic and package version comparison utilities for vulnerability matching."""
import re
from typing import Optional
from packaging.version import InvalidVersion, Version


def _clean_version_str(ver: str) -> str:
    """Normalize version string by removing leading/trailing punctuation or prefixes like 'v'."""
    if not ver:
        return ""
    v = ver.strip()
    # Remove leading 'v' or 'v.'
    v = re.sub(r"^[vV]\.?", "", v)
    # Remove git commit hash suffixes like +git... or -g...
    v = re.split(r"[\+\~]", v)[0]
    return v.strip()


def parse_version_safe(ver: str) -> Optional[Version]:
    """Safely parse a version string into a packaging.version.Version object.

    Handles non-standard versions by stripping illegal characters or falling back.
    """
    if not ver or ver in ("*", "-"):
        return None

    cleaned = _clean_version_str(ver)
    try:
        return Version(cleaned)
    except InvalidVersion:
        # Try extracting just numbers and dots (e.g. 2.4.49p1 -> 2.4.49.1)
        match = re.match(r"^(\d+(?:\.\d+)*)", cleaned)
        if match:
            try:
                return Version(match.group(1))
            except InvalidVersion:
                pass
    return None


def compare_versions(ver1: str, ver2: str) -> int:
    """Compare two version strings.

    Returns:
      -1 if ver1 < ver2
       0 if ver1 == ver2
       1 if ver1 > ver2
    """
    pv1 = parse_version_safe(ver1)
    pv2 = parse_version_safe(ver2)

    if pv1 and pv2:
        if pv1 < pv2:
            return -1
        if pv1 > pv2:
            return 1
        return 0

    # Fallback: cleaned string comparison
    c1 = _clean_version_str(ver1)
    c2 = _clean_version_str(ver2)
    if c1 < c2:
        return -1
    if c1 > c2:
        return 1
    return 0


def is_version_in_range(
    installed_version: str,
    version_start_including: Optional[str] = None,
    version_start_excluding: Optional[str] = None,
    version_end_including: Optional[str] = None,
    version_end_excluding: Optional[str] = None,
) -> bool:
    """Check if an installed software version satisfies a vulnerability's version range boundaries.

    All boundary conditions must be satisfied if present.
    """
    if not installed_version or installed_version in ("*", "-"):
        return True  # If installed version is unknown/wildcard, consider potentially affected

    # Check lower boundary (inclusive)
    if version_start_including and version_start_including not in ("*", "-"):
        if compare_versions(installed_version, version_start_including) < 0:
            return False

    # Check lower boundary (exclusive)
    if version_start_excluding and version_start_excluding not in ("*", "-"):
        if compare_versions(installed_version, version_start_excluding) <= 0:
            return False

    # Check upper boundary (inclusive)
    if version_end_including and version_end_including not in ("*", "-"):
        if compare_versions(installed_version, version_end_including) > 0:
            return False

    # Check upper boundary (exclusive)
    if version_end_excluding and version_end_excluding not in ("*", "-"):
        if compare_versions(installed_version, version_end_excluding) >= 0:
            return False

    return True
