#!/usr/bin/env python3
"""
build_dataset.py — join the four real datasets in data/raw/ into modelling matrices.

    python3 ml/build_dataset.py                  # build from data/raw/
    python3 ml/build_dataset.py --selftest       # exercise the transforms, no real data

Two matrices come out of this, because the platform makes two different predictions:

  exploitation   per-CVE, label = "did this CVE enter the CISA KEV catalogue".
                 Features are NVD CVSS sub-vectors, EPSS level and velocity, NVD
                 reference tags, CWE class, and age — every one of them computable
                 strictly before the label date, which is what makes the forward split
                 honest rather than decorative.

  severity       per-incident, label = log10(VCDB impact.overall_amount) in USD.
                 Features are VERIS actor/action/asset/attribute codings. This is the
                 only genuinely empirical loss data in the project; everything financial
                 downstream is fitted to it rather than assumed.

Outputs land in data/processed/ as .npz plus a dataset_card.json recording row counts,
class balance, split dates and the exact feature order. numpy only.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
RAW = REPO_ROOT / "data" / "raw"
PROCESSED = REPO_ROOT / "data" / "processed"

sys.path.insert(0, str(REPO_ROOT / "frameworks"))
from crosswalk import VULN_CLASSES, classify_finding  # noqa: E402

VULN_KEYS = [c["key"] for c in VULN_CLASSES]

# --------------------------------------------------------------------------- #
# feature vocabularies — fixed and ordered, because the browser export has to agree
# --------------------------------------------------------------------------- #
CVSS_CATEGORICALS: dict[str, list[str]] = {
    "attackVector": ["NETWORK", "ADJACENT_NETWORK", "LOCAL", "PHYSICAL"],
    "attackComplexity": ["LOW", "HIGH"],
    "privilegesRequired": ["NONE", "LOW", "HIGH"],
    "userInteraction": ["NONE", "REQUIRED"],
    "scope": ["UNCHANGED", "CHANGED"],
    "confidentialityImpact": ["HIGH", "LOW", "NONE"],
    "integrityImpact": ["HIGH", "LOW", "NONE"],
    "availabilityImpact": ["HIGH", "LOW", "NONE"],
}

# NVD reference tags carry real signal: a public exploit link is a different world from
# a vendor advisory alone.
REF_TAGS = [
    "Exploit", "Patch", "Mitigation", "Vendor Advisory", "Third Party Advisory",
    "VDB Entry", "Technical Description", "Press/Media Coverage", "Mailing List",
    "Issue Tracking", "Release Notes", "Product", "Permissions Required",
    "Broken Link", "Not Applicable",
]

NUMERIC_FEATURES = [
    "base_score", "exploitability_score", "impact_score",
    "log_ref_count", "cwe_count", "age_days_log",
    "epss", "epss_percentile", "epss_velocity_90d", "epss_max_to_date",
]


def exploit_feature_names() -> list[str]:
    names = list(NUMERIC_FEATURES)
    for field, values in CVSS_CATEGORICALS.items():
        names += [f"{field}={v}" for v in values]
    names += [f"reftag={t}" for t in REF_TAGS]
    names += [f"vulnclass={k}" for k in VULN_KEYS]
    names.append("vulnclass=unmatched")
    return names


# --------------------------------------------------------------------------- #
# loaders
# --------------------------------------------------------------------------- #
class MissingData(RuntimeError):
    """Raised when data/raw/ has not been populated. Never silently substituted."""


def _require(path: Path, what: str) -> Path:
    if not path.exists():
        raise MissingData(
            f"{what} not found at {path.relative_to(REPO_ROOT)}.\n"
            "  Populate it with:  python3 ml/fetch_real_data.py --all\n"
            "  If the download host is blocked in this environment, run that script on a\n"
            "  machine with network access and copy data/raw/ into the project. This\n"
            "  pipeline will not fabricate a substitute."
        )
    return path


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    txt = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(txt)
    except ValueError:
        try:
            parsed = datetime.strptime(value[:10], "%Y-%m-%d")
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def load_kev() -> dict[str, dict]:
    """CVE id → {added: date, ransomware: bool}. This is the exploitation label source."""
    path = _require(RAW / "kev" / "known_exploited_vulnerabilities.json", "CISA KEV catalogue")
    doc = json.loads(path.read_text(encoding="utf-8"))
    out: dict[str, dict] = {}
    for entry in doc.get("vulnerabilities", []):
        cve = (entry.get("cveID") or "").strip().upper()
        added = _parse_dt(entry.get("dateAdded"))
        if not cve or added is None:
            continue
        out[cve] = {
            "added": added,
            "ransomware": str(entry.get("knownRansomwareCampaignUse", "")).strip().lower()
            == "known",
        }
    return out


def load_nvd() -> dict[str, dict]:
    """CVE id → slim NVD record. Later files win, so a re-fetch supersedes cleanly."""
    nvd_dir = _require(RAW / "nvd", "NVD CVE records")
    files = sorted(nvd_dir.glob("nvd-*.jsonl"))
    if not files:
        raise MissingData(
            f"no nvd-*.jsonl in {nvd_dir.relative_to(REPO_ROOT)}.\n"
            "  Populate with:  python3 ml/fetch_real_data.py --nvd"
        )
    out: dict[str, dict] = {}
    for path in files:
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue
                cve = (rec.get("cve") or "").strip().upper()
                if cve and rec.get("baseScore") is not None:
                    out[cve] = rec
    return out


def load_epss() -> tuple[list[date], dict[str, dict[date, tuple[float, float]]]]:
    """
    Returns (sorted snapshot dates, cve → {snapshot_date: (epss, percentile)}).

    Sparse by design: a CVE only appears in snapshots published after it existed, which is
    exactly the temporal structure the velocity features need.
    """
    epss_dir = _require(RAW / "epss", "EPSS score history")
    files = sorted(epss_dir.glob("epss-*.csv"))
    if not files:
        raise MissingData(
            f"no epss-*.csv in {epss_dir.relative_to(REPO_ROOT)}.\n"
            "  Populate with:  python3 ml/fetch_real_data.py --epss"
        )
    series: dict[str, dict[date, tuple[float, float]]] = {}
    snapshots: list[date] = []
    for path in files:
        snap = date.fromisoformat(path.stem.replace("epss-", ""))
        snapshots.append(snap)
        with path.open(encoding="utf-8", newline="") as fh:
            for row in csv.DictReader(fh):
                cve = (row.get("cve") or "").strip().upper()
                if not cve:
                    continue
                try:
                    series.setdefault(cve, {})[snap] = (float(row["epss"]),
                                                        float(row["percentile"]))
                except (KeyError, ValueError):
                    continue
    return sorted(snapshots), series


def load_vcdb() -> list[dict]:
    """VERIS incidents that carry a positive recorded loss. Empty list is a hard error."""
    path = _require(RAW / "vcdb" / "vcdb-incidents.jsonl", "VERIS Community Database")
    kept: list[dict] = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                inc = json.loads(line)
            except json.JSONDecodeError:
                continue
            amount = (inc.get("impact") or {}).get("overall_amount")
            if isinstance(amount, (int, float)) and amount > 0:
                kept.append(inc)
    if not kept:
        raise MissingData(
            "VCDB loaded but no incident carried impact.overall_amount > 0. The severity "
            "model has no empirical target to fit; refusing to continue with an assumed "
            "loss distribution."
        )
    return kept


# --------------------------------------------------------------------------- #
# EPSS lookup as-of a date — the guard against leaking future scores
# --------------------------------------------------------------------------- #
def epss_asof(hist: dict[date, tuple[float, float]] | None,
              asof: date) -> tuple[float, float, float, float]:
    """
    (epss, percentile, velocity_over_90d, max_to_date) using only snapshots <= asof.

    A CVE with no snapshot on or before `asof` gets zeros. That is the correct answer, not
    a missing value: at that moment the platform genuinely had no EPSS signal.
    """
    if not hist:
        return 0.0, 0.0, 0.0, 0.0
    usable = sorted(d for d in hist if d <= asof)
    if not usable:
        return 0.0, 0.0, 0.0, 0.0
    latest = usable[-1]
    score, pct = hist[latest]
    prior_cutoff = latest - timedelta(days=90)
    earlier = [d for d in usable if d <= prior_cutoff]
    velocity = score - hist[earlier[-1]][0] if earlier else 0.0
    max_to_date = max(hist[d][0] for d in usable)
    return score, pct, velocity, max_to_date


# --------------------------------------------------------------------------- #
# exploitation feature vector
# --------------------------------------------------------------------------- #
def exploit_row(rec: dict, epss_hist: dict[date, tuple[float, float]] | None,
                asof: date) -> np.ndarray:
    """One CVE → one feature row, using only information available on `asof`."""
    published = _parse_dt(rec.get("published"))
    age_days = max(0.0, (asof - published.date()).days) if published else 0.0
    score, pct, velocity, max_seen = epss_asof(epss_hist, asof)

    numeric = [
        float(rec.get("baseScore") or 0.0),
        float(rec.get("exploitabilityScore") or 0.0),
        float(rec.get("impactScore") or 0.0),
        math.log1p(float(rec.get("refCount") or 0)),
        float(len(rec.get("cwes") or [])),
        math.log1p(age_days),
        score, pct, velocity, max_seen,
    ]

    cats: list[float] = []
    for field, values in CVSS_CATEGORICALS.items():
        actual = (rec.get(field) or "").strip().upper()
        cats += [1.0 if actual == v else 0.0 for v in values]

    tags = set(rec.get("refTags") or [])
    tag_flags = [1.0 if t in tags else 0.0 for t in REF_TAGS]

    text = " ".join(rec.get("cwes") or [])
    cls = classify_finding(rec.get("cwes") or [], text)
    class_flags = [1.0 if cls["key"] == k else 0.0 for k in VULN_KEYS]
    class_flags.append(1.0 if cls["key"] is None else 0.0)

    return np.asarray(numeric + cats + tag_flags + class_flags, dtype=np.float32)


# --------------------------------------------------------------------------- #
# exploitation dataset — two anchors, so nothing is observed after its own label
# --------------------------------------------------------------------------- #
# The question is "will this currently-unexploited CVE be exploited in the next H days".
#
#   train anchor T0 : features as of T0, label = entered KEV in (T0, T0+H]
#   test  anchor T  : features as of T,  label = entered KEV in (T,  T+H]
#
# with T = latest_kev_date - H and T0 = T - H. Rows already in KEV at their own anchor are
# dropped: there is nothing to predict about a CVE that is already known-exploited. This is
# the part most cyber-risk demos get wrong — training on "ever appeared in KEV" with
# present-day EPSS scores lets the model read the answer off its own features.
def build_exploitation(nvd: dict[str, dict], kev: dict[str, dict],
                       epss: dict[str, dict[date, tuple[float, float]]],
                       horizon_days: int = 365) -> dict:
    latest_kev = max(v["added"] for v in kev.values()).date()
    test_anchor = latest_kev - timedelta(days=horizon_days)
    train_anchor = test_anchor - timedelta(days=horizon_days)

    def slice_at(anchor: date) -> tuple[np.ndarray, np.ndarray, list[str]]:
        window_end = anchor + timedelta(days=horizon_days)
        rows, labels, ids = [], [], []
        for cve, rec in nvd.items():
            published = _parse_dt(rec.get("published"))
            if published is None or published.date() > anchor:
                continue
            entry = kev.get(cve)
            if entry and entry["added"].date() <= anchor:
                continue                      # already known-exploited at the anchor
            label = 1 if entry and anchor < entry["added"].date() <= window_end else 0
            rows.append(exploit_row(rec, epss.get(cve), anchor))
            labels.append(label)
            ids.append(cve)
        if not rows:
            raise MissingData(f"no CVEs published on or before {anchor}")
        return (np.vstack(rows), np.asarray(labels, dtype=np.int8), ids)

    x_train, y_train, id_train = slice_at(train_anchor)
    x_test, y_test, id_test = slice_at(test_anchor)
    return {
        "feature_names": exploit_feature_names(),
        "x_train": x_train, "y_train": y_train, "id_train": id_train,
        "x_test": x_test, "y_test": y_test, "id_test": id_test,
        "train_anchor": train_anchor.isoformat(),
        "test_anchor": test_anchor.isoformat(),
        "horizon_days": horizon_days,
        "latest_kev_date": latest_kev.isoformat(),
    }


# --------------------------------------------------------------------------- #
# severity dataset — VERIS codings → log10(recorded USD loss)
# --------------------------------------------------------------------------- #
ACTORS = ["external", "internal", "partner"]
ACTIONS = ["hacking", "malware", "error", "misuse", "physical", "social", "environmental"]
ASSET_KINDS = ["S", "M", "U", "P", "N", "T", "K", "E"]        # VERIS asset variety prefixes
ATTRIBUTES = ["confidentiality", "integrity", "availability"]
EMPLOYEE_BANDS = ["1 to 10", "11 to 100", "101 to 1000", "1001 to 10000",
                  "10001 to 25000", "25001 to 50000", "50001 to 100000",
                  "Over 100000", "Small", "Large", "Unknown"]
NAICS2 = ["11", "21", "22", "23", "31", "32", "33", "42", "44", "45", "48", "49", "51",
          "52", "53", "54", "55", "56", "61", "62", "71", "72", "81", "92"]
DISCOVERY = ["external", "internal", "partner", "other", "unknown"]


def severity_feature_names() -> list[str]:
    names = ["incident_year", "log_data_total", "n_data_varieties", "n_assets",
             "n_action_kinds", "employee_band_ordinal"]
    names += [f"actor={a}" for a in ACTORS]
    names += [f"action={a}" for a in ACTIONS]
    names += [f"asset={a}" for a in ASSET_KINDS]
    names += ["asset=other"]
    names += [f"attribute={a}" for a in ATTRIBUTES]
    names += [f"employees={b}" for b in EMPLOYEE_BANDS]
    names += [f"naics={n}" for n in NAICS2]
    names += ["naics=other"]
    names += [f"discovery={d}" for d in DISCOVERY]
    return names


def _first_str(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list) and value:
        return _first_str(value[0])
    return ""


def severity_row(inc: dict) -> tuple[np.ndarray, float, int]:
    """One VERIS incident → (features, log10 loss, incident year)."""
    action = inc.get("action") or {}
    asset = inc.get("asset") or {}
    attribute = inc.get("attribute") or {}
    victim = inc.get("victim") or {}
    if isinstance(victim, list):
        victim = victim[0] if victim else {}

    year = int(((inc.get("timeline") or {}).get("incident") or {}).get("year") or 0)

    conf = attribute.get("confidentiality") or {}
    data_entries = conf.get("data") or []
    data_total = conf.get("data_total")
    if not isinstance(data_total, (int, float)):
        data_total = sum(d.get("amount", 0) or 0 for d in data_entries
                         if isinstance(d, dict))

    asset_kinds = set()
    assets = asset.get("assets") or []
    for item in assets:
        variety = item.get("variety", "") if isinstance(item, dict) else str(item)
        prefix = variety.split(" ")[0].strip().upper() if variety else ""
        asset_kinds.add(prefix if prefix in ASSET_KINDS else "other")

    band = str(victim.get("employee_count") or "Unknown")
    if band not in EMPLOYEE_BANDS:
        band = "Unknown"
    naics = str(_first_str(victim.get("industry")) or "")[:2]

    disc = str(inc.get("discovery_method") or "").lower()
    if isinstance(inc.get("discovery_method"), dict):
        disc = " ".join(inc["discovery_method"].keys()).lower()
    disc_group = next((d for d in DISCOVERY if d in disc), "unknown")

    action_kinds = [a for a in ACTIONS if a in action]
    # Columns 2 and 3 are counts here and cannot be counts in the browser: a scan finding is a
    # weakness, not an incident, so it has no data-variety list and touches one asset by
    # construction. src/model/features.ts floors them at 1 and records the substitution in
    # SEVERITY_COLUMN_SUBSTITUTIONS. Keep that table in step with any change to this block —
    # the feature-name check cannot see a column that keeps its name and changes its meaning.
    numeric = [
        float(year),
        math.log1p(float(data_total or 0)),
        float(len(data_entries)),
        float(len(assets)),
        float(len(action_kinds)),
        float(EMPLOYEE_BANDS.index(band)),
    ]
    flags = [1.0 if a in (inc.get("actor") or {}) else 0.0 for a in ACTORS]
    flags += [1.0 if a in action else 0.0 for a in ACTIONS]
    flags += [1.0 if k in asset_kinds else 0.0 for k in ASSET_KINDS]
    flags += [1.0 if "other" in asset_kinds else 0.0]
    flags += [1.0 if a in attribute else 0.0 for a in ATTRIBUTES]
    flags += [1.0 if band == b else 0.0 for b in EMPLOYEE_BANDS]
    flags += [1.0 if naics == n else 0.0 for n in NAICS2]
    flags += [1.0 if naics not in NAICS2 else 0.0]
    flags += [1.0 if disc_group == d else 0.0 for d in DISCOVERY]

    raw_amount = (inc.get("impact") or {}).get("overall_amount")
    if raw_amount is None:
        raise ValueError("overall_amount is missing")
    amount = float(raw_amount)
    return np.asarray(numeric + flags, dtype=np.float32), math.log10(amount), year


def build_severity(incidents: list[dict], test_fraction: float = 0.25) -> dict:
    """
    Forward-in-time split on incident year, same principle as the exploitation model:
    fit on older incidents, evaluate on more recent ones.
    """
    rows, targets, years = [], [], []
    for inc in incidents:
        try:
            vec, target, year = severity_row(inc)
        except (TypeError, ValueError):
            continue
        if year < 1990 or year > date.today().year:
            continue
        rows.append(vec)
        targets.append(target)
        years.append(year)
    if len(rows) < 50:
        raise MissingData(
            f"only {len(rows)} usable VCDB incidents with a recorded loss and a valid "
            "incident year. Too few to fit a severity model; refusing to proceed."
        )

    x = np.vstack(rows)
    y = np.asarray(targets, dtype=np.float32)
    yr = np.asarray(years, dtype=np.int32)

    # Pick the latest cut year that leaves at least `test_fraction` of rows in test.
    candidates = sorted(set(yr.tolist()))
    cut_year = candidates[0]
    for candidate in candidates:
        if (yr > candidate).mean() >= test_fraction:
            cut_year = candidate
        else:
            break
    train_mask = yr <= cut_year
    test_mask = ~train_mask

    return {
        "feature_names": severity_feature_names(),
        "x_train": x[train_mask], "y_train": y[train_mask],
        "x_test": x[test_mask], "y_test": y[test_mask],
        "year_train": yr[train_mask], "year_test": yr[test_mask],
        "cut_year": int(cut_year),
        "loss_quantiles_usd": {
            str(q): float(10 ** np.quantile(y, q / 100.0))
            for q in (10, 25, 50, 75, 90, 95, 99)
        },
    }


# --------------------------------------------------------------------------- #
# emit
# --------------------------------------------------------------------------- #
def write_outputs(exploit: dict, severity: dict) -> dict:
    PROCESSED.mkdir(parents=True, exist_ok=True)

    np.savez_compressed(
        PROCESSED / "exploitation.npz",
        x_train=exploit["x_train"], y_train=exploit["y_train"],
        x_test=exploit["x_test"], y_test=exploit["y_test"],
    )
    np.savez_compressed(
        PROCESSED / "severity.npz",
        x_train=severity["x_train"], y_train=severity["y_train"],
        x_test=severity["x_test"], y_test=severity["y_test"],
    )
    (PROCESSED / "exploitation_ids.json").write_text(
        json.dumps({"train": exploit["id_train"], "test": exploit["id_test"]}))

    card = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "generator": "ml/build_dataset.py",
        "data_is_real": True,
        "sources": json.loads((RAW / "fetch_receipt.json").read_text())
        if (RAW / "fetch_receipt.json").exists() else None,
        "exploitation": {
            "question": "will this currently-unexploited CVE enter the CISA KEV catalogue "
                        f"within {exploit['horizon_days']} days of the anchor date",
            "label_source": "CISA KEV dateAdded",
            "train_anchor": exploit["train_anchor"],
            "test_anchor": exploit["test_anchor"],
            "horizon_days": exploit["horizon_days"],
            "latest_kev_date": exploit["latest_kev_date"],
            "n_train": int(exploit["x_train"].shape[0]),
            "n_test": int(exploit["x_test"].shape[0]),
            "positives_train": int(exploit["y_train"].sum()),
            "positives_test": int(exploit["y_test"].sum()),
            "base_rate_train": round(float(exploit["y_train"].mean()), 6),
            "base_rate_test": round(float(exploit["y_test"].mean()), 6),
            "n_features": int(exploit["x_train"].shape[1]),
            "feature_names": exploit["feature_names"],
        },
        "severity": {
            "question": "log10 of the recorded USD loss for an incident with this VERIS "
                        "coding",
            "label_source": "VCDB impact.overall_amount",
            "cut_year": severity["cut_year"],
            "n_train": int(severity["x_train"].shape[0]),
            "n_test": int(severity["x_test"].shape[0]),
            "n_features": int(severity["x_train"].shape[1]),
            "loss_quantiles_usd": severity["loss_quantiles_usd"],
            "feature_names": severity["feature_names"],
        },
    }
    (PROCESSED / "dataset_card.json").write_text(json.dumps(card, indent=2))
    return card


# --------------------------------------------------------------------------- #
# selftest — validates the transforms only. NOT a training run.
# --------------------------------------------------------------------------- #
# The fixtures below are three hand-written records whose only purpose is to prove the
# feature builders, the as-of EPSS guard and the anchor logic behave. They are NOT training
# data and no metric may ever be quoted from them.
def selftest() -> int:
    print("SELFTEST — synthetic fixtures, transforms only. No model is trained here and")
    print("no number produced below is a performance figure.\n")
    failures: list[str] = []

    def check(label: str, condition: bool, detail: str = "") -> None:
        print(f"  {'ok  ' if condition else 'FAIL'} {label}{(' — ' + detail) if detail else ''}")
        if not condition:
            failures.append(label)

    names = exploit_feature_names()
    rec = {
        "cve": "CVE-2024-0001", "published": "2023-01-15T00:00:00.000",
        "baseScore": 9.8, "exploitabilityScore": 3.9, "impactScore": 5.9,
        "attackVector": "NETWORK", "attackComplexity": "LOW",
        "privilegesRequired": "NONE", "userInteraction": "NONE", "scope": "UNCHANGED",
        "confidentialityImpact": "HIGH", "integrityImpact": "HIGH",
        "availabilityImpact": "HIGH", "cwes": ["CWE-78"], "refCount": 7,
        "refTags": ["Exploit", "Vendor Advisory"],
    }
    hist = {date(2023, 6, 1): (0.10, 0.80), date(2023, 9, 1): (0.42, 0.95),
            date(2024, 6, 1): (0.97, 0.99)}
    row = exploit_row(rec, hist, date(2023, 10, 1))
    check("feature vector length matches names", len(row) == len(names),
          f"{len(row)} vs {len(names)}")

    score, pct, vel, mx = epss_asof(hist, date(2023, 10, 1))
    check("epss as-of ignores future snapshots", score == 0.42 and mx == 0.42,
          f"score={score} max={mx}")
    check("epss velocity uses a >=90d lag", abs(vel - 0.32) < 1e-6, f"velocity={vel:.4f}")
    check("epss before first snapshot is zero", epss_asof(hist, date(2023, 1, 1))[0] == 0.0)

    idx = names.index("vulnclass=rce_injection")
    check("CWE-78 routes to rce_injection via the crosswalk", row[idx] == 1.0)
    check("Exploit reference tag flagged", row[names.index("reftag=Exploit")] == 1.0)
    check("unset reference tag stays zero", row[names.index("reftag=Patch")] == 0.0)

    # anchor logic with horizon=365 gives train window 2021-06-01..2022-06-01 and test
    # window 2022-06-01..2023-06-01. A is already exploited at the train anchor (drop),
    # D lands in the train window, B lands in the test window, C never does.
    nvd = {
        cid: dict(rec, cve=cid, published="2020-01-01T00:00:00.000")
        for cid in ("CVE-A", "CVE-B", "CVE-C", "CVE-D")
    }
    kev = {
        "CVE-A": {"added": datetime(2021, 1, 1, tzinfo=timezone.utc), "ransomware": False},
        "CVE-D": {"added": datetime(2021, 9, 1, tzinfo=timezone.utc), "ransomware": False},
        "CVE-B": {"added": datetime(2023, 6, 1, tzinfo=timezone.utc), "ransomware": True},
    }
    built = build_exploitation(nvd, kev, {}, horizon_days=365)
    check("test anchor is one horizon before the latest KEV date",
          built["test_anchor"] == "2022-06-01", built["test_anchor"])
    check("train anchor is two horizons before", built["train_anchor"] == "2021-06-01",
          built["train_anchor"])
    check("already-exploited row dropped at its anchor", "CVE-A" not in built["id_train"],
          f"train ids {built['id_train']}")
    train_labels = dict(zip(built["id_train"], built["y_train"].tolist()))
    test_labels = dict(zip(built["id_test"], built["y_test"].tolist()))
    check("CVE exploited inside the train window is positive there",
          train_labels.get("CVE-D") == 1, str(train_labels))
    check("that same CVE is dropped from test, being already known by then",
          "CVE-D" not in test_labels, str(test_labels))
    check("CVE exploited only later is negative in train, positive in test",
          train_labels.get("CVE-B") == 0 and test_labels.get("CVE-B") == 1,
          f"train={train_labels.get('CVE-B')} test={test_labels.get('CVE-B')}")
    check("never-exploited CVE is negative in both",
          train_labels.get("CVE-C") == 0 and test_labels.get("CVE-C") == 0)


    sev_names = severity_feature_names()
    incident = {
        "incident_id": "fixture-1",
        "impact": {"overall_amount": 250000},
        "timeline": {"incident": {"year": 2019}},
        "actor": {"external": {"motive": ["Financial"]}},
        "action": {"hacking": {"variety": ["Exploit vuln"]}, "malware": {}},
        "asset": {"assets": [{"variety": "S - Web application"},
                             {"variety": "S - Database"}]},
        "attribute": {"confidentiality": {"data_total": 40000,
                                          "data": [{"variety": "Personal"}]},
                      "integrity": {}},
        "victim": {"employee_count": "1001 to 10000", "industry": "611310"},
        "discovery_method": {"external": {}},
    }
    vec, target, year = severity_row(incident)
    check("severity vector length matches names", len(vec) == len(sev_names),
          f"{len(vec)} vs {len(sev_names)}")
    check("loss target is log10 USD", abs(target - math.log10(250000)) < 1e-6)
    check("incident year extracted", year == 2019)
    check("server asset flagged", vec[sev_names.index("asset=S")] == 1.0)
    check("education NAICS bucketed to 61", vec[sev_names.index("naics=61")] == 1.0)
    check("availability attribute absent", vec[sev_names.index("attribute=availability")] == 0.0)

    print(f"\n{len(failures)} failure(s)" if failures else "\nall transform checks passed")
    if failures:
        for name in failures:
            print(f"  - {name}")
    print("\nReminder: this proves the pipeline is correct, not that a model exists.")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--selftest", action="store_true",
                    help="validate the transforms on fixtures; builds nothing")
    ap.add_argument("--horizon-days", type=int, default=365,
                    help="prediction window for the exploitation label (default 365)")
    ap.add_argument("--severity-test-fraction", type=float, default=0.25)
    args = ap.parse_args()

    if args.selftest:
        return selftest()

    try:
        print("loading CISA KEV ...")
        kev = load_kev()
        print(f"  {len(kev):,} exploited CVEs, "
              f"{sum(1 for v in kev.values() if v['ransomware']):,} ransomware-linked")

        print("loading NVD ...")
        nvd = load_nvd()
        print(f"  {len(nvd):,} CVEs with a CVSS v3 vector")

        print("loading EPSS ...")
        snapshots, epss = load_epss()
        print(f"  {len(snapshots)} snapshots {snapshots[0]} .. {snapshots[-1]}, "
              f"{len(epss):,} CVEs with history")

        print("loading VCDB ...")
        incidents = load_vcdb()
        print(f"  {len(incidents):,} incidents with a recorded loss amount")

        print("building exploitation matrix ...")
        exploit = build_exploitation(nvd, kev, epss, horizon_days=args.horizon_days)
        print("building severity matrix ...")
        severity = build_severity(incidents, test_fraction=args.severity_test_fraction)
    except MissingData as exc:
        print(f"\nBLOCKED: {exc}\n", file=sys.stderr)
        return 2

    card = write_outputs(exploit, severity)
    ex, sv = card["exploitation"], card["severity"]
    print(f"\nexploitation  train {ex['n_train']:,} rows "
          f"({ex['positives_train']:,} pos, base rate {ex['base_rate_train']:.5f})")
    print(f"              test  {ex['n_test']:,} rows "
          f"({ex['positives_test']:,} pos, base rate {ex['base_rate_test']:.5f})")
    print(f"              anchors {ex['train_anchor']} -> {ex['test_anchor']}, "
          f"horizon {ex['horizon_days']}d, {ex['n_features']} features")
    print(f"severity      train {sv['n_train']:,} / test {sv['n_test']:,} rows, "
          f"cut year {sv['cut_year']}, {sv['n_features']} features")
    print(f"              median recorded loss "
          f"${sv['loss_quantiles_usd']['50']:,.0f}")
    print("\nwrote data/processed/{exploitation.npz,severity.npz,dataset_card.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
