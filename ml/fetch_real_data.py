#!/usr/bin/env python3
"""
fetch_real_data.py — download the four REAL public datasets the risk model trains on.

    python3 ml/fetch_real_data.py --all
    python3 ml/fetch_real_data.py --kev --epss          # just the fast ones
    python3 ml/fetch_real_data.py --nvd --nvd-api-key $NVD_KEY

Everything lands in data/raw/. Nothing here is generated or simulated: each loader
targets the primary publisher of the dataset.

    CISA KEV   exploitation ground truth   cisa.gov
    EPSS       daily score history         epss.empiricalsecurity.com / api.first.org
    NVD        CVSS v3.1 vectors + CWE     services.nvd.nist.gov
    VCDB       real coded loss incidents   raw.githubusercontent.com/vz-risk/VCDB

Hosts that must be reachable (Cowork: coworkEgressAllowedHosts):
    www.cisa.gov, epss.empiricalsecurity.com, api.first.org,
    services.nvd.nist.gov, raw.githubusercontent.com, codeload.github.com

Standard library only — the training workspace has no pip access.
"""
from __future__ import annotations

import argparse
import csv
import gzip
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import zipfile
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
RAW = REPO_ROOT / "data" / "raw"

KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
EPSS_DAY_URL = "https://epss.empiricalsecurity.com/epss_scores-{day}.csv.gz"
EPSS_API_URL = "https://api.first.org/data/v1/epss"
NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
VCDB_ZIP_URL = "https://codeload.github.com/vz-risk/VCDB/zip/refs/heads/master"

USER_AGENT = "CyberRiskOptimizer/1.0 (SIH2026 PS-105; research use)"


