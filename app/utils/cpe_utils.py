"""CPE (Common Platform Enumeration) 2.3 parsing, normalization, and comparison utilities."""
import re
from typing import Any, Dict, Optional

# CPE 2.3 prefix
CPE_23_PREFIX = "cpe:2.3:"

# Regex to match any backslash-escaped character
_UNESCAPE_PATTERN = re.compile(r"\\(.)")


def unescape_cpe_component(component: str) -> str:
    """Unescape special characters in CPE components."""
    if not component:
        return ""
    return _UNESCAPE_PATTERN.sub(r"\1", component)


def parse_cpe_23(cpe_string: str) -> Optional[Dict[str, str]]:
    """Parse a CPE 2.3 formatted string into its constituent attributes.

    Format: cpe:2.3:part:vendor:product:version:update:edition:language:sw_edition:target_sw:target_hw:other
    """
    if not cpe_string or not cpe_string.startswith(CPE_23_PREFIX):
        return None

    # Strip prefix
    remainder = cpe_string[len(CPE_23_PREFIX):]

    # Split by colon, taking care of escaped colons
    parts = []
    current = []
    escaped = False

    for char in remainder:
        if escaped:
            current.append(char)
            escaped = False
        elif char == "\\":
            current.append(char)
            escaped = True
        elif char == ":":
            parts.append("".join(current))
            current = []
        else:
            current.append(char)
    parts.append("".join(current))

    # CPE 2.3 requires 11 attributes
    if len(parts) < 11:
        # Pad with wildcards if incomplete
        parts.extend(["*"] * (11 - len(parts)))
    elif len(parts) > 11:
        # Truncate or merge excess
        parts = parts[:11]

    keys = [
        "part",
        "vendor",
        "product",
        "version",
        "update",
        "edition",
        "language",
        "sw_edition",
        "target_sw",
        "target_hw",
        "other",
    ]

    result = {}
    for k, v in zip(keys, parts):
        val = unescape_cpe_component(v.strip().lower())
        result[k] = val if val else "*"

    return result


def build_cpe_23(
    part: str = "a",
    vendor: str = "*",
    product: str = "*",
    version: str = "*",
    update: str = "*",
    edition: str = "*",
    language: str = "*",
    sw_edition: str = "*",
    target_sw: str = "*",
    target_hw: str = "*",
    other: str = "*",
) -> str:
    """Construct a canonical CPE 2.3 string from attributes."""
    components = [
        part.strip().lower() or "a",
        vendor.strip().lower() or "*",
        product.strip().lower() or "*",
        version.strip().lower() or "*",
        update.strip().lower() or "*",
        edition.strip().lower() or "*",
        language.strip().lower() or "*",
        sw_edition.strip().lower() or "*",
        target_sw.strip().lower() or "*",
        target_hw.strip().lower() or "*",
        other.strip().lower() or "*",
    ]
    return f"{CPE_23_PREFIX}{':'.join(components)}"


def cpe_component_matches(target: str, source: str) -> bool:
    """Check if target CPE attribute matches source (supporting wildcards '*' and '-')."""
    t = target.strip().lower() if target else "*"
    s = source.strip().lower() if source else "*"

    if t in ("*", "-") or s in ("*", "-"):
        return True
    return t == s


def cpes_match(cpe_a: str, cpe_b: str, check_version: bool = True) -> bool:
    """Check whether two CPE strings match according to CPE 2.3 matching specification."""
    parsed_a = parse_cpe_23(cpe_a)
    parsed_b = parse_cpe_23(cpe_b)

    if not parsed_a or not parsed_b:
        return False

    # Check part
    if not cpe_component_matches(parsed_a["part"], parsed_b["part"]):
        return False

    # Check vendor & product
    if not cpe_component_matches(parsed_a["vendor"], parsed_b["vendor"]):
        return False
    if not cpe_component_matches(parsed_a["product"], parsed_b["product"]):
        return False

    if check_version:
        if not cpe_component_matches(parsed_a["version"], parsed_b["version"]):
            return False

    return True
