"""Unit tests for CPE and Version utility functions."""
import pytest
from app.utils.cpe_utils import (
    build_cpe_23,
    cpe_component_matches,
    cpes_match,
    parse_cpe_23,
    unescape_cpe_component,
)
from app.utils.version_utils import (
    compare_versions,
    is_version_in_range,
    parse_version_safe,
)


# ---------------------------------------------------------------------------
# CPE Parsing and Construction
# ---------------------------------------------------------------------------

def test_parse_valid_cpe_23():
    cpe = "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*"
    parsed = parse_cpe_23(cpe)
    assert parsed is not None
    assert parsed["part"] == "a"
    assert parsed["vendor"] == "apache"
    assert parsed["product"] == "http_server"
    assert parsed["version"] == "2.4.49"
    assert parsed["update"] == "*"


def test_parse_cpe_with_escaped_colons():
    cpe = r"cpe:2.3:a:microsoft:visual_c\+\+:2019:*:*:*:*:*:*:*"
    parsed = parse_cpe_23(cpe)
    assert parsed is not None
    assert parsed["vendor"] == "microsoft"
    assert parsed["product"] == "visual_c++"


def test_parse_invalid_cpe_prefix():
    assert parse_cpe_23("not_a_cpe") is None
    assert parse_cpe_23("") is None
    assert parse_cpe_23(None) is None


def test_build_cpe_23():
    built = build_cpe_23(part="a", vendor="nginx", product="nginx", version="1.24.0")
    assert built == "cpe:2.3:a:nginx:nginx:1.24.0:*:*:*:*:*:*:*"


def test_cpes_match_exact():
    cpe1 = "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*"
    cpe2 = "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*"
    assert cpes_match(cpe1, cpe2, check_version=True) is True


def test_cpes_match_wildcard_version():
    cpe1 = "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*"
    cpe2 = "cpe:2.3:a:apache:http_server:*:*:*:*:*:*:*:*"
    assert cpes_match(cpe1, cpe2, check_version=True) is True


def test_cpes_mismatch_vendor():
    cpe1 = "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*"
    cpe2 = "cpe:2.3:a:nginx:nginx:2.4.49:*:*:*:*:*:*:*"
    assert cpes_match(cpe1, cpe2) is False


# ---------------------------------------------------------------------------
# Version Parsing and Comparison
# ---------------------------------------------------------------------------

def test_compare_versions_semantic():
    assert compare_versions("2.4.49", "2.4.50") == -1
    assert compare_versions("2.4.50", "2.4.49") == 1
    assert compare_versions("2.4.50", "2.4.50") == 0


def test_compare_versions_multi_digit():
    # 2.4.9 < 2.4.10 (proves not naive string comparison)
    assert compare_versions("2.4.9", "2.4.10") == -1
    assert compare_versions("2.4.10", "2.4.9") == 1


def test_compare_versions_with_prefix():
    assert compare_versions("v2.4.49", "2.4.49") == 0
    assert compare_versions("v1.0.0", "v1.0.1") == -1


def test_is_version_in_range_inclusive_and_exclusive():
    # Range: >= 2.4.0, < 2.4.51
    assert is_version_in_range(
        "2.4.49",
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    ) is True

    # Upper boundary test: 2.4.51 should NOT match (< 2.4.51)
    assert is_version_in_range(
        "2.4.51",
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    ) is False

    # Lower boundary test: 2.4.0 SHOULD match (>= 2.4.0)
    assert is_version_in_range(
        "2.4.0",
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    ) is True

    # Below range: 2.3.99 should NOT match
    assert is_version_in_range(
        "2.3.99",
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    ) is False


def test_is_version_in_range_inclusive_upper():
    # Range: <= 1.20.1
    assert is_version_in_range("1.20.1", version_end_including="1.20.1") is True
    assert is_version_in_range("1.20.2", version_end_including="1.20.1") is False
