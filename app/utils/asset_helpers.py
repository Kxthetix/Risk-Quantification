"""Utility helpers for asset validation, CPE parsing, and IP address normalization."""
import csv
import ipaddress
import re
from io import StringIO
from typing import Any

# Max CSV upload size: 10 MB
MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024

# Required CSV column headers for asset import
REQUIRED_CSV_HEADERS = {"name", "asset_type", "criticality", "environment"}

# CPE 2.3 pattern: cpe:2.3:<part>:<vendor>:<product>:<version>:<update>:<edition>:<language>:<sw_edition>:<target_sw>:<target_hw>:<other>
_CPE_PATTERN = re.compile(
    r"^cpe:2\.3:[aho\*\-](:[^:]*){10}$",
    re.IGNORECASE,
)


def validate_cpe(cpe: str) -> bool:
    """Validate that a CPE string follows the CPE 2.3 format.

    Full CPE matching is deferred to Phase 3 (NVD/CVE integration).
    This validation only checks structural format.
    """
    if not cpe:
        return False
    return bool(_CPE_PATTERN.match(cpe.strip()))


def normalize_cpe(cpe: str) -> str:
    """Normalize a CPE string to lowercase with stripped whitespace."""
    return cpe.strip().lower() if cpe else ""


def validate_ip_address(ip: str) -> bool:
    """Validate that a string is a valid IPv4 or IPv6 address."""
    if not ip:
        return True  # IP is optional
    try:
        ipaddress.ip_address(ip.strip())
        return True
    except ValueError:
        return False


def validate_mac_address(mac: str) -> bool:
    """Validate MAC address format (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)."""
    if not mac:
        return True  # MAC is optional
    mac_pattern = re.compile(
        r"^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$"
    )
    return bool(mac_pattern.match(mac.strip()))


def parse_csv_content(content: bytes) -> tuple[list[dict[str, str]], list[str]]:
    """Parse raw CSV bytes into rows and extract headers.

    Returns:
        (rows, headers) tuple. Rows are list of dicts.
    Raises:
        ValueError for malformed CSV or oversized uploads.
    """
    if len(content) > MAX_CSV_SIZE_BYTES:
        raise ValueError(
            f"CSV file exceeds maximum allowed size of {MAX_CSV_SIZE_BYTES // 1024 // 1024} MB."
        )

    try:
        text = content.decode("utf-8", errors="replace")
    except Exception:
        raise ValueError("Could not decode CSV file. Ensure it is UTF-8 encoded.")

    reader = csv.DictReader(StringIO(text))
    headers = reader.fieldnames or []
    rows = list(reader)
    return rows, list(headers)


def validate_csv_headers(headers: list[str]) -> list[str]:
    """Check required headers are present. Returns list of missing headers."""
    header_set = {h.strip().lower() for h in headers}
    return [
        req for req in REQUIRED_CSV_HEADERS
        if req.lower() not in header_set
    ]


def coerce_bool(value: Any) -> bool:
    """Coerce common truthy string representations to Python bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("true", "1", "yes", "y")
    return bool(value)


def sanitize_string(value: str, max_length: int = 255) -> str:
    """Strip dangerous characters and truncate to max_length."""
    if not value:
        return ""
    # Remove null bytes and control characters
    sanitized = re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]", "", str(value))
    return sanitized.strip()[:max_length]
