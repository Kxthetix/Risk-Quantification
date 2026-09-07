/**
 * Runs the pipeline the application actually runs, on the scan the application actually ships.
 *
 * The three existing harnesses each cover one component: check-compliance.cjs the crosswalk,
 * check-engine.cjs the model artefact and `score()`, check-exports.cjs the PDF and XLSX writers.
 * None of them calls `processScanData` — the one function every screen's numbers come out of — and
 * the exporters have only ever been fed a fixture assembled by hand in the harness. So the seam
 * between them was untested in both directions: `processScanData` could stop attributing a basis,
 * or `reports.ts` could start reading a field the pipeline does not emit, and everything would
 * still pass.
 *
 * This drives the real chain, three times over:
 *
 *   1. the bundled scan with NO engine        — the state the deployed app is in today
 *   2. the bundled scan with a trained engine — no CVSS vectors, so KEV observation only
 *   3. an enriched copy of it                 — all three score bases present at once
 *
 * and then feeds the resulting `ProcessedScanResult` to the optimiser, the what-if simulator, the
 * compliance adapter and both exporters.
 *
 * The model artefact here is four hand-written leaves built by this file, labelled as such in its
 * own `generator` string. It exists to make the model branch reachable. No figure it produces is a
 * measurement, and no metric from this harness is model performance.
 *
 * Run: node scripts/check-pipeline.cjs
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-check-'));

let failures = 0;
let checks = 0;

function check(label, condition, detail) {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

const near = (a, b, tol) => Math.abs(a - b) <= tol;

execFileSync(
  process.execPath,
  [
    path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--module', 'commonjs',
    '--target', 'es2020',
    '--moduleResolution', 'node',
    '--strict',
    '--skipLibCheck',
    '--lib', 'es2020,dom',
    '--outDir', OUT,
    path.join(ROOT, 'src', 'utils', 'riskUtils.ts'),
    path.join(ROOT, 'src', 'export', 'reports.ts'),
  ],
  { stdio: 'inherit' }
);

const risk = require(path.join(OUT, 'utils', 'riskUtils.js'));
const engineMod = require(path.join(OUT, 'model', 'engine.js'));
const features = require(path.join(OUT, 'model', 'features.js'));
const reports = require(path.join(OUT, 'export', 'reports.js'));

const CROSSWALK = fs.readFileSync(path.join(ROOT, 'public', 'frameworks', 'crosswalk.json'), 'utf8');
const SCAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'sample-scan.json'), 'utf8'));
const crosswalkDoc = JSON.parse(CROSSWALK);
const VULN_KEYS = crosswalkDoc.vulnerability_classes.map((c) => c.key);
const EXPLOIT_NAMES = features.exploitFeatureNames(VULN_KEYS);
const SEVERITY_NAMES = features.severityFeatureNames();

const clone = (v) => JSON.parse(JSON.stringify(v));

/* ------------------------------------------------------------------ the artefact
 * Four leaves and one split, which is the smallest thing `loadRiskEngine` will accept as a model.
 * Deliberately minimal: check-engine.cjs already proves the traversal, the calibrator and the
 * refusals against an independent implementation. What this file needs from a model is only that
 * the model branch is *reachable*, so that `processScanData` has something to route.
 *
 * The one split is on EPSS, so two findings with different EPSS get different probabilities and an
 * assertion about "the model produced this" cannot pass on a constant.
 */
const idx = (names, name) => {
  const i = names.indexOf(name);
  if (i < 0) throw new Error(`feature "${name}" is not in the vocabulary — this harness is stale`);
  return i;
};
const EPSS_COL = idx(EXPLOIT_NAMES, 'epss');

const FIXTURE_NOTE =
  'HARNESS FIXTURE built by scripts/check-pipeline.cjs. One split and four leaves. NOT a trained ' +
  'model, NOT fitted to anything, and no figure derived from it is a measurement.';

const columnar = (nodes) => ({
  feature: nodes.map((n) => n.feature),
  threshold: nodes.map((n) => n.threshold),
  left: nodes.map((n) => n.left),
  right: nodes.map((n) => n.right),
  value: nodes.map((n) => n.value),
});
const leaf = (value) => ({ feature: -1, threshold: 0, left: 0, right: 0, value });
const split = (feature, threshold, left, right) => ({ feature, threshold, left, right, value: 0 });

const EXPLOIT_GBM = {
  objective: 'logistic',
  learning_rate: 1,
  base_score: -1,
  n_features: EXPLOIT_NAMES.length,
  feature_names: EXPLOIT_NAMES,
  n_trees: 2,
  trees: [columnar([split(EPSS_COL, 0.5, 1, 2), leaf(-0.5), leaf(1.5)]), columnar([leaf(0.2)])],
};

// A pure leaf on each severity head: log10(USD). The band is therefore the same for every finding,
// which makes the exchange-rate and asset-value-cap assertions below read as arithmetic rather than
// as a comparison between two numbers that both moved.
const severityHead = (log10Usd, objective) => ({
  objective,
  learning_rate: 1,
  base_score: 0,
  n_features: SEVERITY_NAMES.length,
  feature_names: SEVERITY_NAMES,
  n_trees: 1,
  trees: [columnar([leaf(log10Usd)])],
});
const SEV_MEAN_LOG10 = 5;   // $100,000
const SEV_P10_LOG10 = 4.5;  // $31,623
const SEV_P90_LOG10 = 5.5;  // $316,228

const CALIBRATION = { method: 'isotonic', n_fit: 0, n_knots: 4, x: [0, 0.1, 0.4, 1], y: [0, 0.05, 0.5, 0.95] };

function artefact() {
  return clone({
    schema_version: engineMod.MODEL_SCHEMA_VERSION,
    generated_at: '2026-09-02T00:00:00+00:00',
    generator: `scripts/check-pipeline.cjs — ${FIXTURE_NOTE}`,
    data_is_real: false,
    data_provenance: {
      dataset_card_generated_at: null,
      sources: FIXTURE_NOTE,
      exploitation_question: 'fixture',
      severity_question: 'fixture',
      train_anchor: 'fixture',
      test_anchor: 'fixture',
    },
    exploitation: {
      feature_names: EXPLOIT_NAMES,
      gbm: EXPLOIT_GBM,
      calibration: CALIBRATION,
      metrics: {
        evaluated_on: 'a fixture, so nothing',
        calibration: {
          method: 'isotonic',
          applied: true,
          n_calibration_rows: 0,
          selection_slice: 'fixture',
          brier_identity_selection: 0,
          brier_isotonic_selection: 0,
        },
      },
    },
    severity: {
      feature_names: SEVERITY_NAMES,
      unit: 'log10_usd',
      mean: severityHead(SEV_MEAN_LOG10, 'l2'),
      p10: severityHead(SEV_P10_LOG10, 'quantile'),
      p90: severityHead(SEV_P90_LOG10, 'quantile'),
      metrics: { evaluated_on: 'a fixture, so nothing', target: 'log10(fixture)' },
    },
    parity_max_abs_delta: {},
  });
}

/*
 * The parity fixture the engine verifies itself against. Expected values are written out from the
 * tree definitions above by hand, not obtained by calling gbm.ts — if they were, verification would
 * be comparing the shipped code with itself and would pass however wrong it was.
 */
const PARITY_ROWS = [0.05, 0.5, 0.51, 0.97].map((epss) => {
  const row = new Array(EXPLOIT_NAMES.length).fill(0);
  row[EPSS_COL] = epss;
  return row;
});
const refRaw = (epss) => -1 + (epss <= 0.5 ? -0.5 : 1.5) + 0.2;
const refSigmoid = (z) => 1 / (1 + Math.exp(-z));
const refInterp = (p) => {
  const { x, y } = CALIBRATION;
  if (p <= x[0]) return y[0];
  if (p >= x[x.length - 1]) return y[y.length - 1];
  for (let i = 1; i < x.length; i += 1) {
    if (p <= x[i]) return y[i - 1] + ((p - x[i - 1]) * (y[i] - y[i - 1])) / (x[i] - x[i - 1]);
  }
  return y[y.length - 1];
};

function parityFixture() {
  const raw = PARITY_ROWS.map((r) => refRaw(r[EPSS_COL]));
  const prob = raw.map(refSigmoid);
  const sevRows = [new Array(SEVERITY_NAMES.length).fill(0), new Array(SEVERITY_NAMES.length).fill(0.5)];
  return clone({
    note: `${FIXTURE_NOTE} Expected values are written out from the tree definitions by hand.`,
    exploitation: {
      feature_names: EXPLOIT_NAMES,
      rows: PARITY_ROWS,
      expected_raw: raw,
      expected_probability: prob,
      expected_calibrated: prob.map(refInterp),
    },
    severity: {
      feature_names: SEVERITY_NAMES,
      rows: sevRows,
      expected_log10_mean: sevRows.map(() => SEV_MEAN_LOG10),
      expected_log10_p10: sevRows.map(() => SEV_P10_LOG10),
      expected_log10_p90: sevRows.map(() => SEV_P90_LOG10),
    },
  });
}

const MODEL_URL = '/model/risk-model.json';
const FIXTURE_URL = '/model/parity-fixture.json';
const CROSSWALK_URL = '/frameworks/crosswalk.json';

/** Stub the global `fetch` rather than injecting, so the real load path runs unmodified. */
function loadEngine({ withModel }) {
  const routes = { [CROSSWALK_URL]: CROSSWALK };
  if (withModel) {
    routes[MODEL_URL] = JSON.stringify(artefact());
    routes[FIXTURE_URL] = JSON.stringify(parityFixture());
  }
  global.fetch = async (url) => {
    const body = routes[String(url)];
    // `headers` is part of the interface the loader is allowed to assume — it reads content-type to
    // corroborate a markup body. A stub without it would crash rather than report.
    const headers = (value) => ({ get: (n) => (String(n).toLowerCase() === 'content-type' ? value : null) });
    if (body === undefined) {
      return { ok: false, status: 404, headers: headers('text/html'), text: async () => 'Not Found',
        json: async () => { throw new Error('no body'); } };
    }
    return { ok: true, status: 200, headers: headers('application/json'),
      json: async () => JSON.parse(body), text: async () => body };
  };
  return engineMod.loadRiskEngine({ modelUrl: MODEL_URL, fixtureUrl: FIXTURE_URL, crosswalkUrl: CROSSWALK_URL });
}

/*
 * A copy of the bundled scan with CVSS vectors added to three of its six non-KEV findings.
 *
 * Needed because the bundled scan carries none, so with it alone the exploitation model is
 * unreachable and the `model` basis never appears — leaving the mixed-coverage state, the one every
 * provenance banner and every "of which" row on the exports exists to describe, produced by nothing
 * and asserted by nothing. Three of six, so that `heuristic` survives alongside it and all three
 * bases are present at once.
 *
 * In memory only. Nothing here is written to public/, and the scan on disk still honestly carries
 * no vectors.
 */