# --------------------------------------------------------------------------- #
# transport
# --------------------------------------------------------------------------- #
def _get(url: str, headers: dict | None = None, retries: int = 4,
         timeout: int = 120) -> bytes:
    """GET with exponential backoff. Raises the last error if every attempt fails."""
    hdrs = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if headers:
        hdrs.update(headers)

    last: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=hdrs)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last = exc
            # 403/404 are terminal; 429 and 5xx are worth retrying.
            if exc.code in (403, 404):
                raise
            wait = 2 ** attempt * 3
            print(f"    HTTP {exc.code}; retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
        except Exception as exc:
            last = exc
            wait = 2 ** attempt * 3
            print(f"    {exc}; retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f"giving up on {url}: {last}")


def _egress_hint(exc: Exception) -> None:
    print(
        "\n  Download failed. If you are running inside the Cowork sandbox the host is\n"
        "  probably not on the egress allowlist. Either add it to\n"
        "  coworkEgressAllowedHosts, or run this script on your own machine and copy\n"
        f"  data/raw/ back into the project.\n  Underlying error: {exc}\n",
        file=sys.stderr,
    )


# Every host this script can dial, listed once so the run book below and an allowlist entry cannot
# drift apart. `api.first.org` belongs here even though it is only the EPSS fallback: an allowlist
# widened to the primaries alone leaves the fallback failing at the exact moment it is needed, and
# the point of asking for four hosts instead of five is not worth that. `_selftest` asserts this list
# and the *_URL constants cover each other in both directions.
EGRESS_HOSTS = [
    "www.cisa.gov",                # KEV catalogue
    "epss.empiricalsecurity.com",  # EPSS daily archive (primary)
    "api.first.org",               # EPSS fallback, used when a daily snapshot 404s
    "services.nvd.nist.gov",       # NVD CVE 2.0 API
    "codeload.github.com",         # VERIS Community DB zip
]

# What build_dataset.py will refuse to run without. Kept next to the fetchers that write them so a
# new dataset cannot be added without appearing in the handoff.
#
# These are the names as they must appear ON DISK, which are not the names the upstream hosts serve
# (CISA's filename survives; EPSS ships epss_scores-<day>.csv.gz and NVD is paged API JSON, neither
# of which is what lands here). build_dataset.py globs `nvd-*.jsonl` and `epss-*.csv` literally, so
# on route B — fetch elsewhere, copy the tree in — a file under its upstream name is a file the
# loader will not see. Copy the directories as written; do not rename.
EXPECTED_RAW = [
    "data/raw/kev/known_exploited_vulnerabilities.json",
    "data/raw/epss/epss-YYYY-MM-DD.csv        (one per monthly snapshot; globbed as epss-*.csv)",
    "data/raw/nvd/nvd-<tag>.jsonl             (one shard per year from --nvd-start-year; nvd-*.jsonl)",
    "data/raw/vcdb/vcdb-incidents.jsonl",
    "data/raw/fetch_receipt.json",
]


def _runbook(failed: list[str] | None = None) -> None:
    """The handoff. Printed on failure and on --runbook.

    This script is the only step in the chain that needs the network, so when it cannot reach a
    host the whole model pipeline stops here. Anyone reading that failure needs to know what to run
    where, what to bring back, and what the app does in the meantime — and needs it at the moment
    of failure, not in a document somewhere else.
    """
    w = sys.stderr.write
    w("\n" + "=" * 78 + "\n")
    w("RUN BOOK — getting real data into this project\n")
    w("=" * 78 + "\n")
    if failed:
        w(f"\nBlocked on: {', '.join(failed)}\n")
    w("\nThis is the only step that needs network access. Two ways past it:\n")
    w("\n  A. Allow the hosts, then re-run here:\n")
    for host in EGRESS_HOSTS:
        w(f"       {host}\n")
    w("     (add them to coworkEgressAllowedHosts, then: python3 ml/fetch_real_data.py --all)\n")
    w("\n  B. Run it on a machine that has network access, then copy the data in:\n")
    w("       python3 ml/fetch_real_data.py --all          # ~1-2 h, NVD is rate-limited\n")
    w("       (NVD_API_KEY=<key> raises the NVD rate limit from 5 to 50 requests/30s)\n")
    w("     then copy these back into the project, preserving the paths:\n")
    for item in EXPECTED_RAW:
        w(f"       {item}\n")
    w("\nThen, with data/raw/ populated, the rest runs offline:\n")
    w("       python3 ml/build_dataset.py     -> data/processed/*.npz, dataset_card.json\n")
    w("       python3 ml/train.py             -> public/model/risk-model.json,\n")
    w("                                          public/model/parity-fixture.json,\n")
    w("                                          data/processed/metrics.json\n")
    w("       npm run check:all               # re-verify with a real artefact in place\n")
    w("\nUntil then the app runs with model state 'absent': every figure comes from the\n")
    w("deterministic CVSS/EPSS formula, every export says so in red, and no model metric\n")
    w("is quoted anywhere. That is the intended behaviour, not a bug to work around — do\n")
    w("not substitute generated data to make the model branch light up.\n")
    w("=" * 78 + "\n")


def _write(path: Path, payload: bytes) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    print(f"    wrote {path.relative_to(REPO_ROOT)}  ({len(payload):,} bytes)")
    return path


# --------------------------------------------------------------------------- #
# 1. CISA Known Exploited Vulnerabilities — the exploitation label
# --------------------------------------------------------------------------- #
def fetch_kev() -> None:
    """
    Real catalogue of CVEs CISA has confirmed exploited in the wild.

    Shape (catalogVersion, dateReleased, count, vulnerabilities[]) where each entry has
    cveID, vendorProject, product, vulnerabilityName, dateAdded, shortDescription,
    requiredAction, dueDate, knownRansomwareCampaignUse, notes, cwes.

    dateAdded is the label timestamp that makes an honest forward-in-time split possible.
    """
    print("[1/4] CISA KEV catalogue")
    try:
        payload = _get(KEV_URL)
    except Exception as exc:
        _egress_hint(exc)
        raise

    doc = json.loads(payload)
    vulns = doc.get("vulnerabilities", [])
    if not vulns:
        raise RuntimeError("KEV payload contained no vulnerabilities — schema changed?")

    _write(RAW / "kev" / "known_exploited_vulnerabilities.json", payload)

    ransomware = sum(
        1 for v in vulns
        if str(v.get("knownRansomwareCampaignUse", "")).strip().lower() == "known"
    )
    dates = sorted(v["dateAdded"] for v in vulns if v.get("dateAdded"))
    print(f"    catalogVersion={doc.get('catalogVersion')} count={len(vulns):,}")
    print(f"    ransomware-linked={ransomware:,}  dateAdded {dates[0]} .. {dates[-1]}")


# --------------------------------------------------------------------------- #
# 2. EPSS — real daily score history, gives the model a time dimension
# --------------------------------------------------------------------------- #
def _epss_snapshot(day: date) -> tuple[str, list[tuple[str, float, float]]] | None:
    """Pull one archived daily EPSS file. Returns (model_version, rows) or None."""
    url = EPSS_DAY_URL.format(day=day.isoformat())
    try:
        blob = _get(url, timeout=180)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:          # no publication that day
            return None
        raise

    text = gzip.decompress(blob).decode("utf-8", errors="replace")
    model_version = ""
    rows: list[tuple[str, float, float]] = []
    reader = csv.reader(io.StringIO(text))
    header_seen = False
    for row in reader:
        if not row:
            continue
        if row[0].startswith("#"):                      # metadata comment line
            for part in ",".join(row).lstrip("#").split(","):
                if part.startswith("model_version:"):
                    model_version = part.split(":", 1)[1]
            continue
        if not header_seen and row[0].strip().lower() == "cve":
            header_seen = True
            continue
        try:
            rows.append((row[0].strip(), float(row[1]), float(row[2])))
        except (IndexError, ValueError):
            continue
    return model_version, rows


def fetch_epss(months: int = 30, day_of_month: int = 1) -> None:
    """
    One archived EPSS snapshot per month going back `months`, plus today's scores.

    Monthly rather than daily on purpose: daily files are ~250k rows each, and monthly
    sampling is enough to build velocity features (is this CVE's score climbing?) without
    downloading tens of gigabytes.
    """
    print(f"[2/4] EPSS history — {months} monthly snapshots")
    out_dir = RAW / "epss"
    out_dir.mkdir(parents=True, exist_ok=True)

    today = datetime.now(timezone.utc).date()
    wanted: list[date] = []
    y, m = today.year, today.month
    for _ in range(months):
        wanted.append(date(y, m, min(day_of_month, 28)))
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    wanted.append(today - timedelta(days=1))

    manifest: list[dict] = []
    for snap_day in wanted:
        dest = out_dir / f"epss-{snap_day.isoformat()}.csv"
        if dest.exists():
            print(f"    {snap_day} cached")
            continue
        try:
            result = _epss_snapshot(snap_day)
        except Exception as exc:
            _egress_hint(exc)
            raise
        if result is None:
            print(f"    {snap_day} not published, skipped")
            continue
        model_version, rows = result
        with dest.open("w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow(["cve", "epss", "percentile"])
            w.writerows(rows)
        manifest.append({"date": snap_day.isoformat(), "model_version": model_version,
                         "rows": len(rows), "file": dest.name})
        print(f"    {snap_day} model={model_version} rows={len(rows):,}")
        time.sleep(1)

    if manifest:
        (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))


# --------------------------------------------------------------------------- #
# 3. NVD CVE 2.0 — CVSS v3.1 vectors, CWE classes, reference tags
# --------------------------------------------------------------------------- #
def _nvd_slim(item: dict) -> dict | None:
    """Keep only the modelling-relevant fields from one NVD CVE record."""
    cve = item.get("cve", {})
    cve_id = cve.get("id")
    if not cve_id:
        return None

    metrics = cve.get("metrics", {})
    v3 = metrics.get("cvssMetricV31") or metrics.get("cvssMetricV30") or []
    if not v3:
        return None                                     # no v3 vector, unusable
    data = v3[0].get("cvssData", {})

    cwes: list[str] = []
    for weakness in cve.get("weaknesses", []):
        for desc in weakness.get("description", []):
            val = desc.get("value", "")
            if val.startswith("CWE-"):
                cwes.append(val)

    tags: set[str] = set()
    for ref in cve.get("references", []):
        tags.update(ref.get("tags", []) or [])

    return {
        "cve": cve_id,
        "published": cve.get("published"),
        "lastModified": cve.get("lastModified"),
        "vulnStatus": cve.get("vulnStatus"),
        "baseScore": data.get("baseScore"),
        "baseSeverity": data.get("baseSeverity"),
        "vectorString": data.get("vectorString"),
        "attackVector": data.get("attackVector"),
        "attackComplexity": data.get("attackComplexity"),
        "privilegesRequired": data.get("privilegesRequired"),
        "userInteraction": data.get("userInteraction"),
        "scope": data.get("scope"),
        "confidentialityImpact": data.get("confidentialityImpact"),
        "integrityImpact": data.get("integrityImpact"),
        "availabilityImpact": data.get("availabilityImpact"),
        "exploitabilityScore": v3[0].get("exploitabilityScore"),
        "impactScore": v3[0].get("impactScore"),
        "cwes": sorted(set(cwes)),
        "refCount": len(cve.get("references", [])),
        "refTags": sorted(tags),
    }


def fetch_nvd(start_year: int = 2016, api_key: str | None = None) -> None:
    """
    Walk the NVD CVE 2.0 API in 120-day publication windows (the API's maximum range)
    and keep every CVE that carries a CVSS v3.x vector.

    Rate limits: 5 requests / 30s anonymous, 50 requests / 30s with an API key. Get one
    free at https://nvd.nist.gov/developers/request-an-api-key — without it this takes
    roughly half an hour.
    """
    print(f"[3/4] NVD CVE records from {start_year}")
    out_dir = RAW / "nvd"
    out_dir.mkdir(parents=True, exist_ok=True)

    headers = {"apiKey": api_key} if api_key else {}
    pause = 0.7 if api_key else 6.5                     # stay inside the published limits
    page_size = 2000

    window_start = datetime(start_year, 1, 1, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    total = 0

    while window_start < now:
        window_end = min(window_start + timedelta(days=119), now)
        tag = f"{window_start:%Y-%m-%d}_{window_end:%Y-%m-%d}"
        dest = out_dir / f"nvd-{tag}.jsonl"
        if dest.exists():
            print(f"    {tag} cached")
            window_start = window_end + timedelta(seconds=1)
            continue

        records: list[dict] = []
        start_index = 0
        while True:
            params = (
                f"?pubStartDate={window_start:%Y-%m-%dT%H:%M:%S.000}"
                f"&pubEndDate={window_end:%Y-%m-%dT%H:%M:%S.000}"
                f"&resultsPerPage={page_size}&startIndex={start_index}"
            )
            try:
                payload = _get(NVD_API_URL + params, headers=headers, timeout=180)
            except Exception as exc:
                _egress_hint(exc)
                raise
            doc = json.loads(payload)
            for item in doc.get("vulnerabilities", []):
                slim = _nvd_slim(item)
                if slim:
                    records.append(slim)
            total_results = doc.get("totalResults", 0)
            start_index += page_size
            time.sleep(pause)
            if start_index >= total_results:
                break

        with dest.open("w", encoding="utf-8") as fh:
            for rec in records:
                fh.write(json.dumps(rec) + "\n")
        total += len(records)
        print(f"    {tag} kept {len(records):,} v3-scored CVEs (running {total:,})")
        window_start = window_end + timedelta(seconds=1)

    print(f"    total NVD records with CVSS v3: {total:,}")


# --------------------------------------------------------------------------- #
# 4. VERIS Community Database — real incidents with recorded loss
# --------------------------------------------------------------------------- #
def fetch_vcdb() -> None:
    """
    ~9,000 real security incidents hand-coded in the VERIS schema by the Verizon DBIR
    team and community. Each JSON file is one incident: actor, action, asset, attribute,
    discovery method, timeline and — for a subset — an impact.overall_amount in USD.

    That impact subset is the only genuinely empirical loss data in this pipeline, so the
    severity model is fitted to it rather than to an assumed distribution.
    """
    print("[4/4] VERIS Community Database")
    out_dir = RAW / "vcdb"
    out_dir.mkdir(parents=True, exist_ok=True)
    dest = out_dir / "vcdb-incidents.jsonl"

    if dest.exists():
        print("    cached")
        return

    try:
        blob = _get(VCDB_ZIP_URL, timeout=600)
    except Exception as exc:
        _egress_hint(exc)
        raise

    kept = with_loss = 0
    with zipfile.ZipFile(io.BytesIO(blob)) as zf, \
            dest.open("w", encoding="utf-8") as fh:
        for name in zf.namelist():
            # incidents live under data/json/validated/ as one file per incident
            if "/data/json/" not in name or not name.endswith(".json"):
                continue
            try:
                incident = json.loads(zf.read(name))
            except Exception:
                continue
            if not isinstance(incident, dict) or "incident_id" not in incident:
                continue
            fh.write(json.dumps(incident) + "\n")
            kept += 1
            amt = (incident.get("impact") or {}).get("overall_amount")
            if isinstance(amt, (int, float)) and amt > 0:
                with_loss += 1

    print(f"    incidents={kept:,}  with recorded loss amount={with_loss:,}")
    _write(out_dir / "SOURCE.txt", VCDB_ZIP_URL.encode())


# --------------------------------------------------------------------------- #
# --------------------------------------------------------------------------- #
# selftest — the run book is a claim about other files, so it can rot silently
# --------------------------------------------------------------------------- #
def _selftest() -> int:
    """Assert the handoff still describes reality. Touches no network and needs no data.

    This script sits outside every check chain that consumes its output, so nothing was watching
    the one thing it promises: that the paths it tells a human to copy are the paths
    `build_dataset.py` will actually look for. They had already diverged — EXPECTED_RAW named the
    *upstream* filenames (`epss_scores-<day>.csv`, `nvdcve-*.json`) while the loader globs
    `epss-*.csv` and `nvd-*.jsonl`. Following that run book to the letter produced a data/raw/ tree
    the pipeline reports as empty, which is the worst possible failure for a handoff: the person
    doing the copying has no way to tell they were misled.

    So the three names are locked to each other here — what the fetcher writes, what the loader
    globs, what the run book prints — plus the host list against the URLs it is derived from.
    """
    checks: list[tuple[bool, str, str]] = []

    def check(ok: bool, label: str, detail: str = "") -> None:
        checks.append((bool(ok), label, detail))

    me = Path(__file__).read_text(encoding="utf-8")
    loader_path = REPO_ROOT / "ml" / "build_dataset.py"
    loader = loader_path.read_text(encoding="utf-8") if loader_path.exists() else ""
    check(bool(loader), "build_dataset.py is readable", str(loader_path))

    # ---- 1. hosts cover the URLs, and the URLs cover the hosts -------------- #
    url_hosts = {
        m.split("//", 1)[1].split("/", 1)[0]
        for m in re.findall(r'^[A-Z_]*URL\s*=\s*"([^"]+)"', me, re.M)
    }
    for host in sorted(url_hosts):
        check(host in EGRESS_HOSTS,
              f"{host} is in EGRESS_HOSTS, so the allowlist the run book asks for covers it",
              "a URL constant dials a host the run book never names")
    for host in EGRESS_HOSTS:
        check(host in url_hosts,
              f"EGRESS_HOSTS entry {host} is still dialled by a URL constant",
              "stale allowlist entry — asks for access this script no longer uses")

    # ---- 2. every dataset the loader requires appears in the run book ------- #
    req_files = {f"data/raw/{d}/{f}"
                 for d, f in re.findall(r'RAW\s*/\s*"([^"]+)"\s*/\s*"([^"]+)"', loader)}
    solo = set(re.findall(r'RAW\s*/\s*"([^"]+)"(?!\s*/)', loader))
    req_files |= {f"data/raw/{x}" for x in solo if "." in x}
    req_dirs = {x for x in solo if "." not in x}
    req_globs = set(re.findall(r'\.glob\("([^"]+)"\)', loader))
    check(len(req_files) >= 3 and len(req_dirs) >= 2 and len(req_globs) >= 2,
          "the loader's requirements parsed out of build_dataset.py at all",
          f"files={sorted(req_files)} dirs={sorted(req_dirs)} globs={sorted(req_globs)}")
    for f in sorted(req_files):
        check(any(e.split()[0] == f for e in EXPECTED_RAW),
              f"run book lists {f}, which build_dataset.py requires by exact name")
    for d in sorted(req_dirs):
        check(any(e.startswith(f"data/raw/{d}/") for e in EXPECTED_RAW),
              f"run book lists a file under data/raw/{d}/, which build_dataset.py reads as a directory")
    for g in sorted(req_globs):
        check(any(g in e for e in EXPECTED_RAW),
              f"run book prints the literal glob {g} the loader will match against",
              "a name that does not match the glob is a file the loader cannot see")
    for entry in EXPECTED_RAW:
        head = entry.split()[0]
        check(head in req_files or any(head.startswith(f"data/raw/{d}/") for d in req_dirs),
              f"run book entry {head} is something build_dataset.py actually requires",
              "stale entry — asks a human to copy a file nothing reads")

    # ---- 3. what the fetcher writes matches those globs -------------------- #
    written = re.findall(r'out_dir\s*/\s*f?"([^"]+)"', me) + \
        re.findall(r'_write\(\s*RAW\s*/\s*"[^"]+"\s*/\s*"([^"]+)"', me)
    for g in sorted(req_globs):
        pre, _, suf = g.partition("*")
        check(any(n.startswith(pre) and n.endswith(suf) for n in written),
              f"this script writes filenames matching {g}",
              f"fetcher writes {sorted(written)} — none satisfies the loader's glob")

    # ---- 4. the run book renders, states both routes, and never invents ----- #
    import io as _io
    buf, real = _io.StringIO(), sys.stderr
    sys.stderr = buf
    try:
        _runbook(["kev"])
    finally:
        sys.stderr = real
    book = buf.getvalue()
    check("Blocked on: kev" in book, "a failure list reaches the printed run book")
    check("coworkEgressAllowedHosts" in book, "route A names the setting that has to change")
    check("copy the data in" in book, "route B is offered, so a closed allowlist is not a dead end")
    check(all(h in book for h in EGRESS_HOSTS), "every host is printed for the allowlist")
    check(all(e.split()[0] in book for e in EXPECTED_RAW), "every required path is printed")
    check("not substitute generated data" in book,
          "the run book still refuses synthetic substitution in writing")
    check("npm run check:all" in book, "the re-verification step survives in the handoff")

    bad = [c for c in checks if not c[0]]
    for ok, label, detail in checks:
        if not ok:
            print(f"  FAIL  {label}" + (f"\n        {detail}" if detail else ""))
    print(f"\nfetch_real_data.py: {len(checks) - len(bad)}/{len(checks)} handoff checks passed")
    return 1 if bad else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--all", action="store_true", help="fetch all four datasets")
    ap.add_argument("--kev", action="store_true")
    ap.add_argument("--epss", action="store_true")
    ap.add_argument("--nvd", action="store_true")
    ap.add_argument("--vcdb", action="store_true")
    ap.add_argument("--epss-months", type=int, default=30)
    ap.add_argument("--nvd-start-year", type=int, default=2016)
    ap.add_argument("--nvd-api-key", default=os.environ.get("NVD_API_KEY"))
    ap.add_argument("--runbook", action="store_true",
                    help="print the handoff for getting data/raw/ populated, and exit; "
                         "touches no network")
    ap.add_argument("--selftest", action="store_true",
                    help="check the run book still matches build_dataset.py; no network, no data")
    args = ap.parse_args()

    if args.selftest:
        return _selftest()

    if args.runbook:
        _runbook()
        return 0

    jobs = []
    if args.all or args.kev:
        jobs.append(("kev", lambda: fetch_kev()))
    if args.all or args.epss:
        jobs.append(("epss", lambda: fetch_epss(months=args.epss_months)))
    if args.all or args.nvd:
        jobs.append(("nvd", lambda: fetch_nvd(args.nvd_start_year, args.nvd_api_key)))
    if args.all or args.vcdb:
        jobs.append(("vcdb", lambda: fetch_vcdb()))

    if not jobs:
        ap.print_help()
        return 2

    RAW.mkdir(parents=True, exist_ok=True)
    failed: list[str] = []
    for name, job in jobs:
        try:
            job()
        except Exception as exc:                        # keep going; report at the end
            print(f"  !! {name} failed: {exc}", file=sys.stderr)
            failed.append(name)

    receipt = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "requested": [n for n, _ in jobs],
        "failed": failed,
        "sources": {"kev": KEV_URL, "epss": EPSS_DAY_URL, "nvd": NVD_API_URL,
                    "vcdb": VCDB_ZIP_URL},
    }
    (RAW / "fetch_receipt.json").write_text(json.dumps(receipt, indent=2))
    print(f"\nreceipt: data/raw/fetch_receipt.json")
    if failed:
        print(f"FAILED: {', '.join(failed)}", file=sys.stderr)
        _runbook(failed)
        return 1
    print("all requested datasets present")
    if len(jobs) == 4:
        print("next: python3 ml/build_dataset.py && python3 ml/train.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
