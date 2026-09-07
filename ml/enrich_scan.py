#!/usr/bin/env python3
"""
enrich_scan.py — fill the optional `enrichment` block on a scan file from data/raw/.

    python3 ml/enrich_scan.py                     # public/sample-scan.json, in place
    python3 ml/enrich_scan.py --scan a --out b    # somewhere else
    python3 ml/enrich_scan.py --dry-run           # report only, write nothing
    python3 ml/enrich_scan.py --reconcile         # also correct the scanner's own fields
    python3 ml/enrich_scan.py --selftest          # exercise the transforms, no real data

Why this script exists at all: a scan file carries a CVSS *score*, and the exploitation model
needs the CVSS *vector*. Twenty-four of its sixty-six columns are the vector's sub-fields and
sub-scores, and not one of them can be recovered from the base score — 9.8 is reachable by
several different vectors that imply very different exploitation dynamics. Without this step
every non-KEV finding scores `null`, the browser falls back to the deterministic formula, and
the trained model is unreachable on real scan data no matter how well it fits.

What it will and will not do:

  fills       cvss_vector, cwe_ids, published_date, reference_tags, reference_count,
              epss_percentile, epss_velocity_90d, epss_max_to_date
  from        data/raw/nvd/*.jsonl and data/raw/epss/*.csv, keyed on cve_id
  anchored    at scan_metadata.scan_date, not today — the same as-of discipline the training
              split uses, via the same `epss_asof` function rather than a second copy of it
  refuses     to write an `enrichment` key for a CVE that is not in the NVD extract. An absent
              key makes `canScoreExploitation` return false and the UI states the reason; an
              empty object or a guessed vector would instead produce a confident number with
              nothing under it
  leaves      cvss_score, epss_score and actively_exploited exactly as the scanner reported
              them, unless --reconcile is passed. Disagreements are always reported: silently
              overwriting actively_exploited would change which findings the model is even
              asked about, and that is the operator's call, not this script's

Every value written here is a published fact about the CVE, traceable to NVD, EPSS or KEV.
Nothing is inferred, and a field that cannot be sourced is left out rather than defaulted.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

# One definition of the raw-data layout and of the EPSS as-of rule, shared with the training
# pipeline. If `epss_asof` here disagreed with `epss_asof` there by even a boundary condition,
# the browser would be handed features from a distribution the model never saw.
from build_dataset import (  # noqa: E402
    MissingData,
    _parse_dt,
    epss_asof,
    exploit_feature_names,
    exploit_row,
    load_epss,
    load_kev,
    load_nvd,
)

DEFAULT_SCAN = REPO_ROOT / "public" / "sample-scan.json"

# The seven optional fields on FindingEnrichment in src/model/features.ts, in that order. Kept
# as a list so the report can say which of them a given finding actually got.
ENRICHMENT_FIELDS = [
    "cvss_vector",
    "cwe_ids",
    "published_date",
    "reference_tags",
    "reference_count",
    "epss_percentile",
    "epss_velocity_90d",
    "epss_max_to_date",
]

# --------------------------------------------------------------------------- #
# one finding
# --------------------------------------------------------------------------- #
def enrich_one(rec: dict, hist: dict | None, asof: date) -> dict:
    """
    The slim NVD record plus the EPSS history for one CVE → its `enrichment` block.

    A field is present only if the source had it. `reference_count` of zero is a real
    observation (NVD lists no references) and is written; a missing `vectorString` means the
    extract had no v3 vector for this CVE, and the key is left out entirely.
    """
    out: dict = {}

    vector = (rec.get("vectorString") or "").strip()
    if vector:
        out["cvss_vector"] = vector

    cwes = [c.strip().upper() for c in (rec.get("cwes") or []) if c and c.strip()]
    if cwes:
        out["cwe_ids"] = cwes

    published = rec.get("published")
    if published:
        out["published_date"] = published

    tags = sorted({t.strip() for t in (rec.get("refTags") or []) if t and t.strip()})
    if tags:
        out["reference_tags"] = tags

    if isinstance(rec.get("refCount"), int):
        out["reference_count"] = rec["refCount"]

    # Only written when there is history to anchor them. `epss_asof` returns zeros for a CVE
    # with no snapshot on or before the anchor, and zero is the training convention for "no
    # signal" — but writing that zero here would claim EPSS was consulted and came back nil,
    # which is a different statement from "no snapshot existed yet".
    if hist:
        usable = [d for d in hist if d <= asof]
        if usable:
            _score, pct, velocity, max_seen = epss_asof(hist, asof)
            out["epss_percentile"] = round(pct, 6)
            out["epss_velocity_90d"] = round(velocity, 6)
            out["epss_max_to_date"] = round(max_seen, 6)

    return out


# --------------------------------------------------------------------------- #
# disagreements between what the scanner said and what the public record says
# --------------------------------------------------------------------------- #
# These are reported whether or not --reconcile is passed. A disagreement is information: a
# scan whose EPSS is six months stale is a real operational finding, and quietly correcting it
# would hide the fact that the scanner needs attention.
def audit_one(finding: dict, rec: dict, hist: dict | None, kev: dict, asof: date) -> list[str]:
    notes: list[str] = []
    cve = finding["cve_id"]

    nvd_base = rec.get("baseScore")
    scan_base = finding.get("cvss_score")
    if isinstance(nvd_base, (int, float)) and isinstance(scan_base, (int, float)):
        if abs(float(nvd_base) - float(scan_base)) > 0.05:
            notes.append(
                f"{cve}: scan reports CVSS {scan_base}, NVD publishes {nvd_base} "
                f"(the vector's own sub-scores are used for 24 columns either way)"
            )

    scan_epss = finding.get("epss_score")
    if hist and isinstance(scan_epss, (int, float)):
        usable = [d for d in hist if d <= asof]
        if usable:
            snap_score, _pct, _vel, max_seen = epss_asof(hist, asof)
            if abs(snap_score - float(scan_epss)) > 0.005:
                notes.append(
                    f"{cve}: scan reports EPSS {scan_epss:.4f}, snapshot {max(usable)} "
                    f"has {snap_score:.4f}"
                )
            # In training `max_to_date` is a maximum over the same series the score comes from,
            # so it is >= the score by construction. A scan-supplied score above the historical
            # maximum breaks that invariant and puts the row off the training manifold. The
            # browser clamps it (features.ts:321); the operator should still know.
            if float(scan_epss) > max_seen + 1e-9:
                notes.append(
                    f"{cve}: scan EPSS {scan_epss:.4f} exceeds the historical maximum "
                    f"{max_seen:.4f}; epss_max_to_date will be clamped up to the scan value"
                )

    in_kev = cve.upper() in kev
    flagged = bool(finding.get("actively_exploited"))
    if in_kev and not flagged:
        added = kev[cve.upper()]["added"].date()
        notes.append(f"{cve}: CISA added this to KEV on {added} but the scan does not flag it")
    elif flagged and not in_kev:
        notes.append(f"{cve}: scan flags active exploitation but the CVE is not in CISA KEV")

    return notes


# --------------------------------------------------------------------------- #
# opt-in correction of the scanner's own fields
# --------------------------------------------------------------------------- #
def reconcile_one(finding: dict, rec: dict, hist: dict | None, kev: dict,
                  asof: date) -> list[str]:
    """
    Overwrite cvss_score / epss_score / actively_exploited with the published values, in place.

    Off by default. `actively_exploited` in particular is a routing decision, not a display
    field: flipping it to true sends the finding down the observed-exploitation path where the
    probability is 1 by definition and the model is never consulted. Returns one line per
    change so the provenance block can record exactly what was altered.
    """
    changes: list[str] = []
    cve = finding["cve_id"]

    nvd_base = rec.get("baseScore")
    if isinstance(nvd_base, (int, float)) and abs(float(nvd_base) - float(finding.get("cvss_score", 0))) > 0.05:
        changes.append(f"{cve}: cvss_score {finding.get('cvss_score')} -> {float(nvd_base)} (NVD)")
        finding["cvss_score"] = float(nvd_base)

    if hist:
        usable = [d for d in hist if d <= asof]
        if usable:
            snap_score, _pct, _vel, _max = epss_asof(hist, asof)
            if abs(snap_score - float(finding.get("epss_score", 0))) > 0.005:
                changes.append(
                    f"{cve}: epss_score {finding.get('epss_score')} -> {round(snap_score, 6)} "
                    f"(snapshot {max(usable)})"
                )
                finding["epss_score"] = round(snap_score, 6)

    in_kev = cve.upper() in kev
    if in_kev and not finding.get("actively_exploited"):
        changes.append(f"{cve}: actively_exploited false -> true (KEV {kev[cve.upper()]['added'].date()})")
        finding["actively_exploited"] = True
    elif finding.get("actively_exploited") and not in_kev:
        # Not flipped to false. The scanner may have first-hand evidence CISA has not catalogued,
        # and discarding an observation of exploitation because a public list is behind would be
        # the more dangerous of the two errors.
        changes.append(f"{cve}: actively_exploited left true despite absence from KEV (scanner evidence kept)")

    return changes


# --------------------------------------------------------------------------- #
# the whole scan
# --------------------------------------------------------------------------- #
def scan_anchor(scan: dict) -> date:
    """
    The as-of date for every lookup: the scan date, never today.

    Using today would let a finding be scored with EPSS movement that postdates the scan, which
    is the serving-time version of the leak the training split goes to such lengths to avoid.
    """
    raw = (scan.get("scan_metadata") or {}).get("scan_date")
    parsed = _parse_dt(raw)
    if parsed is None:
        raise MissingData(
            f"scan_metadata.scan_date is missing or unparseable ({raw!r}). Every lookup in this "
            "script is anchored on it; guessing today's date would silently let post-scan "
            "information into the features."
        )
    return parsed.date()


def enrich_scan(scan: dict, nvd: dict, epss: dict, kev: dict, *,
                reconcile: bool = False) -> dict:
    """Mutates `scan` in place. Returns a report; the caller decides whether to write."""
    asof = scan_anchor(scan)
    findings = scan.get("findings") or []

    matched: list[str] = []
    unmatched: list[str] = []
    notes: list[str] = []
    changes: list[str] = []
    field_counts = {f: 0 for f in ENRICHMENT_FIELDS}
    scoreable = 0

    for finding in findings:
        cve = (finding.get("cve_id") or "").strip().upper()
        rec = nvd.get(cve)
        if rec is None:
            unmatched.append(finding.get("cve_id") or "<no cve_id>")
            # Any enrichment from a previous run is removed rather than left to rot: the NVD
            # extract in data/raw/ is the stated source, and a block this run cannot re-derive
            # from it is unsourced by definition.
            finding.pop("enrichment", None)
            continue

        hist = epss.get(cve)
        block = enrich_one(rec, hist, asof)
        if block:
            finding["enrichment"] = block
        else:
            finding.pop("enrichment", None)

        matched.append(cve)
        for field in block:
            field_counts[field] += 1
        if block.get("cvss_vector"):
            scoreable += 1

        notes += audit_one(finding, rec, hist, kev, asof)
        if reconcile:
            changes += reconcile_one(finding, rec, hist, kev, asof)

    return {
        "asof": asof.isoformat(),
        "findings": len(findings),
        "matched": matched,
        "unmatched": unmatched,
        "scoreable": scoreable,
        "field_counts": field_counts,
        "notes": notes,
        "changes": changes,
    }


def provenance_block(report: dict, epss_snapshot: str | None, reconcile: bool) -> dict:
    """
    The `enrichment_provenance` object written at the top of the scan file, matching
    EnrichmentProvenance in src/model/features.ts. A reader who opens the raw JSON should be
    able to tell where the added fields came from without running anything.
    """
    block = {
        "source": "ml/enrich_scan.py from data/raw/ (NVD CVE 2.0 extract, EPSS daily archive, CISA KEV)",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "nvd_records_matched": len(report["matched"]),
        "epss_snapshot": epss_snapshot or "",
        "anchored_at": report["asof"],
        "findings_with_cvss_vector": report["scoreable"],
    }
    if report["unmatched"]:
        block["unmatched_cves"] = report["unmatched"]
    if reconcile and report["changes"]:
        block["reconciled"] = report["changes"]
    return block


def parity_payload(scan: dict, nvd: dict, epss: dict) -> dict:
    """
    The feature row the *training* code builds for each matched finding, written out so the
    browser can be checked against it on real data rather than on a synthetic vector.

    This is the one artefact in the project that can prove the two implementations agree on a
    real scan: check-engine.cjs already cross-checks the tree arithmetic, but its feature rows
    are hand-built. Nothing consumes this yet; producing it costs nothing and the alternative is
    discovering a skew after the numbers have been reported.
    """
    asof = scan_anchor(scan)
    rows = []
    for finding in scan.get("findings") or []:
        cve = (finding.get("cve_id") or "").strip().upper()
        rec = nvd.get(cve)
        if rec is None:
            continue
        row = exploit_row(rec, epss.get(cve), asof)
        rows.append({
            "finding_id": finding.get("finding_id"),
            "cve": cve,
            "row": [float(v) for v in row],
        })
    return {
        "note": "Feature rows as built by ml/build_dataset.exploit_row. Reference for browser parity.",
        "asof": asof.isoformat(),
        "feature_names": exploit_feature_names(),
        "rows": rows,
    }


# --------------------------------------------------------------------------- #
# selftest — the only part of this script that can run without data/raw/
# --------------------------------------------------------------------------- #
# Fixtures, labelled as such. They exercise the transforms; they say nothing about any real CVE.
def _fixtures() -> tuple[dict, dict, dict, dict]:
    d = date.fromisoformat
    nvd = {
        "CVE-2024-0001": {
            "cve": "CVE-2024-0001",
            "published": "2024-01-15T00:00:00.000",
            "baseScore": 9.8,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
            "attackVector": "NETWORK", "attackComplexity": "LOW",
            "privilegesRequired": "NONE", "userInteraction": "NONE", "scope": "UNCHANGED",
            "confidentialityImpact": "HIGH", "integrityImpact": "HIGH", "availabilityImpact": "HIGH",
            "exploitabilityScore": 3.9, "impactScore": 5.9,
            "cwes": ["CWE-89"], "refCount": 7, "refTags": ["Exploit", "Patch"],
        },
        # No v3 vector in the extract: present in NVD, but unscoreable. The distinction between
        # this and an absent CVE matters — one is a gap in NVD, the other in the scan.
        "CVE-2024-0002": {
            "cve": "CVE-2024-0002", "published": "2024-02-01T00:00:00.000",
            "baseScore": 7.5, "vectorString": "", "cwes": [], "refCount": 0, "refTags": [],
        },
    }
    epss = {
        "CVE-2024-0001": {
            d("2024-01-01"): (0.10, 0.80),
            d("2024-06-01"): (0.42, 0.95),      # >90d later: velocity 0.32
            d("2027-01-01"): (0.99, 0.99),      # after every anchor used below
        },
    }
    kev = {"CVE-2024-0001": {"added": _parse_dt("2024-03-01"), "ransomware": False}}
    scan = {
        "scan_metadata": {"organization": "FIXTURE", "scan_date": "2024-06-15"},
        "findings": [
            {"finding_id": "F1", "cve_id": "CVE-2024-0001", "cvss_score": 9.8,
             "epss_score": 0.42, "actively_exploited": False,
             "vulnerability_name": "fixture", "description": "fixture"},
            {"finding_id": "F2", "cve_id": "CVE-2024-0002", "cvss_score": 7.5,
             "epss_score": 0.01, "actively_exploited": False,
             "vulnerability_name": "fixture", "description": "fixture"},
            {"finding_id": "F3", "cve_id": "CVE-1999-9999", "cvss_score": 5.0,
             "epss_score": 0.02, "actively_exploited": False,
             "vulnerability_name": "fixture", "description": "fixture",
             "enrichment": {"cvss_vector": "STALE FROM A PREVIOUS RUN"}},
        ],
    }
    return nvd, epss, kev, scan


def selftest() -> int:
    import copy

    failures: list[str] = []
    n = 0

    def check(label: str, condition: bool, detail: str = "") -> None:
        nonlocal n
        n += 1
        if condition:
            print(f"  ok   {label}")
        else:
            failures.append(label)
            print(f"  FAIL {label}" + (f" — {detail}" if detail else ""))

    nvd, epss, kev, scan_src = _fixtures()

    print("\nenrichment of a matched CVE")
    scan = copy.deepcopy(scan_src)
    rep = enrich_scan(scan, nvd, epss, kev)
    f1 = scan["findings"][0]
    e1 = f1.get("enrichment", {})
    check("a matched CVE gets the vector, which is the whole point",
          e1.get("cvss_vector") == "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")
    check("all eight enrichment fields are filled when the sources have them",
          all(k in e1 for k in ENRICHMENT_FIELDS), str(sorted(set(ENRICHMENT_FIELDS) - set(e1))))
    check("cwe_ids is a list of identifiers, not a string", e1.get("cwe_ids") == ["CWE-89"])
    check("reference_count of a real count is carried through", e1.get("reference_count") == 7)

    print("\nthe anchor is the scan date, not today")
    check("EPSS percentile comes from the 2024-06-01 snapshot, not the 2027 one",
          abs(e1["epss_percentile"] - 0.95) < 1e-9, str(e1.get("epss_percentile")))
    check("velocity is measured over the >=90d lag, giving 0.42 - 0.10",
          abs(e1["epss_velocity_90d"] - 0.32) < 1e-6, str(e1.get("epss_velocity_90d")))
    check("max_to_date ignores the future snapshot that would have made it 0.99",
          abs(e1["epss_max_to_date"] - 0.42) < 1e-9, str(e1.get("epss_max_to_date")))
    check("the report states the anchor it used", rep["asof"] == "2024-06-15", rep["asof"])

    print("\nrefusals: what is not written")
    f2, f3 = scan["findings"][1], scan["findings"][2]
    check("a CVE in NVD but without a v3 vector gets no cvss_vector",
          "cvss_vector" not in f2.get("enrichment", {}))
    check("that finding still gets what NVD does have",
          f2.get("enrichment", {}).get("published_date") == "2024-02-01T00:00:00.000")
    check("reference_count of zero is written, because zero references is an observation",
          f2.get("enrichment", {}).get("reference_count") == 0)
    check("a CVE absent from the NVD extract gets no enrichment key at all",
          "enrichment" not in f3, str(f3.get("enrichment")))
    check("stale enrichment from a previous run is removed, not left unsourced",
          "enrichment" not in f3)
    check("the report names the unmatched CVE rather than burying it",
          rep["unmatched"] == ["CVE-1999-9999"], str(rep["unmatched"]))
    check("no EPSS history means no EPSS fields, not zeros presented as measurements",
          not any(k.startswith("epss_") for k in f2.get("enrichment", {})),
          str(f2.get("enrichment")))
    check("scoreable counts only findings that got a vector", rep["scoreable"] == 1,
          str(rep["scoreable"]))

    print("\ndisagreements are reported, and by default nothing is overwritten")
    scan = copy.deepcopy(scan_src)
    scan["findings"][0]["cvss_score"] = 5.0          # NVD says 9.8
    scan["findings"][0]["epss_score"] = 0.01         # snapshot says 0.42
    rep = enrich_scan(scan, nvd, epss, kev)
    joined = " | ".join(rep["notes"])
    check("a CVSS disagreement is reported", "scan reports CVSS 5.0, NVD publishes 9.8" in joined, joined)
    check("an EPSS disagreement is reported", "scan reports EPSS 0.0100" in joined, joined)
    check("a KEV listing the scan missed is reported", "does not flag it" in joined, joined)
    check("the scanner's CVSS is left alone without --reconcile",
          scan["findings"][0]["cvss_score"] == 5.0)
    check("the scanner's EPSS is left alone without --reconcile",
          scan["findings"][0]["epss_score"] == 0.01)
    check("the exploitation label is left alone without --reconcile",
          scan["findings"][0]["actively_exploited"] is False)
    check("nothing is listed as changed", rep["changes"] == [], str(rep["changes"]))

    print("\n--reconcile corrects the scanner's fields and records every change")
    scan = copy.deepcopy(scan_src)
    scan["findings"][0]["cvss_score"] = 5.0
    scan["findings"][0]["epss_score"] = 0.01
    rep = enrich_scan(scan, nvd, epss, kev, reconcile=True)
    ch = " | ".join(rep["changes"])
    check("CVSS is corrected to the published base score", scan["findings"][0]["cvss_score"] == 9.8)
    check("EPSS is corrected to the anchored snapshot",
          abs(scan["findings"][0]["epss_score"] - 0.42) < 1e-9)
    check("a KEV-listed CVE is flagged exploited", scan["findings"][0]["actively_exploited"] is True)
    check("every change is recorded, not just applied", len(rep["changes"]) == 3, ch)
    check("the record says what became what", "cvss_score 5.0 -> 9.8" in ch, ch)

    print("\nan observation of exploitation is never discarded")
    scan = copy.deepcopy(scan_src)
    scan["findings"][1]["actively_exploited"] = True          # CVE-2024-0002 is not in KEV
    rep = enrich_scan(scan, nvd, epss, kev, reconcile=True)
    check("a scanner's exploitation flag survives absence from KEV",
          scan["findings"][1]["actively_exploited"] is True)
    check("but the discrepancy is stated in the record",
          any("left true despite absence from KEV" in c for c in rep["changes"]),
          str(rep["changes"]))

    print("\ninvariants the model depends on")
    scan = copy.deepcopy(scan_src)
    scan["findings"][0]["epss_score"] = 0.90                  # above the historical maximum
    rep = enrich_scan(scan, nvd, epss, kev)
    check("an EPSS score above its own history is flagged, because training cannot produce it",
          any("exceeds the historical maximum" in note for note in rep["notes"]), str(rep["notes"]))

    scan = copy.deepcopy(scan_src)
    enrich_scan(scan, nvd, epss, kev)
    again = copy.deepcopy(scan)
    enrich_scan(again, nvd, epss, kev)
    check("enrichment is idempotent — running twice changes nothing",
          json.dumps(scan, sort_keys=True) == json.dumps(again, sort_keys=True))

    bad = {"scan_metadata": {"scan_date": "not a date"}, "findings": []}
    try:
        enrich_scan(bad, nvd, epss, kev)
        anchored_blindly = True
    except MissingData:
        anchored_blindly = False
    check("an unparseable scan_date is refused rather than defaulted to today", not anchored_blindly)

    print("\nthe parity reference tracks the training feature order")
    scan = copy.deepcopy(scan_src)
    payload = parity_payload(scan, nvd, epss)
    check("one row per matched finding, none for the unmatched one", len(payload["rows"]) == 2,
          str(len(payload["rows"])))
    check("rows are the full 66-column training vector",
          all(len(r["row"]) == 66 for r in payload["rows"]))
    check("the feature names accompany the rows, so a mismatch is detectable",
          len(payload["feature_names"]) == 66)
    check("every value is finite", all(v == v and abs(v) != float("inf")
                                      for r in payload["rows"] for v in r["row"]))
    check("base_score is column 0 and carries the scan's CVE base score",
          abs(payload["rows"][0]["row"][0] - 9.8) < 1e-6, str(payload["rows"][0]["row"][0]))

    print("\nthe provenance block a reader of the raw JSON sees")
    scan = copy.deepcopy(scan_src)
    rep = enrich_scan(scan, nvd, epss, kev)
    prov = provenance_block(rep, "2024-06-01", False)
    check("it names the script and all three sources",
          "enrich_scan.py" in prov["source"] and "NVD" in prov["source"]
          and "EPSS" in prov["source"] and "KEV" in prov["source"], prov["source"])
    check("it states the anchor, not just the run time", prov["anchored_at"] == "2024-06-15")
    check("it states how many findings the model can actually score",
          prov["findings_with_cvss_vector"] == 1)
    check("it lists the CVEs it could not match", prov.get("unmatched_cves") == ["CVE-1999-9999"],
          str(prov.get("unmatched_cves")))
    check("it carries no 'reconciled' key when nothing was reconciled", "reconciled" not in prov)

    print(f"\n{len(failures)} failure(s) of {n}" if failures else f"\nall {n} transform checks passed")
    for name in failures:
        print(f"  - {name}")
    print("\nReminder: fixtures, not real CVEs. This proves the transforms, not any figure.")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--scan", type=Path, default=DEFAULT_SCAN,
                    help=f"scan file to enrich (default {DEFAULT_SCAN.relative_to(REPO_ROOT)})")
    ap.add_argument("--out", type=Path, default=None,
                    help="where to write (default: in place)")
    ap.add_argument("--dry-run", action="store_true",
                    help="report what would change and write nothing")
    ap.add_argument("--reconcile", action="store_true",
                    help="also correct cvss_score, epss_score and actively_exploited from the "
                         "public record; every change is recorded in the file")
    ap.add_argument("--emit-parity", type=Path, default=None,
                    help="write the training-side feature rows for these findings to a JSON file")
    ap.add_argument("--selftest", action="store_true",
                    help="exercise the transforms on fixtures; reads no real data")
    args = ap.parse_args()

    if args.selftest:
        return selftest()

    if not args.scan.exists():
        print(f"\nscan file not found: {args.scan}\n", file=sys.stderr)
        return 2

    try:
        kev = load_kev()
        nvd = load_nvd()
        snapshots, epss = load_epss()
    except MissingData as exc:
        print(f"\nBLOCKED: {exc}\n", file=sys.stderr)
        return 2

    scan = json.loads(args.scan.read_text(encoding="utf-8"))
    print(f"{args.scan.relative_to(REPO_ROOT) if args.scan.is_relative_to(REPO_ROOT) else args.scan}: "
          f"{len(scan.get('findings') or [])} findings")
    print(f"  sources: {len(nvd):,} NVD records, {len(epss):,} CVEs with EPSS history "
          f"({snapshots[0]} .. {snapshots[-1]}), {len(kev):,} in KEV")

    try:
        report = enrich_scan(scan, nvd, epss, kev, reconcile=args.reconcile)
    except MissingData as exc:
        print(f"\nBLOCKED: {exc}\n", file=sys.stderr)
        return 2

    scan["enrichment_provenance"] = provenance_block(
        report, snapshots[-1].isoformat() if snapshots else None, args.reconcile
    )

    total = report["findings"]
    print(f"\nanchored at {report['asof']} (the scan date)")
    print(f"  matched in NVD          {len(report['matched'])}/{total}")
    print(f"  carry a CVSS vector     {report['scoreable']}/{total}  "
          f"<- the only ones the exploitation model can score")
    if report["unmatched"]:
        print(f"  not in the NVD extract  {len(report['unmatched'])}: "
              f"{', '.join(report['unmatched'][:6])}"
              f"{' ...' if len(report['unmatched']) > 6 else ''}")
    print("\n  field                 filled")
    for field in ENRICHMENT_FIELDS:
        print(f"    {field:<20}{report['field_counts'][field]:>4}/{total}")

    if report["notes"]:
        print(f"\n{len(report['notes'])} disagreement(s) between the scan and the public record:")
        for note in report["notes"]:
            print(f"  · {note}")
        if not args.reconcile:
            print("  (nothing was overwritten. Pass --reconcile to correct these in the file.)")

    if report["changes"]:
        print(f"\n{len(report['changes'])} field(s) reconciled:")
        for change in report["changes"]:
            print(f"  · {change}")

    if args.emit_parity:
        args.emit_parity.parent.mkdir(parents=True, exist_ok=True)
        args.emit_parity.write_text(json.dumps(parity_payload(scan, nvd, epss), indent=2))
        print(f"\nwrote training-side feature rows to {args.emit_parity}")

    if args.dry_run:
        print("\n--dry-run: nothing written.")
        return 0

    dest = args.out or args.scan
    dest.write_text(json.dumps(scan, indent=2) + "\n", encoding="utf-8")
    print(f"\nwrote {dest}")
    if report["scoreable"] == 0:
        print("\nNote: no finding carries a CVSS vector, so the exploitation model still cannot")
        print("score any of them. Check that data/raw/nvd/ covers these CVEs' publication years.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