const HARNESS_VECTOR = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';
function enrichedScan() {
  const copy = clone(SCAN);
  let filled = 0;
  for (const f of copy.findings) {
    if (f.actively_exploited || filled >= 3) continue;
    f.enrichment = {
      cvss_vector: HARNESS_VECTOR,
      cwe_ids: ['CWE-89'],
      published_date: '2026-02-01T00:00:00Z',
      reference_tags: ['Exploit', 'Vendor Advisory'],
      reference_count: 4,
      epss_percentile: 0.9,
      epss_velocity_90d: 0.01,
      epss_max_to_date: f.epss_score,
    };
    filled += 1;
  }
  copy.enrichment_provenance = {
    source: FIXTURE_NOTE,
    generated_at: '2026-09-02T00:00:00Z',
    nvd_records_matched: filled,
    epss_snapshot: '2026-08-28',
  };
  return copy;
}

async function main() {
  /* ============================================================ 1. no engine */
  section('processScanData(): the bundled scan with no engine — the deployed state today');
  const bare = risk.processScanData(SCAN, null, 'harness: no artefact was served');

  check('every finding survives ingest', bare.findings.length === SCAN.findings.length,
    `${bare.findings.length} of ${SCAN.findings.length}`);
  check('no engine means no model figure anywhere',
    bare.model.scored === 0 && bare.findings.every((f) => f.score_basis === 'heuristic' && f.model_score === null));
  check('the state is reported as absent, not as trained-with-nothing', bare.model.status.state === 'absent',
    bare.model.status.state);
  check('the reason the engine is missing reaches the result rather than a console',
    bare.model.status.detail.some((d) => d.includes('harness: no artefact was served')),
    JSON.stringify(bare.model.status.detail));
  check('org and rate are null, so nothing downstream can print a rate that was never used',
    bare.model.org === null && bare.model.usdInr === null);
  check('the crosswalk is null without an engine, and the compliance adapter refuses rather than mapping partially',
    bare.crosswalk === null && risk.buildScanComplianceReport(bare) === null);

  // The three invariants every screen depends on, recomputed here from the findings rather than
  // read back from the fields that claim them.
  const sumOf = (result) => result.findings.reduce((s, f) => s + f.expected_loss_inr, 0);
  const basisSum = (result) =>
    Object.values(result.model.byBasis).reduce((s, b) => s + b.exposureInr, 0);
  const basisCount = (result) =>
    Object.values(result.model.byBasis).reduce((s, b) => s + b.findings, 0);
  check('the headline total is the sum of the findings', sumOf(bare) === bare.totalFinancialExposureInr,
    `${sumOf(bare)} vs ${bare.totalFinancialExposureInr}`);
  check('byBasis reconstructs the headline total exactly', basisSum(bare) === bare.totalFinancialExposureInr,
    `${basisSum(bare)} vs ${bare.totalFinancialExposureInr}`);
  check('byBasis counts every finding exactly once', basisCount(bare) === bare.findings.length,
    `${basisCount(bare)} vs ${bare.findings.length}`);
  check('findings are ranked on money, descending',
    bare.findings.every((f, i) => i === 0 || bare.findings[i - 1].expected_loss_inr >= f.expected_loss_inr));
  check('the tier on each finding is the tier its index implies',
    bare.findings.every((f) => f.tier.label === risk.getRiskTier(f.computed_risk_score).label));
  check('the org index is the same function applied to the portfolio totals', (() => {
    const totalValue = bare.findings.reduce((s, f) => s + f.asset.estimated_asset_value_inr, 0);
    return bare.overallOrgRiskScore ===
      engineMod.lossRatioToRiskIndex(bare.totalFinancialExposureInr, totalValue);
  })());
  check('the actively-exploited count matches the scan file',
    bare.activelyExploitedCount === SCAN.findings.filter((f) => f.actively_exploited).length);
  check('the illustrative trend is 14 points and ends on the computed figures',
    bare.trendData.length === 14 &&
    bare.trendData[13].riskScore === bare.overallOrgRiskScore &&
    bare.trendData[13].financialExposure === bare.totalFinancialExposureInr);
  /*
   * The trend SHAPE is illustrative and captioned as such. Its DATES are a factual claim about
   * when the figures apply, and they used to be fabricated: `new Date(scanDateStr || '2026-08-28')`
   * gave an undated scan a hard-coded calendar, turned an unparseable date into fourteen labels
   * reading "Invalid Date", and shifted every label back a day for any reader west of Greenwich
   * (UTC-midnight parse, local-time render). None of that was reachable from any harness.
   */
  check('the trend is anchored on the scan date the file states, not on today or a constant',
    bare.trendData[13].iso === SCAN.scan_metadata.scan_date,
    `${bare.trendData[13].iso} vs scan_date ${SCAN.scan_metadata.scan_date}`);
  check('the 13 preceding points are the 13 preceding calendar days, in order, no gaps or repeats',
    bare.trendData.every((p, i) => {
      const expected = new Date(Date.parse(`${SCAN.scan_metadata.scan_date}T00:00:00Z`) - (13 - i) * 86400000)
        .toISOString().slice(0, 10);
      return p.iso === expected;
    }),
    bare.trendData.map((p) => p.iso).join(','));
  check('the axis label carries no year, and the ISO date carries one, so a window crossing new year is not mislabelled',
    bare.trendData.every((p) => !/\d{4}/.test(p.date) && /^\d{4}-\d{2}-\d{2}$/.test(p.iso)),
    bare.trendData.map((p) => `${p.date}|${p.iso}`).join(' '));
  {
    // A month boundary and a year boundary, which is where the arithmetic and the label diverge.
    const jan = clone(SCAN);
    jan.scan_metadata.scan_date = '2026-01-05';
    const janTrend = risk.processScanData(jan, null, null).trendData;
    check('a scan dated 05 Jan 2026 starts on 23 Dec 2025 — the window crosses the year correctly',
      janTrend[0].iso === '2025-12-23' && janTrend[0].date === 'Dec 23' && janTrend[13].date === 'Jan 05',
      `${janTrend[0].iso} / ${janTrend[0].date} / ${janTrend[13].date}`);
    check('and the year printed with each point is that point\'s own year, not the scan\'s',
      janTrend[0].iso.slice(0, 4) === '2025' && janTrend[13].iso.slice(0, 4) === '2026');

    // An undated scan, and a scan whose date is not a date. Both must decline to state a calendar.
    for (const [label, value] of [['no date at all', undefined], ['an unparseable date', 'n/a'],
                                  ['an impossible day', '2026-02-31'], ['a US-format date', '08/28/2026']]) {
      const undated = clone(SCAN);
      if (value === undefined) delete undated.scan_metadata.scan_date;
      else undated.scan_metadata.scan_date = value;
      const t = risk.processScanData(undated, null, null).trendData;
      check(`a scan with ${label} gets day offsets, never an invented calendar`,
        t.length === 14 && t.every((p) => p.iso === null) &&
        t.every((p, i) => p.date === `Day -${13 - i}`) &&
        !t.some((p) => /Invalid|2026-08-28|NaN/.test(p.date)),
        t.map((p) => `${p.date}|${p.iso}`).slice(0, 3).join(' '));
    }
    check('and the figures on an undated scan are unaffected — only the dates are withheld',
      risk.processScanData((() => { const u = clone(SCAN); delete u.scan_metadata.scan_date; return u; })(), null, null)
        .trendData[13].financialExposure === bare.trendData[13].financialExposure);

    /*
     * The axis must not depend on where the reader is sitting. This is asserted as a property
     * rather than left to the ambient zone, because the bug it guards against is invisible in
     * most of them: the old code parsed `YYYY-MM-DD` as UTC midnight and rendered it with
     * `toLocaleDateString`, so every label shifted back one day west of Greenwich and was correct
     * everywhere else. Reinstating that code fails 3 checks under America/Los_Angeles and 0 under
     * UTC or Asia/Calcutta — so a harness that only ran in the developer's zone would have
     * certified it. Four zones, two either side of the line, all required to agree.
     */
    const zones = ['UTC', 'America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Calcutta', 'Pacific/Kiritimati'];
    const original = process.env.TZ;
    const rendered = zones.map((tz) => {
      process.env.TZ = tz;
      const t = risk.processScanData(clone(SCAN), null, null).trendData;
      return t.map((p) => `${p.iso}|${p.date}`).join(',');
    });
    if (original === undefined) delete process.env.TZ; else process.env.TZ = original;
    check(`the axis is identical in all ${zones.length} time zones tried, ${zones.length - 1} of them not the host's`,
      rendered.every((r) => r === rendered[0]),
      zones.map((tz, i) => `${tz}: ${rendered[i].slice(0, 26)}`).join(' / '));
  check('and the host zone was restored, so no later check is reading a mutated environment',
      process.env.TZ === original);
  }

  /*
   * The feature anchor, and the invariant that ties it to the axis above.
   *
   * Two features read the scan date — how long each CVE had been public, and the severity model's
   * incident year — and when the scan states nothing parseable the anchor falls back to today. That
   * fallback is defensible (a browser has nothing better) but it is DIRECTIONAL: today is later than
   * any scan, so every CVE looks older than it was. `ml/enrich_scan.py` refuses the same
   * substitution outright on the training side, so on this side it has to be declared.
   *
   * The invariant: one field, one parser. The axis used `new Date` before and now uses a strict ISO
   * parse; the anchor used `new Date` too. Had only one been tightened, the same string could leave
   * the chart saying "this scan states no date" while every finding was scored against a date
   * invented from it — `'2026-02-31'` and `'08/28/2026'` are exactly the strings that would do it.
   */
  check('the anchor is the date the scan states, and is reported as stated',
    bare.model.scanDateAnchor.stated === SCAN.scan_metadata.scan_date &&
    bare.model.scanDateAnchor.used === SCAN.scan_metadata.scan_date,
    JSON.stringify(bare.model.scanDateAnchor));
  for (const [label, value] of [['no date at all', undefined], ['an unparseable date', 'n/a'],
                                ['an impossible day', '2026-02-31'], ['a US-format date', '08/28/2026']]) {
    const s = clone(SCAN);
    if (value === undefined) delete s.scan_metadata.scan_date;
    else s.scan_metadata.scan_date = value;
    // Read either side of the call: the substituted anchor is today in UTC, and a run that
    // straddles UTC midnight would otherwise flake once a day rather than report a real defect.
    const before = new Date().toISOString().slice(0, 10);
    const r = risk.processScanData(s, null, null);
    const after = new Date().toISOString().slice(0, 10);
    check(`a scan with ${label} declares the anchor substituted, and uses today`,
      r.model.scanDateAnchor.stated === null &&
      (r.model.scanDateAnchor.used === before || r.model.scanDateAnchor.used === after),
      `${JSON.stringify(r.model.scanDateAnchor)} vs ${before}/${after}`);
    check(`and the axis agrees with the anchor on ${label} — one field, one parser`,
      (r.trendData[13].iso === null) === (r.model.scanDateAnchor.stated === null),
      `axis iso=${r.trendData[13].iso} anchor stated=${r.model.scanDateAnchor.stated}`);
  }
  check('a stated date agrees the other way too: the axis dates it and the anchor calls it stated',
    bare.trendData[13].iso === bare.model.scanDateAnchor.stated,
    `${bare.trendData[13].iso} vs ${bare.model.scanDateAnchor.stated}`);
  /*
   * The axis window. `domain={[30, 100]}` was hard-coded in the chart, which clips any portfolio
   * scoring below 30 entirely off the bottom — and the index legitimately reaches 0 (0.01% of asset
   * value), so that is the well-secured case being hidden. Moved into riskUtils precisely so it can
   * be asserted: no harness here can execute JSX, so arithmetic inside a component is unchecked.
   */
  for (const series of [[0, 0, 0], [4, 5, 6], [18, 19, 20], [50, 52, 55], [96, 98, 100],
                        [0, 50, 100], bare.trendData.map((p) => p.riskScore)]) {
    const pts = series.map((riskScore) => ({ riskScore }));
    const [lo, hi] = risk.riskTrendDomain(pts);
    check(`axis window for [${series.join(',')}] contains every point, stays inside 0..100, spans >= ${risk.TREND_AXIS_MIN_SPAN}`,
      lo >= 0 && hi <= 100 && lo <= Math.min(...series) && hi >= Math.max(...series) &&
      hi - lo >= risk.TREND_AXIS_MIN_SPAN,
      `[${lo}, ${hi}]`);
  }
  check('an all-zero portfolio is drawn against a floor of 0, not clipped off the chart',
    risk.riskTrendDomain([{ riskScore: 0 }])[0] === 0);
  check('a maxed-out portfolio is drawn against a ceiling of 100, not beyond it',
    risk.riskTrendDomain([{ riskScore: 100 }])[1] === 100);
  check('an empty series still yields the full index range rather than NaN',
    JSON.stringify(risk.riskTrendDomain([])) === '[0,100]',
    JSON.stringify(risk.riskTrendDomain([])));
  check('every fallback explanation says it is the deterministic formula, and none claims a probability',
    bare.findings.every((f) =>
      f.ai_explanation.includes('deterministic CVSS/EPSS formula') &&
      !/probability of entering/.test(f.ai_explanation)));

  /* A finding whose asset is missing from the inventory. The pipeline substitutes a placeholder
   * asset rather than throwing, which is right — the finding is real and dropping it would
   * understate the count. What the placeholder must not do is carry a *value*. It used to default
   * to ₹2,00,00,000, so eighteen dangling findings manufactured ₹5.33 crore of "exposure" out of a
   * constant, and it looked exactly like measured exposure in the board report. The substitute is
   * now worth zero and the substitution is reported, so the total is a visible under-statement
   * instead of an invisible over-statement. */
  const orphaned = clone(SCAN);
  orphaned.findings[0].asset_id = 'AST-DOES-NOT-EXIST';
  const orphanResult = risk.processScanData(orphaned, null, null);
  const orphanFinding = orphanResult.findings.find((f) => f.asset_id === 'AST-DOES-NOT-EXIST');
  check('a finding pointing at an unknown asset is scored against a named placeholder, not dropped',
    orphanResult.findings.length === orphaned.findings.length && !!orphanFinding);
  check('and the placeholder names the asset_id that dangled, so it can be traced to the scan file',
    !!orphanFinding && /AST-DOES-NOT-EXIST/.test(orphanFinding.asset.asset_name),
    orphanFinding && orphanFinding.asset.asset_name);
  check('and it contributes no rupees, rather than a fabricated ₹2 crore default',
    !!orphanFinding && orphanFinding.asset.estimated_asset_value_inr === 0 &&
    orphanFinding.expected_loss_inr === 0,
    orphanFinding && `value=${orphanFinding.asset.estimated_asset_value_inr} loss=${orphanFinding.expected_loss_inr}`);
  check('and the substitution is reported as an error, because the stated total is now a lower bound',
    orphanResult.dataQuality.issues.some((i) =>
      i.code === 'finding_asset_unknown' && i.severity === 'error' && i.count === 1),
    JSON.stringify(orphanResult.dataQuality.issues.map((i) => `${i.code}:${i.severity}:${i.count}`)));
  check('and the exposure it would have carried is missing from the total, not silently included',
    orphanResult.totalFinancialExposureInr < bare.totalFinancialExposureInr,
    `${orphanResult.totalFinancialExposureInr} vs clean ${bare.totalFinancialExposureInr}`);


  /* ================================================ 2. trained engine, no vectors */
  section('processScanData(): a trained engine against the bundled scan, which carries no vectors');
  const engine = await loadEngine({ withModel: true });
  check('the artefact loaded and was accepted', engine.status.state === 'trained',
    `${engine.status.state}: ${engine.status.detail.join(' | ')}`);
  check('and it is flagged as not real data, because it is a harness fixture',
    engine.status.dataIsReal === false);
  check('parity passed, so the browser arithmetic matches the hand-written expectations',
    engine.parity !== null && engine.parity.passed,
    engine.parity ? engine.parity.failures.join('; ') : 'no parity report');

  const kevCount = SCAN.findings.filter((f) => f.actively_exploited).length;
  const trained = risk.processScanData(SCAN, engine, null);
  check(`all ${kevCount} KEV findings score, and only by observation`,
    trained.model.byBasis.observed_kev.findings === kevCount && trained.model.byBasis.model.findings === 0,
    JSON.stringify(trained.model.byBasis));
  check('the rest fall back, because 24 of 66 exploitation columns come from a vector the scan lacks',
    trained.model.byBasis.heuristic.findings === SCAN.findings.length - kevCount);
  check('byBasis still reconstructs the headline total once two methods are mixed',
    basisSum(trained) === trained.totalFinancialExposureInr,
    `${basisSum(trained)} vs ${trained.totalFinancialExposureInr}`);
  check('the assumptions the engine scored under travel to the result',
    trained.model.usdInr === engineMod.USD_INR_ASSUMPTION.rate && trained.model.org !== null);
  check('a KEV finding is stated as observed rather than predicted',
    trained.findings.filter((f) => f.score_basis === 'observed_kev')
      .every((f) => f.ai_explanation.includes('observed, not predicted') &&
                    f.model_score.exploitProbability === 1));
  check('an observed KEV probability of 1 is not dressed up as a model output',
    trained.findings.filter((f) => f.score_basis === 'observed_kev')
      .every((f) => f.model_score.probabilityBasis === 'observed_kev'));

  const trainedReport = risk.buildScanComplianceReport(trained);
  check('the compliance report builds once a crosswalk is present', trainedReport !== null);
  const metricBy = (report, key) => report.metrics.find((m) => m.key === key);
  const trainedProb = metricBy(trainedReport, 'exploitation_probability');
  check('the exploitation-probability metric reports no value, because averaging observations would state a model figure the model never produced',
    trainedProb !== undefined && trainedProb.value === null, JSON.stringify(trainedProb && trainedProb.value));
  check('and the register says exactly why, naming the missing vector rather than blaming something generic',
    /None of the \d+ findings the model could have predicted carried the CVSS vector/.test(
      String(trainedProb.unavailableReason)),
    String(trainedProb && trainedProb.unavailableReason));
  check('the metrics that DO NOT need the model are still reported, so a missing head does not blank the register',
    ['expected_annual_loss', 'critical_finding_count', 'actively_exploited_count']
      .every((k) => metricBy(trainedReport, k) && metricBy(trainedReport, k).value !== null),
    JSON.stringify(['expected_annual_loss', 'critical_finding_count', 'actively_exploited_count']
      .map((k) => [k, metricBy(trainedReport, k) && metricBy(trainedReport, k).value])));


  /* ============================= 3. all three bases at once, on an enriched copy */
  section('processScanData(): mixed coverage — model, observed KEV and fallback in one scan');
  const enriched = enrichedScan();
  const mixed = risk.processScanData(enriched, engine, null);

  check('all three score bases are present at once, which is the state the provenance UI exists for',
    mixed.model.byBasis.model.findings > 0 &&
    mixed.model.byBasis.observed_kev.findings > 0 &&
    mixed.model.byBasis.heuristic.findings > 0,
    JSON.stringify(mixed.model.byBasis));
  check('only the findings given a vector reached the exploitation model',
    mixed.model.byBasis.model.findings === enriched.findings.filter(
      (f) => !f.actively_exploited && f.enrichment && f.enrichment.cvss_vector).length,
    `${mixed.model.byBasis.model.findings} model-scored`);
  check('byBasis reconstructs the headline total across all three methods',
    basisSum(mixed) === mixed.totalFinancialExposureInr && basisCount(mixed) === mixed.findings.length,
    `${basisSum(mixed)} vs ${mixed.totalFinancialExposureInr}`);
  check('the scan\'s enrichment statement is carried to the result rather than left in the file',
    mixed.model.enrichment !== null && mixed.model.enrichment.nvd_records_matched === 3,
    JSON.stringify(mixed.model.enrichment));

  const modelScored = mixed.findings.filter((f) => f.score_basis === 'model');
  check('a model-scored expected loss is the model\'s own mean, rounded and not recomputed',
    modelScored.every((f) => f.expected_loss_inr === Math.round(f.model_score.eal.mean)));
  check('each model probability is strictly between 0 and 1 — a prediction, not an observation',
    modelScored.every((f) => f.model_score.exploitProbability > 0 &&
                             f.model_score.exploitProbability < 1 &&
                             f.model_score.probabilityBasis === 'model'));
  check('the loss band is ordered p10 <= mean <= p90 after the engine sorts the two quantile heads',
    modelScored.every((f) => f.model_score.lossInr.p10 <= f.model_score.lossInr.mean &&
                             f.model_score.lossInr.mean <= f.model_score.lossInr.p90));
  check('a model explanation states the horizon and the question the probability answers',
    modelScored.every((f) => f.ai_explanation.includes('365 days') &&
                             f.ai_explanation.includes("KEV catalogue")));
  check('EAL is probability x loss, so the two figures on screen multiply to the third',
    modelScored.every((f) => near(f.model_score.eal.mean,
      f.model_score.exploitProbability * f.model_score.lossInr.mean, 1)),
    JSON.stringify(modelScored.map((f) => [f.model_score.eal.mean,
      f.model_score.exploitProbability * f.model_score.lossInr.mean])));
  check('the loss band is capped at the asset value where the asset is worth less than the modelled loss',
    modelScored.every((f) => f.model_score.lossInr.mean <= f.asset.estimated_asset_value_inr + 1),
    JSON.stringify(modelScored.map((f) => [f.model_score.lossInr.mean, f.asset.estimated_asset_value_inr])));
  check('at least one finding actually hit that cap, so the branch is exercised rather than assumed',
    modelScored.some((f) => f.model_score.lossCappedAtAssetValue),
    JSON.stringify(modelScored.map((f) => f.model_score.lossCappedAtAssetValue)));
  check('where the cap bound, the clipped figure IS the asset value — not a scaled-down approximation of it',
    modelScored.filter((f) => f.model_score.lossCappedAtAssetValue)
      .every((f) => near(f.model_score.lossInr.p90, f.asset.estimated_asset_value_inr, 1)),
    JSON.stringify(modelScored.filter((f) => f.model_score.lossCappedAtAssetValue)
      .map((f) => [f.model_score.lossInr.p90, f.asset.estimated_asset_value_inr])));

  const mixedReport = risk.buildScanComplianceReport(mixed);
  const mixedProb = metricBy(mixedReport, 'exploitation_probability');
  check('with real predictions present the probability metric reports a value',
    mixedProb.value !== null, JSON.stringify(mixedProb.value));
  check('and that mean is over the predicted findings only — including the KEV observations would move it',
    (() => {
      const predicted = modelScored.reduce((s, f) => s + f.model_score.exploitProbability, 0) / modelScored.length;
      const scoredAll = mixed.findings.filter((f) => f.model_score);
      const withKev = scoredAll.reduce((s, f) => s + f.model_score.exploitProbability, 0) / scoredAll.length;
      const m = /^([\d.]+)%/.exec(String(mixedProb.value));
      return m !== null && Math.abs(Number(m[1]) - predicted * 100) < 0.6 && withKev - predicted > 0.3;
    })(),
    String(mixedProb.value));
  check('the metric states its denominator and says the KEV findings were excluded by observation',
    /mean over 3 of 18 findings/.test(String(mixedProb.value)) &&
    /12 findings are listed in CISA KEV/.test(String(mixedProb.value)) &&
    /by observation, not by prediction/.test(String(mixedProb.value)),
    String(mixedProb.value));

  /* ================== 4. a restated assumption, all the way through the pipeline */
  section('withAssumptions(): restating the rate or the profile repriced the portfolio');
  const byId = (result) => new Map(result.findings.map((f) => [f.finding_id, f]));
  const mixedById = byId(mixed);

  const doubled = risk.processScanData(enriched, engine.withAssumptions({ usdInr: engineMod.USD_INR_ASSUMPTION.rate * 2 }), null);
  const doubledById = byId(doubled);
  check('the rate reaches the result, so the exports cannot print a rate the figures were not built on',
    doubled.model.usdInr === engineMod.USD_INR_ASSUMPTION.rate * 2, String(doubled.model.usdInr));
  check('doubling the rate doubles an uncapped modelled loss exactly, because the model works in dollars',
    (() => {
      // Filtered on the mean rather than on `lossCappedAtAssetValue`: that flag is raised when ANY
      // part of the band is capped, and here it is p90 that clips first. A mean that is strictly
      // below the asset value is the only one free to move linearly with the rate.
      const pairs = modelScored
        .map((f) => [f, doubledById.get(f.finding_id)])
        .filter(([a, b]) => a.model_score.lossInr.mean < a.asset.estimated_asset_value_inr &&
                            b.model_score.lossInr.mean < b.asset.estimated_asset_value_inr);
      return pairs.length > 0 && pairs.every(([a, b]) => near(b.model_score.lossInr.mean, a.model_score.lossInr.mean * 2, 1));
    })());
  check('and it leaves the probability alone — an exchange rate is not evidence about exploitation',
    modelScored.every((f) => doubledById.get(f.finding_id).model_score.exploitProbability ===
                             f.model_score.exploitProbability));
  check('a fallback-scored finding does not move, because the deterministic formula never reads the rate',
    mixed.findings.filter((f) => f.score_basis === 'heuristic')
      .every((f) => doubledById.get(f.finding_id).expected_loss_inr === f.expected_loss_inr));
  check('so the headline total moves, but by less than the rate did — the cap and the fallback both bite',
    doubled.totalFinancialExposureInr > mixed.totalFinancialExposureInr &&
    doubled.totalFinancialExposureInr < mixed.totalFinancialExposureInr * 2,
    `${mixed.totalFinancialExposureInr} -> ${doubled.totalFinancialExposureInr}`);

  const bankOrg = { employeeBand: '1001 to 10000', naics2: '52', sectorLabel: 'Finance and insurance' };
  const asBank = risk.processScanData(enriched, engine.withAssumptions({ org: bankOrg }), null);
  const bankById = byId(asBank);
  check('a stated organisation profile reaches the result, so the register can name the comparison set',
    asBank.model.org !== null && asBank.model.org.sectorLabel === 'Finance and insurance',
    JSON.stringify(asBank.model.org));
  check('the profile is a severity input, so it can move a modelled loss but never a probability',
    modelScored.every((f) => bankById.get(f.finding_id).model_score.exploitProbability ===
                             f.model_score.exploitProbability));
  check('restating an assumption did not re-fetch or re-verify the artefact — same status and parity objects',
    asBank.model.status === mixed.model.status && asBank.model.parity === mixed.model.parity);
  check('and the coverage split is unchanged, because an assumption cannot make a finding scoreable',
    JSON.stringify(asBank.model.byBasis) === JSON.stringify(mixed.model.byBasis));

  /* ================================= 5. what the pages downstream do with it */
  section('optimiser and what-if: the pages consume the real result object');
  const budget = SCAN.scan_metadata.security_budget_available_inr;
  const opt = risk.runKnapsackOptimization(
    budget, mixed.candidateInvestments, mixed.overallOrgRiskScore, mixed.totalFinancialExposureInr);
  check('the optimiser stays inside the stated budget', opt.totalCost <= budget, `${opt.totalCost} of ${budget}`);
  check('cost and remaining budget account for the whole envelope',
    opt.totalCost + opt.remainingBudget === budget, `${opt.totalCost} + ${opt.remainingBudget}`);
  check('it selected something, so the check below is not vacuous', opt.selectedControls.length > 0);
  check('every finding it claims to address is a finding in this scan',
    opt.addressedFindingIds.every((id) => mixedById.has(id)),
    JSON.stringify(opt.addressedFindingIds.filter((id) => !mixedById.has(id))));
  check('projected risk and exposure are both below current, and neither goes negative',
    opt.projectedRiskScore <= opt.currentRiskScore && opt.projectedExposure < opt.currentExposure &&
    opt.projectedExposure >= 0 && opt.savedExposure >= 0);
  check('the risk index moves by decades of loss, not proportionally — a 50% cut is 10 points wherever you start',
    (() => {
      const a = risk.projectRiskIndex(90, 0.5);
      const b = risk.projectRiskIndex(40, 0.5);
      return 90 - a === 40 - b && near(90 - a, 10, 1);
    })(), `${risk.projectRiskIndex(90, 0.5)} from 90, ${risk.projectRiskIndex(40, 0.5)} from 40`);
  check('the optimiser did not mutate the candidate list it was handed',
    mixed.candidateInvestments.length === SCAN.candidate_investments.length);

  const control = mixed.candidateInvestments[0];
  const funding = (fraction) => risk.simulateWhatIfScenario(
    control, Math.round(control.cost_inr * fraction), mixed.overallOrgRiskScore, mixed.totalFinancialExposureInr);
  check('what-if feasibility bands read Fully / Partially / Insufficient as funding falls',
    funding(1).feasibility === 'Fully Funded' &&
    funding(0.5).feasibility === 'Partially Funded' &&
    funding(0.1).feasibility === 'Insufficient Budget',
    [funding(1).feasibility, funding(0.5).feasibility, funding(0.1).feasibility].join(' / '));
  check('partial funding buys less reduction than full funding, and never more',
    funding(0.5).reductionPct < funding(1).reductionPct &&
    funding(0.5).newExposure > funding(1).newExposure);
  check('over-funding a control does not buy more than the control claims',
    funding(3).reductionPct === funding(1).reductionPct &&
    funding(1).reductionPct <= control.estimated_risk_reduction_pct);

  /* ============================= 6. the ingest gate: what a malformed scan is allowed to do */
  section('validateAndNormalizeScan(): a malformed scan understates visibly or is refused outright');

  /* The bundled scan is the demo, so it is also the regression pin. Every repair below is only
   * trustworthy if the clean path is untouched by it: a validator that quietly rewrites a good
   * scan is worse than none. */
  check('the bundled scan passes the gate with nothing to report',
    bare.dataQuality.issues.length === 0 &&
    bare.dataQuality.errorCount === 0 && bare.dataQuality.warningCount === 0,
    JSON.stringify(bare.dataQuality.issues.map((i) => `${i.severity}:${i.code}`)));
  check('and every asset, finding and control in it was accepted, none dropped',
    bare.dataQuality.assetsAccepted === SCAN.assets.length &&
    bare.dataQuality.findingsAccepted === SCAN.findings.length &&
    bare.dataQuality.controlsAccepted === SCAN.candidate_investments.length &&
    bare.dataQuality.controlsDropped === 0,
    `${bare.dataQuality.assetsAccepted}/${bare.dataQuality.findingsAccepted}/` +
      `${bare.dataQuality.controlsAccepted} dropped ${bare.dataQuality.controlsDropped}`);
  check('and every rupee figure in it is quantifiable, so the headline is not a lower bound',
    bare.dataQuality.assetsWithStatedValue === SCAN.assets.length &&
    bare.dataQuality.findingsQuantifiable === SCAN.findings.length &&
    risk.isCleanScan(bare.dataQuality));
  // The pin itself. If a future change to the validator or to the loss arithmetic moves the demo's
  // headline, this fails and names both numbers, rather than the deck quietly citing a new figure.
  check('the demo figures are unchanged: ₹26,56,87,700 exposure at index 100 across 18 findings',
    bare.totalFinancialExposureInr === 265687700 &&
    bare.overallOrgRiskScore === 100 && bare.findings.length === 18,
    `${bare.totalFinancialExposureInr} / ${bare.overallOrgRiskScore} / ${bare.findings.length}`);

  /* ---------------------------------------------------------- the portfolio denominator
   * `totalAssetValue` used to accumulate inside the findings loop, so the denominator of the
   * portfolio index was "the value of every asset a finding pointed at, once per finding" — five
   * findings on one server counted that server five times, and a server with no findings did not
   * count at all. The bundled scan is exactly 1:1, eighteen findings on eighteen distinct assets,
   * so it cannot see this: the buggy sum and the correct sum are identical there. Hence a fixture.
   */
  const ASSET_A = { asset_id: 'A', asset_name: 'A', asset_type: 'Server',
    business_criticality: 'High', estimated_asset_value_inr: 10000000, data_sensitivity: 'Internal' };
  const ASSET_IDLE = { ...ASSET_A, asset_id: 'B', asset_name: 'B', estimated_asset_value_inr: 90000000 };
  const onA = (finding_id) => ({ finding_id, asset_id: 'A', cve_id: 'CVE-2024-0001',
    cvss_score: 9.8, epss_score: 0.5, actively_exploited: false, vulnerability_name: 'Fixture' });
  const portfolio = (assets, findings) => risk.processScanData({
    scan_metadata: { scan_date: '2026-08-01', organization_name: 'Denominator Fixture',
      security_budget_available_inr: 0 },
    assets, findings, candidate_investments: [] }, null, null);

  const oneAsset = portfolio([ASSET_A], [onA('F1')]);
  const withIdle = portfolio([ASSET_A, ASSET_IDLE], [onA('F1')]);
  const twoOnA = portfolio([ASSET_A, ASSET_IDLE], [onA('F1'), onA('F2')]);
  check('an asset carrying no findings still enlarges the portfolio, lowering the index on the same loss',
    withIdle.totalFinancialExposureInr === oneAsset.totalFinancialExposureInr &&
    withIdle.overallOrgRiskScore < oneAsset.overallOrgRiskScore,
    `index ${oneAsset.overallOrgRiskScore} -> ${withIdle.overallOrgRiskScore} on the same ` +
      `₹${withIdle.totalFinancialExposureInr} — an idle asset was left out of the denominator`);
  check('and a second finding on one asset doubles the loss without counting that asset twice: +10 points, one decade',
    twoOnA.totalFinancialExposureInr === withIdle.totalFinancialExposureInr * 2 &&
    near(twoOnA.overallOrgRiskScore - withIdle.overallOrgRiskScore, 10, 1),
    `${withIdle.overallOrgRiskScore} -> ${twoOnA.overallOrgRiskScore}`);

  /* ------------------------------------------------------------------ refusal, not repair
   * A document whose shape is wrong cannot be repaired, only guessed at, so the gate refuses it and
   * names every problem it found. Every one of these used to be a stack trace with the operator's
   * file nowhere in it — `raw.assets.forEach is not a function` tells whoever exported the scan
   * nothing about what to fix.
   */
  const refuses = (label, doc, expected) => {
    let thrown = null;
    try { risk.processScanData(doc, null, null); } catch (err) { thrown = err; }
    const problems = thrown && Array.isArray(thrown.problems) ? thrown.problems : [];
    const named = expected.every((needle) => problems.some((p) => p.includes(needle)));
    check(`refused: ${label}`,
      !!thrown && thrown.name === 'ScanRejected' && problems.length > 0 && named,
      thrown ? `${thrown.name}: ${JSON.stringify(problems)}` : 'nothing was thrown — it was accepted');
  };
  refuses('a JSON null where a scan was expected', null, ['scan']);
  refuses('a bare array', [], ['array']);
  refuses('a JSON string', 'not a scan', ['scan']);
  refuses('assets absent entirely', { findings: [] }, ['"assets"']);
  refuses('assets keyed by id instead of listed', { assets: { 'AST-1': {} }, findings: [] },
    ['"assets"', 'an object']);
  refuses('findings absent', { assets: [] }, ['"findings"']);
  refuses('findings as a count rather than a list', { assets: [], findings: 18 }, ['"findings"']);
  refuses('an asset that is a string, not a record', { assets: ['AST-1'], findings: [] },
    ['"assets"', 'index 0']);
  refuses('a finding that is null', { assets: [], findings: [null] }, ['"findings"', 'index 0']);
  refuses('candidate_investments as an object', { assets: [], findings: [], candidate_investments: {} },
    ['candidate_investments']);
  refuses('scan_metadata as an array', { assets: [], findings: [], scan_metadata: [] },
    ['scan_metadata']);
  check('and several structural problems in one file are reported together, not one upload at a time',
    (() => {
      try { risk.processScanData({ assets: 'no', findings: 'no', scan_metadata: 7 }, null, null); }
      catch (err) { return Array.isArray(err.problems) && err.problems.length === 3; }
      return false;
    })(),
    'a hand-edited scan usually has more than one problem');

  /* ------------------------------------------------------------------- repair, and say so
   * Where the shape is right and a value is wrong, the gate repairs and reports. Two rules decide
   * the severity, and every row below is an instance of one of them: if a *stated figure* was
   * unusable then a rupee total is now a LOWER bound, which is an `error`; if a descriptive field
   * was defaulted and no money moved, that is a `warning`. A repair never invents a quantity — an
   * unusable value becomes zero, because zero with a footnote understates visibly whereas a
   * plausible substitute does not.
   */
  const repairs = (label, mutate, code, severity) => {
    const doc = clone(SCAN);
    mutate(doc);
    let result = null;
    let thrown = null;
    try { result = risk.processScanData(doc, null, null); } catch (err) { thrown = err; }
    const issue = result && result.dataQuality.issues.find((i) => i.code === code);
    check(`${label} -> ${severity} "${code}", and the run survives it`,
      !!result && !!issue && issue.severity === severity &&
      Number.isFinite(result.totalFinancialExposureInr) && Number.isFinite(result.overallOrgRiskScore),
      thrown ? `threw ${thrown.name}: ${thrown.message}`
             : JSON.stringify((result.dataQuality.issues || []).map((i) => `${i.severity}:${i.code}`)));
    return result;
  };

  const strValue = repairs('an asset value exported as text ("1,00,000")',
    (d) => { d.assets[0].estimated_asset_value_inr = '1,00,000'; }, 'asset_value_unusable', 'error');
  check('and that asset is worth ₹0 rather than a parsed guess, so the total falls instead of drifting',
    strValue.totalFinancialExposureInr < bare.totalFinancialExposureInr &&
    strValue.findings.every((f) => Number.isFinite(f.expected_loss_inr)),
    `${strValue.totalFinancialExposureInr} vs ${bare.totalFinancialExposureInr}`);

  repairs('an asset value that is missing', (d) => { delete d.assets[0].estimated_asset_value_inr; },
    'asset_value_unusable', 'error');
  repairs('two assets sharing one asset_id', (d) => { d.assets[1].asset_id = d.assets[0].asset_id; },
    'asset_id_duplicate', 'error');
  repairs('an asset with no name', (d) => { delete d.assets[0].asset_name; },
    'asset_name_missing', 'warning');
  repairs('a business_criticality outside the four bands',
    (d) => { d.assets[0].business_criticality = 'Extreme'; }, 'criticality_unknown', 'warning');
  repairs('a missing EPSS score', (d) => { delete d.findings[0].epss_score; },
    'epss_missing', 'error');
  repairs('a CVSS score of 150', (d) => { d.findings[0].cvss_score = 150; },
    'cvss_out_of_range', 'warning');
  repairs('a CVSS score of "high"', (d) => { d.findings[0].cvss_score = 'high'; },
    'cvss_unusable', 'error');
  repairs('actively_exploited given as the string "false"',
    (d) => { d.findings[0].actively_exploited = 'false'; }, 'actively_exploited_not_boolean', 'warning');
  repairs('two findings sharing one finding_id',
    (d) => { d.findings[1].finding_id = d.findings[0].finding_id; }, 'finding_id_duplicate', 'error');
  repairs('a declared total_findings that disagrees with the rows present',
    (d) => { d.findings.pop(); }, 'declared_finding_count_disagrees', 'warning');

  /* The one repair whose *direction* is the whole point. A scanner exporting EPSS as a percentage
   * gives 42 where the model expects 0.42. Dividing by 100 would be right about 99% of the time,
   * and the other 1% is a board figure off by two orders of magnitude with nothing on screen to say
   * so — so the value is treated as unstated instead. The old code multiplied it in raw, which took
   * this scan's exposure from ₹26.6 crore to ₹1,152 crore in silence. */
  const pctEpss = repairs('an EPSS score of 42, i.e. a percentage where a probability belongs',
    (d) => { d.findings[0].epss_score = 42; }, 'epss_looks_like_a_percentage', 'error');
  check('and it deflates the total rather than inflating it 43x — the reported figure is a floor, never a ceiling',
    pctEpss.totalFinancialExposureInr < bare.totalFinancialExposureInr,
    `${pctEpss.totalFinancialExposureInr} vs clean ${bare.totalFinancialExposureInr}`);

  const deadCost = repairs('a candidate control with a negative cost',
    (d) => { d.candidate_investments[0].cost_inr = -50000; }, 'control_cost_unusable', 'error');
  check('and that control is dropped from the candidate list, not budgeted for at an unknown price',
    deadCost.dataQuality.controlsDropped === 1 &&
    deadCost.candidateInvestments.length === SCAN.candidate_investments.length - 1,
    `${deadCost.candidateInvestments.length} controls, ${deadCost.dataQuality.controlsDropped} dropped`);
  const overReduction = repairs('a control claiming a 300% risk reduction',
    (d) => { d.candidate_investments[0].estimated_risk_reduction_pct = 300; },
    'control_reduction_out_of_range', 'warning');
  check('and it is clamped to 100%, so the optimiser cannot remove more risk than exists',
    overReduction.candidateInvestments.every((c) => c.estimated_risk_reduction_pct <= 100),
    JSON.stringify(overReduction.candidateInvestments.map((c) => c.estimated_risk_reduction_pct)));

  /* ------------------------------------------------------------------ the umbrella invariant
   * Every defect above, in one file. This is the assertion that matters most, because the failure
   * it guards against is not a wrong number — it is `₹NaN` printed in eleven places on a dashboard
   * a judge is looking at, from a single string in a spreadsheet export.
   */
  const wrecked = clone(SCAN);
  wrecked.assets[0].estimated_asset_value_inr = '1,00,000';
  delete wrecked.assets[1].estimated_asset_value_inr;
  wrecked.assets[2].business_criticality = 'Extreme';
  wrecked.assets[3].asset_id = wrecked.assets[4].asset_id;
  delete wrecked.findings[0].epss_score;
  wrecked.findings[1].epss_score = 42;
  wrecked.findings[2].cvss_score = 'high';
  wrecked.findings[3].cvss_score = -3;
  wrecked.findings[4].asset_id = 'AST-NOWHERE';
  wrecked.findings[5].actively_exploited = 'false';
  wrecked.candidate_investments[0].cost_inr = 'a lot';
  wrecked.candidate_investments[1].estimated_risk_reduction_pct = 300;
  wrecked.scan_metadata.security_budget_available_inr = 'fifty lakh';
  const wreck = risk.processScanData(wrecked, null, null);
  const finite = (n) => typeof n === 'number' && Number.isFinite(n);
  check('a scan with every one of those defects at once still produces finite headline figures',
    finite(wreck.totalFinancialExposureInr) && finite(wreck.overallOrgRiskScore) &&
    wreck.overallOrgRiskScore >= 0 && wreck.overallOrgRiskScore <= 100,
    `exposure=${wreck.totalFinancialExposureInr} index=${wreck.overallOrgRiskScore}`);
  check('and no per-finding score, probability or loss anywhere in it is NaN',
    wreck.findings.length === wrecked.findings.length &&
    wreck.findings.every((f) => finite(f.expected_loss_inr) && finite(f.computed_risk_score) &&
      f.expected_loss_inr >= 0 && f.computed_risk_score >= 0 && f.computed_risk_score <= 100 &&
      (f.model_score === null || Object.values(f.model_score)
        .every((v) => typeof v !== 'number' || Number.isFinite(v)))),
    JSON.stringify(wreck.findings
      .filter((f) => !finite(f.expected_loss_inr) || !finite(f.computed_risk_score))
      .map((f) => `${f.finding_id}: loss=${f.expected_loss_inr} score=${f.computed_risk_score}`)));
  check('and the 14-day trend the dashboard draws has no NaN point and no Invalid Date label',
    wreck.trendData.length === 14 &&
    wreck.trendData.every((p) => finite(p.riskScore) && finite(p.financialExposure) &&
      typeof p.date === 'string' && p.date.length > 0 && !/Invalid/.test(p.date)),
    `${wreck.trendData.length} points: ` + JSON.stringify(wreck.trendData
      .filter((p) => !finite(p.riskScore) || !finite(p.financialExposure) || /Invalid/.test(p.date))
      .map((p) => `${p.date}: ${p.riskScore}/${p.financialExposure}`)));
  /* formatINR is the last thing between a bad number and the screen, so it is asserted against the
   * rendered string rather than the value: `₹NaN` is what the operator actually saw. */
  check('and every rupee figure it would render reads as a number or as "unavailable", never ₹NaN',
    [wreck.totalFinancialExposureInr, ...wreck.findings.map((f) => f.expected_loss_inr),
     ...wreck.trendData.map((p) => p.financialExposure)]
      .flatMap((v) => [risk.formatINR(v), risk.formatINR(v, true)])
      .every((s) => typeof s === 'string' && !/NaN|Infinity|undefined/.test(s)),
    'a NaN reached formatINR and was printed');
  check('and the optimiser and what-if pages both run on it without producing a NaN or a negative spend',
    (() => {
      const o = risk.runKnapsackOptimization(wreck.scanMetadata.security_budget_available_inr,
        wreck.candidateInvestments, wreck.overallOrgRiskScore, wreck.totalFinancialExposureInr);
      if (!(finite(o.totalCost) && o.totalCost >= 0 && finite(o.remainingBudget) &&
            o.remainingBudget >= 0 && finite(o.budgetUtilizationPct) && finite(o.projectedExposure))) return false;
      if (!wreck.candidateInvestments.length) return true;
      const w = risk.simulateWhatIfScenario(wreck.candidateInvestments[0], 0,
        wreck.overallOrgRiskScore, wreck.totalFinancialExposureInr);
      return finite(w.reductionPct) && finite(w.newExposure) && finite(w.newRiskScore) && finite(w.rosi);
    })(),
    'a downstream page produced a non-finite figure from a repaired scan');
  check('and it says plainly that it is not clean, with the error count a screen can lead with',
    !risk.isCleanScan(wreck.dataQuality) && wreck.dataQuality.errorCount >= 5 &&
    wreck.dataQuality.warningCount >= 3 &&
    wreck.dataQuality.issues.every((i) => i.message.length > 0 && i.count >= 1 && i.sample.length >= 1),
    `${wreck.dataQuality.errorCount} errors, ${wreck.dataQuality.warningCount} warnings`);
  check('and each issue names at most five affected ids, so one bad export cannot print a thousand-line alert',
    wreck.dataQuality.issues.every((i) => i.sample.length <= 5),
    JSON.stringify(wreck.dataQuality.issues.map((i) => `${i.code}:${i.sample.length}`)));
  check('and the errors are listed before the warnings, because only the errors moved the money',
    (() => {
      const sev = wreck.dataQuality.issues.map((i) => i.severity);
      return sev.indexOf('warning') === -1 || sev.lastIndexOf('error') < sev.indexOf('warning');
    })(),
    JSON.stringify(wreck.dataQuality.issues.map((i) => i.severity)));

  section('exports: both deliverables build from the pipeline output, not from a hand-made fixture');
  const report = risk.buildScanComplianceReport(mixed, opt);
  check('the compliance report classifies every finding it was given',
    report.controls.length > 0 && report.unclassifiedFindingIds.length === 0,
    JSON.stringify(report.unclassifiedFindingIds));
  const xlsx = Buffer.from(reports.buildControlRegisterWorkbook(mixed, report, opt, mixed.crosswalk));
  const pdf = Buffer.from(reports.buildBoardReportPdf(mixed, report, opt, mixed.crosswalk));
  check('the workbook is a ZIP with an end-of-central-directory record',
    xlsx.readUInt32LE(0) === 0x04034b50 && xlsx.lastIndexOf(Buffer.from('PK\x05\x06', 'latin1')) > 0,
    `${xlsx.length} bytes`);
  check('the PDF is a PDF and is terminated', pdf.subarray(0, 5).toString() === '%PDF-' &&
    pdf.subarray(-1024).toString('latin1').includes('%%EOF'), `${pdf.length} bytes`);

  // Text is emitted one `(...) Tj` per wrapped line, so phrases are searched in the reassembled
  // string. Same reassembly as check-exports.cjs, deliberately: if the two harnesses read the PDF
  // differently, a wording assertion passing in one and failing in the other would be ambiguous.
  // A function rather than an expression, because a second board report is read the same way further
  // down and two copies of this regex could drift into disagreeing about what the page says.
  const drawnText = (bytes) => [...bytes.toString('latin1').matchAll(/\(((?:\\.|[^()\\])*)\) Tj/g)]
    .map((m) => m[1].replace(/\\([()\\])/g, '$1')).join(' ').replace(/\s+/g, ' ');
  const drawn = drawnText(pdf);
  check('the board report prints the organisation named in the scan file',
    drawn.includes(SCAN.scan_metadata.organization), SCAN.scan_metadata.organization);

  // The seam, stated as arithmetic rather than as wording: every share in the PDF's exposure
  // breakdown is a figure `processScanData` computed, and the three must sum to the headline the
  // report leads with. check-exports proves the writer can add up its own fixture; this proves the
  // writer and the pipeline are adding up the same numbers.
  const BASIS_LABELS = {
    model: 'model estimate',
    observed_kev: 'observed exploitation (CISA KEV)',
    heuristic: 'deterministic CVSS/EPSS formula',
  };
  const printedShare = (b) => {
    const m = drawn.match(new RegExp(`INR ([\\d,]+) ${BASIS_LABELS[b].replace(/[()/.]/g, '\\$&')}`));
    return m ? Number(m[1].replace(/,/g, '')) : null;
  };
  check('all three method shares are printed, because all three scored something here',
    Object.keys(BASIS_LABELS).every((b) => printedShare(b) !== null),
    JSON.stringify(Object.fromEntries(Object.keys(BASIS_LABELS).map((b) => [b, printedShare(b)]))));
  check('each printed share is the exposure the pipeline attributed to that method',
    Object.keys(BASIS_LABELS).every((b) => printedShare(b) === Math.round(mixed.model.byBasis[b].exposureInr)),
    JSON.stringify(Object.keys(BASIS_LABELS).map((b) =>
      [b, printedShare(b), Math.round(mixed.model.byBasis[b].exposureInr)])));
  check('and they sum to the headline exposure the report leads with',
    Object.keys(BASIS_LABELS).reduce((s, b) => s + printedShare(b), 0) === mixed.totalFinancialExposureInr,
    `${Object.keys(BASIS_LABELS).reduce((s, b) => s + printedShare(b), 0)} vs ${mixed.totalFinancialExposureInr}`);

  // Two branches check-exports.cjs cannot reach, because its fixture runs with no artefact at all.
  // Here one IS loaded and it is a harness fixture, so the report must say precisely that — and must
  // not also say the artefact is missing.
  check('a loaded-but-unfitted artefact is disclosed as such, in the bytes a board would read',
    drawn.includes('The loaded artefact is NOT built from real data'));
  check('and the report does not simultaneously claim no artefact is in use',
    !drawn.includes('No trained artefact is in use'));
  check('the fixture\'s own description of itself reaches the report rather than being paraphrased',
    drawn.includes('HARNESS FIXTURE built by scripts/check-pipeline.cjs'));
  check('the rate the pipeline scored on is printed, with the platform default attributed to the platform',
    drawn.includes(`USD/INR ${mixed.model.usdInr}`) &&
    drawn.includes(`Platform default, stated as of ${engineMod.USD_INR_ASSUMPTION.asOf}`) &&
    !drawn.includes('Operator override'),
    `expected USD/INR ${mixed.model.usdInr} as a platform default`);
  check('the enrichment provenance the scan carried is restated from the pipeline, counts included',
    drawn.includes(`${mixed.model.enrichment.nvd_records_matched} findings matched an NVD record`) &&
    drawn.includes(`EPSS as of ${mixed.model.enrichment.epss_snapshot}`) &&
    !drawn.includes('states no enrichment source'));

  // The workbook, read back out of its own bytes. zip.ts stores entries uncompressed and xlsx.ts
  // writes strings inline, so the first <worksheet> element in the archive IS the Summary sheet and
  // needs no inflating and no openpyxl. check-exports.cjs already walks the ZIP structure and opens
  // it in LibreOffice; what is unproven is whether the numbers in it are the pipeline's numbers.
  // Same reader for both workbooks built in this section, for the same reason as drawnText above.
  const readSummary = (bytes) => {
    const xml = bytes.toString('utf8').split('</worksheet>')[0];
    const rows = [...xml.matchAll(/<row r="\d+">(.*?)<\/row>/g)].map((r) =>
      [...r[1].matchAll(/<c [^>]*?(?:t="inlineStr"><is><t[^>]*>(.*?)<\/t><\/is>|><v>([^<]*)<\/v>)/g)]
        .map((c) => (c[1] !== undefined
          ? c[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
          : Number(c[2]))));
    return { rows, row: (label) => rows.find((cells) => cells[0] === label) };
  };
  const summaryParsed = readSummary(xlsx);
  const summaryRows = summaryParsed.rows;
  const summaryRow = summaryParsed.row;
  check('the Summary sheet parsed out of the archive, so the assertions below are reading real cells',
    summaryRows.length > 20 && summaryRow('Total expected annual loss') !== undefined,
    `${summaryRows.length} rows`);
  check('the register\'s headline total is the pipeline\'s total, to the rupee',
    summaryRow('Total expected annual loss')[1] === mixed.totalFinancialExposureInr,
    `${summaryRow('Total expected annual loss')[1]} vs ${mixed.totalFinancialExposureInr}`);
  check('each "of which" row carries that method\'s exposure and its finding count',
    Object.keys(BASIS_LABELS).every((b) => {
      const row = summaryRow(`  of which ${BASIS_LABELS[b]}`);
      return row !== undefined && row[1] === Math.round(mixed.model.byBasis[b].exposureInr) &&
        String(row[2]).startsWith(`${mixed.model.byBasis[b].findings} finding`);
    }),
    JSON.stringify(Object.keys(BASIS_LABELS).map((b) => summaryRow(`  of which ${BASIS_LABELS[b]}`))));
  check('and those rows sum to the headline, so a filer who quotes the split is not quoting a different total',
    Object.keys(BASIS_LABELS).reduce((s, b) => s + summaryRow(`  of which ${BASIS_LABELS[b]}`)[1], 0) ===
      summaryRow('Total expected annual loss')[1]);
  // `model.scored` is 15 here: 3 predicted plus 12 observed in KEV. A row labelled "scored by the
  // model" over that number would credit the exploitation model with 12 findings it was never asked
  // to predict — the same misattribution compliance.ts refuses when it declines to average KEV
  // observations into a model mean. Only the mixed state exposes it, so only this harness can guard it.
  const scoredRow = summaryRow('Findings with a model-derived figure');
  check('the register counts model-derived figures, and splits predicted from observed rather than calling both model coverage',
    scoredRow !== undefined && scoredRow[1] === mixed.model.scored &&
    scoredRow[1] === mixed.model.byBasis.model.findings + mixed.model.byBasis.observed_kev.findings &&
    String(scoredRow[2]).includes(`${mixed.model.byBasis.model.findings} with an exploitation probability predicted by the model`) &&
    String(scoredRow[2]).includes(`${mixed.model.byBasis.observed_kev.findings} listed in CISA KEV`),
    JSON.stringify(scoredRow));
  check('and no row anywhere in the Summary claims the model scored all 15',
    !summaryRows.some((cells) => /scored by the model/i.test(String(cells[0]))),
    JSON.stringify(summaryRows.filter((cells) => /scored by the model/i.test(String(cells[0])))));
  check('the board report sizes model coverage on the predictions only, and names the observed remainder separately',
    drawn.includes(`${mixed.model.byBasis.model.findings} of ${mixed.model.total} findings had an exploitation probability predicted by the model`) &&
    drawn.includes(`A further ${mixed.model.byBasis.observed_kev.findings} are listed in CISA KEV`) &&
    drawn.includes(`The remaining ${mixed.model.byBasis.heuristic.findings} use the deterministic fallback`),
    'the PDF coverage line still reports scored-as-predicted');
  // The trained-but-unfitted branch again, in the deliverable that goes to a regulator. check-exports
  // can only ever execute the 'absent' wording, and the two say opposite things about whether an
  // artefact exists — so the branch that admits to holding an unfitted one has to be run somewhere.
  check('the register says the figures are NOT from real data, without claiming there is no artefact',
    summaryRow('Figures are from real data')[1] ===
      'NO — do not quote these figures as measured performance',
    String(summaryRow('Figures are from real data')[1]));
  check('the artefact\'s build timestamp is printed rather than the not-applicable wording',
    summaryRow('Model artefact built')[1] === mixed.model.status.generatedAt,
    String(summaryRow('Model artefact built')[1]));
  check('the optimiser figures reach the register unchanged, so the workbook and the PDF cost the same',
    summaryRow('Cost')[1] === opt.totalCost &&
    summaryRow('Projected risk index')[1] === opt.projectedRiskScore &&
    summaryRow('Exposure avoided per year')[1] === opt.savedExposure,
    JSON.stringify([summaryRow('Cost'), summaryRow('Projected risk index')]));
  check('the parity result travels with the figures it vouches for',
    /^passed on \d+ rows \(tolerance /.test(String(summaryRow('Python/TypeScript parity')[1])),
    String(summaryRow('Python/TypeScript parity')[1]));
  // The anchor the PIPELINE computed, in both deliverables. check-exports asserts the wording of
  // both branches from a hand-built fixture; this is the seam — that the date reaching a filer is
  // the date the features were actually built against, not one the exporter recomputed.
  check('the workbook prints the anchor the pipeline used, attributed to the scan file',
    summaryRow('Feature anchor date')[1] === mixed.model.scanDateAnchor.used &&
    /stated by the scan file/.test(String(summaryRow('Feature anchor date')[2])),
    JSON.stringify(summaryRow('Feature anchor date')));
  check('and the board report anchors on the same date, so the two deliverables cannot disagree',
    drawn.includes(`Features were anchored on ${mixed.model.scanDateAnchor.used}`),
    `looking for ${mixed.model.scanDateAnchor.used} in the drawn PDF text`);

  /* ---------------------------------------------------- the completeness disclosure, in the bytes
   * reports.ts closes the board report with "The itemised list closes this report." That is a
   * promise made to a regulator inside a deliverable, and nothing checked it until here.
   *
   * It has to be checked from this harness rather than check-exports.cjs, because that one
   * hand-builds its ProcessedScanResult — its dataQuality field is whatever the fixture author
   * typed, so a disclosure asserted against it only proves the writer can echo the fixture. `wreck`
   * came out of processScanData on a genuinely malformed file, so what the exports say about it is
   * what they would say about a real bad upload.
   *
   * The clean side is asserted just as hard as the dirty side. A caveat that fires on every scan is
   * noise, and a report that hedges when nothing is wrong teaches its reader to skip the hedge.
   */
  const completeRow = 'Are the totals in this workbook complete?';
  check('the clean scan produces a clean workbook: the completeness row says so outright',
    risk.isCleanScan(mixed.dataQuality) && summaryRow(completeRow) !== undefined &&
    /^yes — every figure the pipeline reads was stated and usable/.test(String(summaryRow(completeRow)[1])),
    JSON.stringify([risk.isCleanScan(mixed.dataQuality), summaryRow(completeRow)]));
  check('and it prints no ERROR row, so a filer is not handed a caveat that qualifies nothing',
    !summaryRows.some((cells) => cells[0] === 'ERROR' || cells[0] === 'warning'),
    JSON.stringify(summaryRows.filter((cells) => cells[0] === 'ERROR' || cells[0] === 'warning')));
  check('and the board report states completeness positively rather than staying silent on it',
    drawn.includes(`Every field the pipeline reads was present and usable: ${mixed.dataQuality.assetsAccepted} assets`) &&
    drawn.includes('No figure below is a substitute.') && !drawn.includes('LOWER bound'),
    'the clean Scan completeness wording is missing from the PDF, or the lower-bound wording is in it');
  check('and it opens no "Problems found in the scan file" section for a file with no problems',
    !drawn.includes('Problems found in the scan file'));

  /* The same two writers, over the wrecked scan from the ingest section above. Nothing below is a
   * fixture: every issue itemised in these bytes was produced by the validator reading a broken file.
   *
   * It has to be re-scored first. A compliance report needs the crosswalk, the crosswalk arrives
   * with the engine, and `wreck` was deliberately scored without one — so the same malformed file is
   * run again through the harness engine, and `cleanE` gives it a like-for-like clean comparison.
   * That the validator's verdict does not depend on whether a model was loaded is a claim, so it is
   * the first thing asserted rather than something the rest of the section leans on quietly.
   */
  const wreckE = risk.processScanData(wrecked, engine, null);
  const cleanE = risk.processScanData(SCAN, engine, null);
  check('the validator reaches the same verdict on a file whether or not a model was loaded',
    wreckE.dataQuality.errorCount === wreck.dataQuality.errorCount &&
    wreckE.dataQuality.warningCount === wreck.dataQuality.warningCount &&
    JSON.stringify(wreckE.dataQuality.issues.map((i) => [i.severity, i.code, i.count])) ===
      JSON.stringify(wreck.dataQuality.issues.map((i) => [i.severity, i.code, i.count])),
    `${wreckE.dataQuality.errorCount}/${wreckE.dataQuality.warningCount} with an engine, ` +
    `${wreck.dataQuality.errorCount}/${wreck.dataQuality.warningCount} without`);
  const wreckOpt = risk.runKnapsackOptimization(
    wreckE.scanMetadata.security_budget_available_inr, wreckE.candidateInvestments,
    wreckE.overallOrgRiskScore, wreckE.totalFinancialExposureInr);
  const wreckReport = risk.buildScanComplianceReport(wreckE, wreckOpt);
  const wreckXlsx = Buffer.from(
    reports.buildControlRegisterWorkbook(wreckE, wreckReport, wreckOpt, wreckE.crosswalk));
  const wreckPdf = Buffer.from(
    reports.buildBoardReportPdf(wreckE, wreckReport, wreckOpt, wreckE.crosswalk));
  const wreckSummary = readSummary(wreckXlsx);
  const wreckDrawn = drawnText(wreckPdf);
  const wreckCodes = wreckE.dataQuality.issues.map((i) => i.code);
  check('a malformed scan still exports both deliverables, rather than the export failing shut',
    wreckXlsx.readUInt32LE(0) === 0x04034b50 && wreckPdf.subarray(0, 5).toString() === '%PDF-' &&
    wreckSummary.rows.length > 20 && wreckDrawn.length > 2000,
    `${wreckXlsx.length} workbook bytes, ${wreckPdf.length} PDF bytes`);
  check('but the workbook refuses to call its own totals complete, and states the error count',
    wreckSummary.row(completeRow) !== undefined &&
    String(wreckSummary.row(completeRow)[1]).startsWith(
      `NO — ${wreckE.dataQuality.errorCount} stated figure${wreckE.dataQuality.errorCount === 1 ? '' : 's'} could not be used.`) &&
    /every rupee total here is a LOWER bound/.test(String(wreckSummary.row(completeRow)[1])),
    JSON.stringify(wreckSummary.row(completeRow)));
  check('and the deflated total it discloses is the pipeline\'s own total, not one padded back up',
    wreckSummary.row('Total expected annual loss')[1] === wreckE.totalFinancialExposureInr &&
    wreckE.totalFinancialExposureInr < cleanE.totalFinancialExposureInr,
    `${wreckE.totalFinancialExposureInr} against ${cleanE.totalFinancialExposureInr} on the same file undamaged`);
  check('and the pricing gap is a count in the same sheet as the number it deflates',
    wreckSummary.row('Assets carrying a stated value')[1] === wreckE.dataQuality.assetsWithStatedValue &&
    wreckE.dataQuality.assetsWithStatedValue < wreckE.dataQuality.assetsAccepted &&
    /contribute ₹0 to every total in this workbook/.test(String(wreckSummary.row('Assets carrying a stated value')[2])),
    JSON.stringify(wreckSummary.row('Assets carrying a stated value')));
  check('and the findings priced at ₹0 are counted too, so the finding count reconciles with the money',
    wreckSummary.row('Findings carrying a rupee figure')[1] === wreckE.dataQuality.findingsQuantifiable &&
    (wreckE.dataQuality.findingsQuantifiable === wreckE.dataQuality.findingsAccepted
      ? /all of them/.test(String(wreckSummary.row('Findings carrying a rupee figure')[2]))
      : /priced at ₹0/.test(String(wreckSummary.row('Findings carrying a rupee figure')[2]))),
    JSON.stringify(wreckSummary.row('Findings carrying a rupee figure')));
  check(`and all ${wreckCodes.length} problems are itemised in the Summary sheet, not merely counted`,
    wreckCodes.length >= 8 &&
    wreckCodes.every((code) => wreckSummary.rows.some((cells) => String(cells[1]).startsWith(code))),
    JSON.stringify(wreckCodes.filter((code) =>
      !wreckSummary.rows.some((cells) => String(cells[1]).startsWith(code)))));
  check('each carrying its own severity, so a reader can tell which ones moved the money',
    wreckE.dataQuality.issues.every((issue) => wreckSummary.rows.some((cells) =>
      String(cells[1]).startsWith(issue.code) &&
      cells[0] === (issue.severity === 'error' ? 'ERROR' : 'warning'))),
    JSON.stringify(wreckE.dataQuality.issues.map((i) => [i.severity, i.code])));

  const ec = wreckE.dataQuality.errorCount;
  check('the board report puts the lower-bound warning in its provenance block, on page one',
    wreckDrawn.includes(`${ec} stated figure${ec === 1 ? '' : 's'} in the scan file could not be used`) &&
    wreckDrawn.includes('a LOWER bound on the true exposure, not an estimate of it'),
    'the dirty Scan completeness wording is missing from the PDF');
  check('and it keeps the promise it makes there — the itemised list really does close the report',
    wreckDrawn.includes('The itemised list closes this report.') &&
    wreckDrawn.includes('Problems found in the scan file') &&
    wreckDrawn.indexOf('The itemised list closes this report.') <
      wreckDrawn.indexOf('Problems found in the scan file'),
    `promise at ${wreckDrawn.indexOf('The itemised list closes this report.')}, ` +
    `list at ${wreckDrawn.indexOf('Problems found in the scan file')}`);
  check('and it says on the page what ERROR and WARNING mean, rather than assuming the reader knows',
    wreckDrawn.includes('Items marked ERROR mean a stated figure could not be used') &&
    wreckDrawn.includes('Items marked WARNING mean a descriptive field was defaulted and no total is affected'),
    'the ERROR/WARNING legend is missing from the problems section');
  /* Matched with whitespace stripped. wrapText hard-breaks a word wider than its column, so a long
   * code like declared_finding_count_disagrees can arrive split across two `Tj` operators; the
   * question being asked is whether the code reached the page, not where its line ended. */
  const wreckTight = wreckDrawn.replace(/\s+/g, '');
  check('and every problem code the workbook itemises is on the PDF page too, so the two lists agree',
    wreckCodes.every((code) => wreckTight.includes(code)),
    JSON.stringify(wreckCodes.filter((code) => !wreckTight.includes(code))));
  // Indian digit grouping, the way pdf.ts writes it. Recomputed here rather than imported, because
  // the claim is about the string a director reads off the page.
  const inr = (v) => {
    const d = String(Math.round(v));
    return d.length <= 3 ? `INR ${d}`
      : `INR ${d.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${d.slice(-3)}`;
  };
  check('and the total it prints is the deflated one, not the clean headline carried across',
    wreckDrawn.includes(inr(wreckE.totalFinancialExposureInr)) &&
    !wreckDrawn.includes(inr(cleanE.totalFinancialExposureInr)),
    `expected ${inr(wreckE.totalFinancialExposureInr)}, and ${inr(cleanE.totalFinancialExposureInr)} absent`);

  section('no screen reaches for invented data instead of the pipeline');
  /*
   * src/data/mockData.ts is 534 lines left over from the mock prototype: hand-written CVEs, risk
   * scores and "aiExplanation" strings. It is imported by nothing today, and that is the whole of
   * what keeps its numbers off the screen — one import would put fabricated rupee figures next to
   * computed ones with nothing on the page to distinguish them. So the claim is asserted rather
   * than trusted, and it fails loudly if anyone wires it back in.
   */
  const sourceFiles = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(full);
    }
  })(path.join(ROOT, 'src'));
  const importers = sourceFiles.filter(
    (f) => path.basename(f) !== 'mockData.ts' && /from\s+['"][^'"]*data\/mockData['"]/.test(fs.readFileSync(f, 'utf8'))
  );
  check(
    'nothing under src/ imports src/data/mockData.ts, so its invented figures cannot reach a screen',
    importers.length === 0,
    importers.map((f) => path.relative(ROOT, f)).join(', ')
  );
  check(
    'and the file says so at the top, for whoever opens it next',
    /DEAD FILE — INVENTED DATA/.test(fs.readFileSync(path.join(ROOT, 'src', 'data', 'mockData.ts'), 'utf8')),
    'the header marking it dead was removed'
  );
  check(
    `every .ts/.tsx file under src/ was searched, not a hardcoded list (${sourceFiles.length} files)`,
    sourceFiles.length >= 25,
    `${sourceFiles.length} files walked — too few to be a real sweep`
  );

  /* ---------------------------------------------------------------- the shipped build
   * A dist/ that predates the source is the one artefact in this repo that can be wrong without
   * anything in the repo being wrong: the code is fixed, the harnesses are green, and the bundle
   * a judge opens still has the old bugs in it. Nothing else here can catch that, because every
   * other check reads src/.
   *
   * The predicate passes in all three legitimate states and fails only in the dangerous one:
   *   - dist/ absent                          — nothing to deploy, nothing to mislead
   *   - dist/ newer than every source file    — a real rebuild happened
   *   - dist/ stale but carrying the marker   — stale and saying so, in the file and on screen
   *   - dist/ stale and silent                — FAIL
   *
   * `vite build` cannot run in this workspace (node_modules is a Windows install, so only
   * @rollup/rollup-win32-* exists), which is precisely why the state has to be asserted rather
   * than fixed by rebuilding.
   */
  section('the shipped build in dist/ is either current or admits that it is not');
  const distDir = path.join(ROOT, 'dist');
  const distEntry = path.join(distDir, 'index.html');
  const distAssets = path.join(distDir, 'assets');
  const marker = path.join(distDir, 'BUILD-IS-STALE.txt');

  if (!fs.existsSync(distEntry)) {
    check('dist/ carries no build, so there is no stale bundle to deploy', true);
  } else {
    /* The age of the build is the age of the *bundle*, not of index.html. Writing the staleness
     * banner into index.html by hand refreshes that file's mtime, so anchoring on it would let the
     * act of marking a build stale certify it as current — the check would go green while
     * dist/assets/index-*.js, which is where the compiled bugs actually live, stayed untouched.
     * So: the oldest compiled asset wins, and hand-edits to index.html cannot move it. */
    const compiled = fs.existsSync(distAssets)
      ? fs.readdirSync(distAssets)
          .filter((f) => /\.(js|css)$/.test(f))
          .map((f) => path.join(distAssets, f))
      : [];
    const builtAt = compiled.length
      ? Math.min(...compiled.map((f) => fs.statSync(f).mtimeMs))
      : fs.statSync(distEntry).mtimeMs;

    const watched = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else watched.push(full);
      }
    };
    walk(path.join(ROOT, 'src'));
    // public/ is copied verbatim into dist/, so it goes stale the same way the bundle does: an
    // edited public/frameworks/crosswalk.json with an old dist/frameworks/crosswalk.json beside it
    // serves the previous control mapping under the current code's claims about it.
    walk(path.join(ROOT, 'public'));
    for (const f of ['index.html', 'package.json', 'vite.config.ts', 'tailwind.config.ts']) {
      if (fs.existsSync(path.join(ROOT, f))) watched.push(path.join(ROOT, f));
    }
    const newer = watched
      .filter((f) => fs.statSync(f).mtimeMs > builtAt)
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    const stale = newer.length > 0;
    const markerText = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8') : '';
    const servedHtml = fs.readFileSync(distEntry, 'utf8');

    check(
      stale
        ? `dist/ is stale (${newer.length} source files are newer than its bundle) and carries dist/BUILD-IS-STALE.txt saying so`
        : 'dist/ is newer than every source file, so the shipped build matches the source',
      !stale || markerText.length > 0,
      `bundle built ${new Date(builtAt).toISOString()}; newest source is ` +
        `${path.relative(ROOT, newer[0] || '')} — add dist/BUILD-IS-STALE.txt or rebuild`
    );
    // A marker nobody opens is not a warning. Whoever *serves* the stale bundle has to see it too.
    check(
      stale
        ? 'and dist/index.html renders a stale-build banner, so opening the page says so on screen'
        : 'dist/index.html carries no leftover stale-build banner, which is correct for a current build',
      stale ? /Stale build/.test(servedHtml) : !/Stale build/.test(servedHtml),
      stale
        ? 'dist/index.html has no visible staleness banner'
        : 'a current build still renders a stale-build banner — vite build should have removed it'
    );
    check(
      stale
        ? 'and the marker names the rebuild command, not just the problem'
        : 'no marker is needed for a current build',
      stale ? /npm run build/.test(markerText) : markerText.length === 0,
      stale
        ? 'dist/BUILD-IS-STALE.txt does not say how to resolve it'
        : 'dist/BUILD-IS-STALE.txt survived a rebuild — delete it or rebuild properly'
    );
    check(
      `the staleness comparison walked the real tree, not a hardcoded list (${watched.length} files)`,
      watched.length >= 25,
      `${watched.length} files compared — too few to be a real sweep`
    );
  }
}

main().then(() => {
  console.log(
    `\n${checks - failures}/${checks} checks passed` +
    (failures ? `\n${failures} FAILED` : '')
  );
  console.log(
    'Note: the model artefact in this harness is one split and four leaves, built in memory by the\n' +
    'harness itself. It makes the model branch reachable so the pipeline can be tested end to end.\n' +
    'No number here is model performance.'
  );
  fs.rmSync(OUT, { recursive: true, force: true });
  process.exit(failures ? 1 : 0);
}).catch((err) => {
  console.error(err);
  fs.rmSync(OUT, { recursive: true, force: true });
  process.exit(1);
});
