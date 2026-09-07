"""
crosswalk.py — maps risk objects onto the five frameworks and emits the JSON the
React app and the report generators both consume.

Three distinct mappings live here, because "map risk metrics to frameworks" means three
different things to three different audiences:

1. VULN_CLASSES     a finding (identified by CWE, with a keyword fallback) → the controls
                    whose failure the finding evidences. This is what an auditor wants:
                    "which of my controls is this CVE telling me is not working?"
2. MITIGATION_CLASSES a candidate security investment → the controls it would satisfy.
                    This is what a CISO wants when justifying spend.
3. RISK_METRIC_MAP  a platform metric (expected annual loss, exploitation probability,
                    residual risk, control coverage) → the specific framework obligation
                    that metric evidences. This is what a regulatory filing needs.

Emit with:  python3 frameworks/crosswalk.py
Output:     public/frameworks/crosswalk.json
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from catalog import ASSIGNED, FRAMEWORKS, INFERRED, VERIFIED  # noqa: F401

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "public" / "frameworks" / "crosswalk.json"

# Controls that every exploitable technical vulnerability implicates, regardless of class.
BASELINE = {
    "iso27001": ["A.8.8"],
    "nistcsf": ["ID.RA-01", "ID.RA-05"],
    "cis": ["7.1", "7.5", "7.7"],
    "rbi": ["RBI-A1-07"],
    "sebi": ["SEBI-ID-05", "SEBI-PR-04"],
}


def _vc(key, label, cwes, keywords, iso, csf, cis, rbi, sebi, rationale):
    """Build one vulnerability-class entry, folding in the baseline controls."""
    def merge(specific: list[str], fid: str) -> list[str]:
        return sorted(set(specific) | set(BASELINE[fid]), key=_sort_key)
    return {
        "key": key,
        "label": label,
        "cwes": cwes,
        "keywords": keywords,
        "rationale": rationale,
        "controls": {
            "iso27001": merge(iso, "iso27001"),
            "nistcsf": merge(csf, "nistcsf"),
            "cis": merge(cis, "cis"),
            "rbi": merge(rbi, "rbi"),
            "sebi": merge(sebi, "sebi"),
        },
    }


def _sort_key(cid: str):
    """Sort control ids so 7.2 precedes 7.10 and A.8.8 precedes A.8.32."""
    return [int(p) if p.isdigit() else p for p in re.split(r"[.\-]", cid)]


VULN_CLASSES = [
    _vc(
        "rce_injection", "Remote code execution / command injection",
        ["CWE-94", "CWE-95", "CWE-77", "CWE-78", "CWE-917", "CWE-1336"],
        ["remote code execution", "command injection", "rce", "code injection",
         "template injection", "expression language"],
        ["A.8.26", "A.8.28", "A.8.20", "A.8.7"],
        ["PR.PS-02", "PR.PS-06", "PR.IR-01", "DE.CM-09"],
        ["4.8", "10.5", "16.12", "13.10"],
        ["RBI-A1-06", "RBI-A1-04", "RBI-A1-12"],
        ["SEBI-PR-06", "SEBI-PR-03", "SEBI-DE-03"],
        "Unauthenticated code execution defeats application input validation and network "
        "containment simultaneously, so it is evidence against secure-development, "
        "network-protection and malware-defence controls at once.",
    ),
    _vc(
        "deserialization", "Untrusted deserialization",
        ["CWE-502"],
        ["deserialization", "deserialisation", "unmarshal", "openwire", "pickle",
         "objectinputstream"],
        ["A.8.26", "A.8.28", "A.8.25"],
        ["PR.PS-02", "PR.PS-06"],
        ["16.11", "16.12", "16.5"],
        ["RBI-A1-06", "RBI-A1-07"],
        ["SEBI-PR-06", "SEBI-ID-03"],
        "Deserialization flaws almost always arrive through a third-party component, so "
        "they implicate component inventory and SBOM obligations as much as coding practice.",
    ),
]

VULN_CLASSES += [
    _vc(
        "sql_injection", "SQL / NoSQL injection",
        ["CWE-89", "CWE-564", "CWE-943"],
        ["sql injection", "sqli", "nosql injection", "blind sql"],
        ["A.8.26", "A.8.28", "A.8.3", "A.8.11"],
        ["PR.PS-06", "PR.DS-01", "DE.CM-09"],
        ["16.12", "3.3", "3.14", "13.10"],
        ["RBI-A1-06", "RBI-A1-15"],
        ["SEBI-PR-06", "SEBI-DE-02"],
        "Injection into a datastore is both an application-security failure and a "
        "data-access-control failure, and the audit trail is what proves scope of exposure.",
    ),
    _vc(
        "path_traversal_upload", "Path traversal / unrestricted file upload",
        ["CWE-22", "CWE-23", "CWE-36", "CWE-434", "CWE-73"],
        ["path traversal", "directory traversal", "file upload", "arbitrary file write",
         "zip slip"],
        ["A.8.26", "A.8.28", "A.8.3", "A.8.7"],
        ["PR.PS-06", "PR.PS-05", "PR.DS-01"],
        ["16.12", "2.3", "10.1", "3.3"],
        ["RBI-A1-06", "RBI-A1-02"],
        ["SEBI-PR-06", "SEBI-PR-01"],
        "Writing attacker-chosen files into a web root is the standard route to placing a "
        "web shell, which is why unauthorised-software controls appear here.",
    ),
    _vc(
        "auth_bypass", "Authentication bypass / missing authentication",
        ["CWE-287", "CWE-288", "CWE-290", "CWE-294", "CWE-306", "CWE-304", "CWE-1390"],
        ["authentication bypass", "auth bypass", "missing authentication",
         "improper authentication", "unauthenticated access", "jwt spoof"],
        ["A.8.5", "A.5.16", "A.5.17", "A.5.15"],
        ["PR.AA-01", "PR.AA-02", "PR.AA-03"],
        ["6.3", "6.4", "6.5", "5.2"],
        ["RBI-A1-08", "RBI-A1-09"],
        ["SEBI-PR-01", "SEBI-PR-02"],
        "An authentication bypass is direct evidence that the authentication control "
        "objective is unmet, which is why multi-factor safeguards dominate the mapping.",
    ),
    _vc(
        "authz_broken_access", "Broken access control / missing authorization",
        ["CWE-862", "CWE-863", "CWE-639", "CWE-284", "CWE-732"],
        ["broken access control", "missing authorization", "improper authorization",
         "idor", "insecure direct object", "acl bypass"],
        ["A.5.15", "A.5.18", "A.8.3", "A.8.2"],
        ["PR.AA-05", "PR.DS-01", "DE.CM-03"],
        ["6.1", "6.2", "6.8", "3.3"],
        ["RBI-A1-08"],
        ["SEBI-PR-01"],
        "Failure of least privilege. Reviewers will want the access-rights review evidence, "
        "not just the patch.",
    ),
]

VULN_CLASSES += [
    _vc(
        "privilege_escalation", "Privilege escalation",
        ["CWE-269", "CWE-250", "CWE-266", "CWE-268", "CWE-271"],
        ["privilege escalation", "elevation of privilege", "escalate to root",
         "domain admin", "local privilege"],
        ["A.8.2", "A.5.18", "A.8.9", "A.8.16"],
        ["PR.AA-05", "PR.PS-01", "DE.CM-03"],
        ["5.4", "6.8", "4.7", "12.8"],
        ["RBI-A1-08", "RBI-A1-05"],
        ["SEBI-PR-01", "SEBI-DE-03"],
        "Escalation paths are governed by privileged-access controls; the detective mapping "
        "matters because escalation is usually only visible in privileged-activity logs.",
    ),
    _vc(
        "memory_corruption", "Memory corruption / buffer overflow",
        ["CWE-119", "CWE-120", "CWE-121", "CWE-122", "CWE-124", "CWE-125", "CWE-126",
         "CWE-416", "CWE-476", "CWE-787", "CWE-788", "CWE-190", "CWE-191"],
        ["buffer overflow", "use-after-free", "use after free", "out-of-bounds",
         "out of bounds", "memory corruption", "null pointer", "integer overflow",
         "heap overflow", "stack overflow"],
        ["A.8.28", "A.8.7", "A.8.19"],
        ["PR.PS-02", "PR.PS-05", "DE.CM-09"],
        ["10.5", "16.12", "7.3"],
        ["RBI-A1-07", "RBI-A1-12"],
        ["SEBI-PR-04", "SEBI-DE-03"],
        "Little can be done at configuration level, so the mapping leans on patching cadence "
        "and exploit-mitigation features rather than design controls.",
    ),
    _vc(
        "credential_exposure", "Hard-coded, weak or exposed credentials",
        ["CWE-798", "CWE-521", "CWE-522", "CWE-256", "CWE-259", "CWE-640"],
        ["hard-coded credential", "hardcoded password", "default credential",
         "weak password", "password reset", "credential exposure", "account takeover"],
        ["A.5.17", "A.8.5", "A.5.16", "A.8.24"],
        ["PR.AA-01", "PR.AA-03", "PR.DS-01"],
        ["5.2", "5.3", "6.5", "4.7"],
        ["RBI-A1-08", "RBI-A1-09"],
        ["SEBI-PR-01", "SEBI-PR-02"],
        "Credential weaknesses are the single most common precursor to account takeover, "
        "so phishing-resistant MFA is the control that actually closes the exposure.",
    ),
    _vc(
        "crypto_transport", "Cryptographic weakness / insecure transport",
        ["CWE-327", "CWE-328", "CWE-295", "CWE-311", "CWE-319", "CWE-326", "CWE-757"],
        ["weak cipher", "broken cryptograph", "cleartext transmission", "certificate "
         "validation", "tls", "ssl", "insecure transport"],
        ["A.8.24", "A.5.14", "A.8.21"],
        ["PR.DS-02", "PR.DS-01"],
        ["3.10", "3.11", "12.6"],
        ["RBI-A1-04", "RBI-A1-05"],
        ["SEBI-PR-05"],
        "Maps to cryptography and information-transfer controls; regulators treat "
        "cleartext handling of regulated data as a reportable control failure.",
    ),
]

VULN_CLASSES += [
    _vc(
        "misconfiguration", "Insecure default or misconfiguration",
        ["CWE-16", "CWE-1188", "CWE-1004", "CWE-276", "CWE-552", "CWE-1032"],
        ["misconfiguration", "insecure default", "default configuration",
         "exposed management", "setup page", "unprotected"],
        ["A.8.9", "A.8.19", "A.5.10"],
        ["PR.PS-01", "PR.IR-01", "DE.CM-09"],
        ["4.1", "4.2", "4.6", "4.8"],
        ["RBI-A1-05", "RBI-A1-01"],
        ["SEBI-PR-03", "SEBI-ID-02"],
        "Configuration drift is a baseline-hardening failure, and the asset inventory is what "
        "determines whether the drift was even detectable.",
    ),
    _vc(
        "info_disclosure", "Information disclosure / side channel",
        ["CWE-200", "CWE-209", "CWE-532", "CWE-203", "CWE-208", "CWE-1037", "CWE-385"],
        ["information disclosure", "information leak", "speculative execution",
         "side channel", "data sampling", "timing attack", "memory disclosure"],
        ["A.8.12", "A.8.11", "A.5.12", "A.5.23"],
        ["PR.DS-01", "PR.DS-10"],
        ["3.1", "3.11", "3.13"],
        ["RBI-A1-14", "RBI-A1-05", "RBI-A1-11"],
        ["SEBI-PR-05"],
        "Confidentiality-only impact, so the mapping is to classification and leakage "
        "controls rather than to availability or integrity objectives.",
    ),
    _vc(
        "web_client_side", "Cross-site scripting / request forgery",
        ["CWE-79", "CWE-80", "CWE-352", "CWE-601"],
        ["cross-site scripting", "xss", "csrf", "cross-site request forgery",
         "open redirect"],
        ["A.8.26", "A.8.23", "A.8.28"],
        ["PR.PS-06", "PR.IR-01"],
        ["16.12", "9.1", "9.2", "13.10"],
        ["RBI-A1-06", "RBI-A1-13", "RBI-A1-10"],
        ["SEBI-PR-06", "SEBI-PR-07"],
        "Client-side flaws are the delivery mechanism for phishing and session theft, which "
        "is why awareness and anti-phishing controls join the application mapping.",
    ),
    _vc(
        "ssrf_xxe", "Server-side request forgery / XML external entity",
        ["CWE-918", "CWE-611", "CWE-776"],
        ["server-side request forgery", "ssrf", "xml external entity", "xxe",
         "entity expansion"],
        ["A.8.26", "A.8.22", "A.8.20"],
        ["PR.PS-06", "PR.IR-01", "DE.CM-01"],
        ["16.12", "13.4", "12.2"],
        ["RBI-A1-04", "RBI-A1-06"],
        ["SEBI-PR-03", "SEBI-PR-06"],
        "SSRF converts an application flaw into lateral network reach, so segmentation is "
        "the compensating control a reviewer will look for.",
    ),
]

VULN_CLASSES += [
    _vc(
        "supply_chain", "Vulnerable or untrusted third-party component",
        ["CWE-1104", "CWE-494", "CWE-829", "CWE-1357", "CWE-1395"],
        ["third-party component", "unmaintained", "supply chain", "dependency",
         "untrusted download", "outdated library", "end of life", "end-of-life"],
        ["A.5.19", "A.5.21", "A.8.25", "A.8.19"],
        ["GV.SC-04", "GV.SC-07", "ID.AM-02", "PR.PS-02"],
        ["2.1", "2.2", "16.5", "15.1", "15.4"],
        ["RBI-A1-25", "RBI-A1-06"],
        ["SEBI-ID-03", "SEBI-GV-04"],
        "The clearest place where SBOM obligations bite: you cannot report on component risk "
        "you have not inventoried.",
    ),
    _vc(
        "dos_resource", "Denial of service / resource exhaustion",
        ["CWE-400", "CWE-770", "CWE-674", "CWE-405", "CWE-1050"],
        ["denial of service", "dos", "resource exhaustion", "infinite loop",
         "uncontrolled recursion", "amplification"],
        ["A.8.6", "A.5.30", "A.8.20"],
        ["PR.IR-03", "PR.IR-04", "RC.RP-01"],
        ["13.3", "12.2", "11.5"],
        ["RBI-A1-04", "RBI-A1-18"],
        ["SEBI-RC-01", "SEBI-PR-03"],
        "Availability-only impact maps to capacity, resilience and recovery objectives — the "
        "controls that determine whether an outage becomes a reportable disruption.",
    ),
    _vc(
        "race_condition", "Race condition / time-of-check flaw",
        ["CWE-362", "CWE-367", "CWE-366", "CWE-364"],
        ["race condition", "time-of-check", "toctou", "concurrent execution"],
        ["A.8.28", "A.8.29"],
        ["PR.PS-06", "ID.IM-02"],
        ["16.12", "16.13"],
        ["RBI-A1-06", "RBI-A1-17"],
        ["SEBI-PR-06", "SEBI-ID-05"],
        "Rarely caught by scanners, so the mapping points at security testing and penetration "
        "testing rather than at patch cadence.",
    ),
    _vc(
        "malware_ransomware", "Ransomware / destructive malware exposure",
        ["CWE-506", "CWE-507", "CWE-510", "CWE-912"],
        ["ransomware", "wiper", "encrypt files", "extortion", "botnet", "web shell",
         "backdoor", "cryptomining"],
        ["A.8.7", "A.8.13", "A.5.29", "A.5.30"],
        ["PR.DS-11", "DE.CM-09", "RS.MI-01", "RS.MI-02", "RC.RP-01"],
        ["10.1", "10.2", "10.7", "11.2", "11.3", "11.4", "11.5", "2.5", "2.7"],
        ["RBI-A1-12", "RBI-A1-24", "RBI-A1-18"],
        ["SEBI-RC-01", "SEBI-RC-02", "SEBI-RS-01"],
        "Ransomware is the case where recovery controls carry more of the residual-risk "
        "reduction than preventive ones, so backups are mapped as first-class evidence.",
    ),
]

# --------------------------------------------------------------------------- #
# 2. Mitigation classes: a candidate investment → the controls it would satisfy
# --------------------------------------------------------------------------- #
# `control_ids` are the identifiers used in the bundled sample scan, so a demo maps
# exactly. `keywords` are what make an arbitrary uploaded scan map too — they are matched
# against the investment's name, so "Deploy hardware MFA tokens" resolves without any
# identifier agreement between the platform and whoever produced the scan.


def _mc(key, label, control_ids, keywords, iso, csf, cis, rbi, sebi, evidence):
    return {
        "key": key,
        "label": label,
        "control_ids": control_ids,
        "keywords": keywords,
        "evidence": evidence,
        "controls": {
            "iso27001": sorted(iso, key=_sort_key),
            "nistcsf": sorted(csf, key=_sort_key),
            "cis": sorted(cis, key=_sort_key),
            "rbi": sorted(rbi, key=_sort_key),
            "sebi": sorted(sebi, key=_sort_key),
        },
    }


MITIGATION_CLASSES = [
    _mc(
        "segmentation", "Network segmentation / zero-trust architecture",
        ["CTRL-01"],
        ["microsegmentation", "micro-segmentation", "segmentation", "zero-trust",
         "zero trust", "sdp", "software-defined perimeter", "east-west"],
        ["A.8.20", "A.8.22", "A.8.21", "A.8.23"],
        ["PR.IR-01", "PR.AA-05", "PR.IR-02", "DE.CM-01"],
        ["12.2", "13.4", "4.4", "13.10"],
        ["RBI-A1-04", "RBI-A1-05"],
        ["SEBI-PR-03", "SEBI-DE-01"],
        "Segmentation policy, VLAN/ACL matrix, and evidence that east-west traffic is "
        "denied by default rather than merely monitored.",
    ),
    _mc(
        "phishing_resistant_mfa", "Phishing-resistant multi-factor authentication",
        ["CTRL-02"],
        ["mfa", "multi-factor", "multifactor", "fido2", "passkey", "hardware token",
         "webauthn", "2fa", "two-factor"],
        ["A.8.5", "A.5.17", "A.5.16", "A.5.15"],
        ["PR.AA-01", "PR.AA-02", "PR.AA-03"],
        ["6.3", "6.4", "6.5", "5.2"],
        ["RBI-A1-09", "RBI-A1-08"],
        ["SEBI-PR-02", "SEBI-PR-01"],
        "Enrolment coverage by privilege tier, and the exception register for accounts "
        "still on password-only or SMS OTP.",
    ),
    _mc(
        "data_protection", "Database activity monitoring and encryption at rest",
        ["CTRL-03"],
        ["encryption", "database activity", "dam", "tokenisation", "tokenization",
         "data masking", "at rest", "key management", "hsm", "dlp"],
        ["A.8.24", "A.8.11", "A.8.12", "A.8.3", "A.5.12"],
        ["PR.DS-01", "PR.DS-02", "PR.DS-10", "DE.CM-03"],
        ["3.10", "3.11", "3.13", "3.14", "3.3"],
        ["RBI-A1-14", "RBI-A1-15", "RBI-A1-16"],
        ["SEBI-PR-05", "SEBI-DE-02"],
        "Key-management procedure, cipher inventory, and DAM alert samples proving the "
        "monitoring is actually generating reviewable events.",
    ),
]

MITIGATION_CLASSES += [
    _mc(
        "detection_response", "Managed detection and response / XDR / SOC",
        ["CTRL-04"],
        ["xdr", "edr", "mdr", "siem", "soc", "detection and response", "threat hunting",
         "24x7 monitoring", "security operations"],
        ["A.8.16", "A.8.15", "A.5.24", "A.5.25", "A.5.26", "A.5.27", "A.5.28", "A.5.7"],
        ["DE.CM-01", "DE.CM-03", "DE.CM-06", "DE.CM-09", "DE.AE-02", "DE.AE-03",
         "DE.AE-04", "DE.AE-06", "DE.AE-08", "ID.RA-02", "PR.PS-04",
         "RS.MA-01", "RS.MA-02", "RS.AN-03"],
        ["8.2", "8.5", "8.9", "8.11", "13.1", "13.2", "13.6", "17.1", "17.4"],
        ["RBI-A1-19", "RBI-A1-20", "RBI-A2-01", "RBI-A2-02"],
        ["SEBI-DE-01", "SEBI-DE-02", "SEBI-DE-03", "SEBI-RS-01", "SEBI-RS-02"],
        "Use-case coverage matrix, mean time to detect, and for RBI-regulated entities the "
        "C-SOC operating model. SEBI-regulated entities should also cite market-SOC or "
        "equivalent SOC onboarding.",
    ),
    _mc(
        "virtual_patching", "WAF / IPS virtual patching",
        ["CTRL-05"],
        ["waf", "web application firewall", "virtual patch", "ips", "rasp",
         "shielding", "api gateway"],
        ["A.8.20", "A.8.23", "A.8.26", "A.8.8"],
        ["PR.IR-01", "PR.PS-05", "DE.CM-01", "ID.RA-06"],
        ["13.10", "9.2", "13.3", "7.7"],
        ["RBI-A1-04", "RBI-A1-13", "RBI-A1-07"],
        ["SEBI-PR-03", "SEBI-PR-07", "SEBI-PR-04"],
        "Rule coverage against the open finding list, and blocking-vs-monitoring mode per "
        "rule — a WAF in detect-only mode is not a compensating control.",
    ),
    _mc(
        "privileged_access", "Privileged access management / credential vaulting",
        ["CTRL-06"],
        ["pam", "privileged access", "vault", "just-in-time", "jit access",
         "session recording", "break-glass", "secrets management"],
        ["A.8.2", "A.5.18", "A.8.5", "A.8.16", "A.5.15"],
        ["PR.AA-05", "PR.AA-01", "DE.CM-03", "PR.AA-06"],
        ["5.4", "6.8", "6.2", "5.1", "6.7"],
        ["RBI-A1-08", "RBI-A1-10"],
        ["SEBI-PR-01", "SEBI-DE-03"],
        "Privileged account inventory, vaulting percentage, and the quarterly access "
        "recertification record.",
    ),
    _mc(
        "backup_recovery", "Immutable, air-gapped backup and recovery",
        ["CTRL-07"],
        ["backup", "air-gap", "air gap", "immutable", "restore", "disaster recovery",
         "replication", "recovery point", "rpo", "rto"],
        ["A.8.13", "A.5.29", "A.5.30", "A.8.14"],
        ["PR.DS-11", "RC.RP-01", "RC.RP-05", "RC.CO-03"],
        ["11.2", "11.3", "11.4", "11.5"],
        ["RBI-A1-18", "RBI-A1-24", "RBI-A3-02"],
        ["SEBI-RC-01", "SEBI-RC-02"],
        "Last successful restore test with date and scope. Backup existence is not "
        "evidence; a tested restore is.",
    ),
]

MITIGATION_CLASSES += [
    _mc(
        "vuln_management", "Patch and vulnerability management orchestration",
        ["CTRL-08"],
        ["patch", "vulnerability management", "remediation", "sla", "scanning",
         "orchestration", "asset inventory", "configuration baseline"],
        ["A.8.8", "A.8.9", "A.8.19", "A.5.9", "A.8.1", "A.8.31", "A.8.32"],
        ["ID.RA-01", "ID.RA-05", "ID.RA-06", "PR.PS-01", "PR.PS-02", "PR.PS-03",
         "ID.AM-01", "ID.AM-02", "ID.IM-01"],
        ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "1.1", "2.1", "4.1"],
        ["RBI-A1-01", "RBI-A1-02", "RBI-A1-05", "RBI-A1-07"],
        ["SEBI-ID-01", "SEBI-ID-02", "SEBI-PR-04", "SEBI-ID-05"],
        "Remediation-SLA attainment by severity band. This is the control most directly "
        "evidenced by the platform's own output, so the finding ageing report is the "
        "artefact to attach.",
    ),
    _mc(
        "network_access_control", "Network access control / 802.1X",
        ["CTRL-09"],
        ["802.1x", "nac", "network access control", "port security", "device posture",
         "rogue device", "wireless security", "radius"],
        ["A.8.20", "A.8.1", "A.5.9", "A.7.4"],
        ["PR.AA-01", "PR.AA-05", "ID.AM-01", "DE.CM-01", "DE.CM-06"],
        ["1.1", "1.2", "12.6", "13.1", "15.1"],
        ["RBI-A1-01", "RBI-A1-03", "RBI-A1-04"],
        ["SEBI-ID-01", "SEBI-PR-03"],
        "Authenticated-port percentage and the count of unmanaged devices quarantined in "
        "the reporting period.",
    ),
    _mc(
        "awareness_training", "Security awareness and phishing simulation",
        ["CTRL-10"],
        ["awareness", "phishing simulation", "training", "user education", "tabletop",
         "drill", "human risk"],
        ["A.6.3", "A.6.8", "A.5.10", "A.8.23"],
        ["PR.AT-01", "PR.AT-02", "GV.RM-05", "RS.CO-02", "RS.CO-03"],
        ["14.1", "14.2", "14.6", "9.6", "9.7", "17.7"],
        ["RBI-A1-21", "RBI-A1-22", "RBI-A1-13"],
        ["SEBI-GV-05", "SEBI-PR-07", "SEBI-RS-03"],
        "Completion rates and, more usefully to a reviewer, the simulated-phishing click "
        "and report rates trended over time.",
    ),
    _mc(
        "governance_assurance", "Governance, risk assessment and independent assurance",
        [],
        ["governance", "risk assessment", "audit", "policy", "board reporting",
         "third-party risk", "vendor assessment", "vapt", "penetration test",
         "red team", "cyber insurance", "incident response plan", "crisis management"],
        ["A.5.1", "A.5.2", "A.5.4", "A.5.19", "A.5.21", "A.5.31", "A.5.35", "A.5.36",
         "A.8.29", "A.5.24"],
        ["GV.RM-01", "GV.RM-02", "GV.RM-03", "GV.RM-06", "GV.OV-01", "GV.OV-03",
         "GV.SC-04", "GV.SC-07", "ID.RA-04", "ID.RA-07", "ID.RA-08", "ID.IM-02"],
        ["17.3", "18.1", "18.2", "18.3", "15.4", "16.1", "16.2"],
        ["RBI-A1-17", "RBI-A1-23", "RBI-A1-25", "RBI-A3-01", "RBI-A3-03"],
        ["SEBI-GV-01", "SEBI-GV-02", "SEBI-GV-03", "SEBI-GV-04", "SEBI-ID-04"],
        "Board-approved policy with review date, latest VAPT report, and the risk register "
        "showing accepted residual risk with named owners. Has no CTRL- identifier in the "
        "sample scan because it is the layer the platform reports *into*, not a purchasable "
        "line item.",
    ),
]

# --------------------------------------------------------------------------- #
# 3. Risk metric map: a platform number → the obligation it evidences
# --------------------------------------------------------------------------- #
# This is the mapping that makes the platform usable as a filing input rather than just a
# dashboard. `field` is the key on ProcessedScanResult / EnrichedFinding that carries the
# number, so the UI and the report generators can both resolve a metric to its citations
# without hard-coding them twice.


def _rm(key, label, field, unit, iso, csf, cis, rbi, sebi, statement):
    return {
        "key": key,
        "label": label,
        "field": field,
        "unit": unit,
        "statement": statement,
        "controls": {
            "iso27001": sorted(iso, key=_sort_key),
            "nistcsf": sorted(csf, key=_sort_key),
            "cis": sorted(cis, key=_sort_key),
            "rbi": sorted(rbi, key=_sort_key),
            "sebi": sorted(sebi, key=_sort_key),
        },
    }


RISK_METRIC_MAP = [
    _rm(
        "expected_annual_loss", "Expected annual loss", "totalExpectedLossINR", "INR",
        ["A.5.31", "A.8.8"],
        ["ID.RA-04", "ID.RA-05", "GV.RM-02", "GV.RM-03"],
        ["7.1", "18.1"],
        ["RBI-A1-17", "RBI-A3-01"],
        ["SEBI-GV-01", "SEBI-ID-04"],
        "Quantified financial consequence of the current open finding set, used to "
        "demonstrate that risk is assessed in business terms and against a stated "
        "appetite rather than by severity label alone.",
    ),
    _rm(
        "exploitation_probability", "Exploitation probability (model output)",
        "exploitProbability", "probability",
        ["A.5.7", "A.8.8"],
        ["ID.RA-03", "ID.RA-05", "ID.RA-06"],
        ["7.1", "7.7"],
        ["RBI-A1-07", "RBI-A1-19"],
        ["SEBI-ID-05", "SEBI-DE-01"],
        "Threat-informed likelihood per finding. Evidences that prioritisation uses "
        "current threat intelligence and not just static CVSS severity.",
    ),
    _rm(
        "residual_risk", "Residual risk after planned mitigation", "residualRiskScore",
        "index_0_100",
        ["A.5.31", "A.8.8", "A.5.36"],
        ["GV.RM-02", "GV.RM-05", "ID.RA-05", "ID.IM-01"],
        ["18.1", "18.3"],
        ["RBI-A1-17", "RBI-A3-01"],
        ["SEBI-GV-01", "SEBI-GV-02"],
        "The number a board must formally accept. Reporting it alongside the pre-treatment "
        "figure is what turns a scan into a risk-acceptance record.",
    ),
    _rm(
        "control_coverage", "Framework control coverage", "controlCoveragePct",
        "percent",
        ["A.5.36", "A.5.35"],
        ["GV.OV-01", "GV.OV-03", "ID.IM-01", "ID.IM-02"],
        ["18.2", "18.3", "17.3"],
        ["RBI-A1-23", "RBI-A3-03"],
        ["SEBI-GV-02", "SEBI-GV-03"],
        "Proportion of mapped controls with at least one satisfying investment or no "
        "contradicting finding. This is the self-assessment percentage regulators ask for, "
        "and for SEBI-regulated entities it is the input to the Cyber Capability Index "
        "submission.",
    ),
]

RISK_METRIC_MAP += [
    _rm(
        "critical_finding_count", "Critical and high finding count", "criticalFindings",
        "count",
        ["A.8.8", "A.6.8"],
        ["ID.RA-01", "ID.RA-06", "RS.MA-03"],
        ["7.4", "7.6"],
        ["RBI-A1-07", "RBI-A1-20"],
        ["SEBI-ID-05", "SEBI-RS-02"],
        "Open severe exposures at reporting date, with ageing. Directly evidences whether "
        "remediation timelines are being met.",
    ),
    _rm(
        "actively_exploited_count", "Findings under active exploitation",
        "activelyExploitedCount", "count",
        ["A.5.7", "A.8.8", "A.8.7"],
        ["ID.RA-03", "DE.CM-09", "RS.MI-01"],
        ["7.7", "10.1"],
        ["RBI-A1-12", "RBI-A1-19"],
        ["SEBI-DE-03", "SEBI-RS-01"],
        "Count of findings matching a confirmed in-the-wild exploitation catalogue. Usually "
        "the single most escalation-worthy line in a board pack.",
    ),
    _rm(
        "roi_of_security_spend", "Return on security investment", "roiPct", "percent",
        ["A.5.31"],
        ["GV.RM-03", "GV.RM-06", "GV.OV-03"],
        ["18.1"],
        ["RBI-A3-01"],
        ["SEBI-GV-01", "SEBI-GV-03"],
        "Risk reduction per rupee for the selected portfolio. Evidences that resourcing "
        "decisions are risk-based, which is a governance obligation in its own right and "
        "not merely a finance question.",
    ),
    _rm(
        "asset_criticality_weighting", "Business-criticality weighted exposure",
        "assetCriticalityProfile", "distribution",
        ["A.5.9", "A.5.12", "A.8.1"],
        ["ID.AM-01", "ID.AM-05", "ID.AM-08"],
        ["1.1", "3.1", "3.7"],
        ["RBI-A1-01", "RBI-A1-14"],
        ["SEBI-ID-01", "SEBI-ID-02"],
        "Shows the asset inventory is classified and that risk is weighted by business "
        "impact — the precondition for every other number here being meaningful.",
    ),
]

# --------------------------------------------------------------------------- #
# 4. Resolvers — the logic the browser re-implements in TypeScript
# --------------------------------------------------------------------------- #
_CWE_INDEX: dict[str, str] = {}
for _cls in VULN_CLASSES:
    for _cwe in _cls["cwes"]:
        _CWE_INDEX.setdefault(_cwe, _cls["key"])


def classify_finding(cwes: list[str] | None = None, text: str = "") -> dict:
    """
    Resolve a finding to a vulnerability class.

    CWE match first because it is an assertion by the CVE assigner, not an inference.
    Keyword match on the vulnerability name and description is the fallback for scanners
    that omit CWE. Returns the class plus how it was decided, so the UI can be honest
    about a keyword guess.
    """
    for cwe in cwes or []:
        key = _CWE_INDEX.get(cwe.strip().upper())
        if key:
            return {"key": key, "method": "cwe", "matched": cwe.strip().upper()}

    haystack = (text or "").lower()
    best: tuple[int, str, str] | None = None
    for cls in VULN_CLASSES:
        for kw in cls["keywords"]:
            if kw in haystack and (best is None or len(kw) > best[0]):
                best = (len(kw), cls["key"], kw)
    if best:
        return {"key": best[1], "method": "keyword", "matched": best[2]}
    return {"key": None, "method": "unmatched", "matched": None}


def classify_mitigation(control_id: str = "", name: str = "") -> dict:
    """Resolve a candidate investment to a mitigation class: id first, then keywords."""
    cid = (control_id or "").strip().upper()
    for cls in MITIGATION_CLASSES:
        if cid and cid in cls["control_ids"]:
            return {"key": cls["key"], "method": "control_id", "matched": cid}

    haystack = (name or "").lower()
    best: tuple[int, str, str] | None = None
    for cls in MITIGATION_CLASSES:
        for kw in cls["keywords"]:
            if kw in haystack and (best is None or len(kw) > best[0]):
                best = (len(kw), cls["key"], kw)
    if best:
        return {"key": best[1], "method": "keyword", "matched": best[2]}
    return {"key": None, "method": "unmatched", "matched": None}


# --------------------------------------------------------------------------- #
# 5. Integrity checks
# --------------------------------------------------------------------------- #
def check_integrity() -> list[str]:
    """
    Every control id referenced by any mapping must exist in the catalogue, and every
    mapping must reach every framework. A dangling id would silently produce an
    uniteable claim in a regulatory report, so this is a hard gate, not a warning.
    """
    errors: list[str] = []
    seen_cwes: dict[str, str] = {}

    for bucket, rows in (("vuln", VULN_CLASSES), ("mitigation", MITIGATION_CLASSES),
                         ("metric", RISK_METRIC_MAP)):
        keys = [r["key"] for r in rows]
        for dup in sorted({k for k in keys if keys.count(k) > 1}):
            errors.append(f"{bucket}: duplicate key {dup!r}")
        for row in rows:
            for fid, ids in row["controls"].items():
                if fid not in FRAMEWORKS:
                    errors.append(f"{bucket}/{row['key']}: unknown framework {fid!r}")
                    continue
                catalogue = FRAMEWORKS[fid]["controls"]
                for cid in ids:
                    if cid not in catalogue:
                        errors.append(
                            f"{bucket}/{row['key']}: {fid} control {cid!r} not in catalogue")
                if not ids:
                    errors.append(f"{bucket}/{row['key']}: no {fid} controls mapped")

    # A CWE resolving to two classes would make classification order-dependent.
    for cls in VULN_CLASSES:
        for cwe in cls["cwes"]:
            if cwe in seen_cwes and seen_cwes[cwe] != cls["key"]:
                errors.append(
                    f"vuln: {cwe} claimed by both {seen_cwes[cwe]!r} and {cls['key']!r}")
            seen_cwes.setdefault(cwe, cls["key"])

    return errors


def coverage() -> dict:
    """Which catalogue controls the mappings actually reach, per framework."""
    out: dict[str, dict] = {}
    for fid, fw in FRAMEWORKS.items():
        reached: set[str] = set()
        for rows in (VULN_CLASSES, MITIGATION_CLASSES, RISK_METRIC_MAP):
            for row in rows:
                reached.update(row["controls"].get(fid, []))
        total = len(fw["controls"])
        out[fid] = {
            "mapped": len(reached),
            "total": total,
            "pct": round(100.0 * len(reached) / total, 1) if total else 0.0,
            "unmapped": sorted(set(fw["controls"]) - reached, key=_sort_key),
        }
    return out


# --------------------------------------------------------------------------- #
# 6. Emit
# --------------------------------------------------------------------------- #
SOURCES = {
    "iso27001": "ISO/IEC 27001:2022, Annex A. Control identifiers and titles as published "
                "by ISO/IEC.",
    "nistcsf": "NIST Cybersecurity Framework 2.0 (NIST CSWP 29, February 2024). "
               "Subcategory identifiers as published by NIST.",
    "cis": "CIS Critical Security Controls v8.1 (Center for Internet Security). Safeguard "
           "numbering as published by CIS.",
    "rbi": "Reserve Bank of India, 'Cyber Security Framework in Banks', circular "
           "DBS.CO/CSITE/BC.11/33.01.001/2015-16 dated 2 June 2016 (Annex 1 baseline "
           "requirements, Annex 2 C-SOC, Annex 3 CCMP). Internal RBI-A<n>-<nn> identifiers "
           "are this project's numbering; requirement substance follows the circular.",
    "sebi": "SEBI, 'Cybersecurity and Cyber Resilience Framework (CSCRF) for SEBI "
            "Regulated Entities', circular SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113 dated "
            "20 August 2024, with the June 2025 FAQ and the 28 August 2025 technical "
            "clarifications. Internal SEBI-<FN>-<nn> identifiers are this project's "
            "numbering, grouped by the CSCRF's NIST CSF 2.0 anchoring.",
}

PROVENANCE_NOTE = (
    "verification=verified means the identifier and title were checked against the "
    "published standard. inferred means the requirement substance is correct but the "
    "official clause numbering could not be confirmed from the primary document. assigned "
    "means this project created the identifier and records the basis for the mapping. "
    "Reports must surface this status; an inferred or assigned identifier is not a citation."
)


def build() -> dict:
    counts: dict[str, dict[str, int]] = {}
    for fid, fw in FRAMEWORKS.items():
        tally: dict[str, int] = {}
        for ctrl in fw["controls"].values():
            status = ctrl.get("verification", ASSIGNED)
            tally[status] = tally.get(status, 0) + 1
        counts[fid] = tally

    return {
        "meta": {
            "schema_version": 1,
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "generator": "frameworks/crosswalk.py",
            "sources": SOURCES,
            "provenance_note": PROVENANCE_NOTE,
            "verification_counts": counts,
            "coverage": {k: {kk: vv for kk, vv in v.items() if kk != "unmapped"}
                         for k, v in coverage().items()},
        },
        "frameworks": {
            fid: {
                "id": fw["id"],
                "name": fw["name"],
                "long_name": fw["long_name"],
                "authority": fw["authority"],
                "groups": fw["groups"],
                "controls": fw["controls"],
                **({"resilience_goals": fw["resilience_goals"]}
                   if "resilience_goals" in fw else {}),
                **({"re_categories": fw["re_categories"]}
                   if "re_categories" in fw else {}),
            }
            for fid, fw in FRAMEWORKS.items()
        },
        "vulnerability_classes": VULN_CLASSES,
        "mitigation_classes": MITIGATION_CLASSES,
        "risk_metric_map": RISK_METRIC_MAP,
    }


def main() -> int:
    errors = check_integrity()
    if errors:
        print(f"integrity check FAILED ({len(errors)} problems):")
        for err in errors:
            print(f"  - {err}")
        return 1

    doc = build()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"wrote {OUT_PATH.relative_to(REPO_ROOT)} "
          f"({OUT_PATH.stat().st_size:,} bytes)")
    print(f"  vulnerability classes {len(VULN_CLASSES)}   "
          f"mitigation classes {len(MITIGATION_CLASSES)}   "
          f"risk metrics {len(RISK_METRIC_MAP)}")
    print(f"  distinct CWEs indexed {len(_CWE_INDEX)}")
    for fid, cov in coverage().items():
        tally = doc["meta"]["verification_counts"][fid]
        status = " ".join(f"{k}={v}" for k, v in sorted(tally.items()))
        print(f"  {fid:<9} mapped {cov['mapped']:>3}/{cov['total']:<3} "
              f"({cov['pct']:>5.1f}%)  {status}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
