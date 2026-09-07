/**
 * Validates the framework-mapping layer against the real crosswalk and the bundled sample scan.
 *
 * This exists because `npm run build` cannot run in every environment: node_modules may hold
 * platform-native rollup/esbuild binaries for a different OS, in which case `tsc --noEmit`
 * passes and the bundler step cannot start. Type-checking proves the shapes line up; it proves
 * nothing about whether the control register says anything true. So this harness compiles the
 * two pure model modules with tsc (no bundler, no native binary) and asserts the properties the
 * compliance UI claims in its own copy:
 *
 *   - every framework in the catalogue produces a register, with the arithmetic self-consistent
 *   - attributed exposure really is non-additive, so the caveat on the table is not decoration
 *   - identifier verification survives the mapping, so an `assigned` SEBI id never renders as
 *     a citation
 *   - control ids are namespaced per framework, so a CIS "4.8" and an RBI "4.8" stay distinct
 *   - metrics the platform cannot compute come back null with a reason, never as a zero
 *
 * Run: node scripts/check-compliance.cjs
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'compliance-check-'));

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

function compileModels() {
  execFileSync(
    process.execPath,
    [
      path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--module', 'commonjs',
      '--target', 'es2020',
      '--moduleResolution', 'node',
      '--strict',
      '--skipLibCheck',
      '--outDir', OUT,
      path.join(ROOT, 'src', 'model', 'compliance.ts'),
      path.join(ROOT, 'src', 'model', 'crosswalk.ts'),
    ],
    { stdio: 'inherit' }
  );
}

compileModels();

const crosswalkMod = require(path.join(OUT, 'crosswalk.js'));
const complianceMod = require(path.join(OUT, 'compliance.js'));
const { FRAMEWORK_ORDER, buildCweIndex, classifyFinding, extractCweIds } = crosswalkMod;
const { buildComplianceReport, rankControlGaps, citedVerificationCounts } = complianceMod;

const doc = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public', 'frameworks', 'crosswalk.json'), 'utf8')
);
const scan = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'sample-scan.json'), 'utf8'));

// Mirror of classifyFindingFromScan in src/model/features.ts: enrichment CWEs first, then CWEs
// pulled out of the text, and when CWEs are present the keyword haystack is the CWE string
// rather than the description. Reproduced here so a drift between the two shows up as a
// different class count rather than passing silently.
const cweIndex = buildCweIndex(doc.vulnerability_classes);
function classify(finding) {
  const enrichment = finding.enrichment || {};
  let cwes = (enrichment.cwe_ids || []).map((c) => c.trim().toUpperCase()).filter(Boolean);
  let fromText = false;
  if (cwes.length === 0) {
    cwes = extractCweIds(`${finding.vulnerability_name} ${finding.description}`);
    fromText = cwes.length > 0;
  }
  const haystack = cwes.length > 0 ? cwes.join(' ') : `${finding.vulnerability_name} ${finding.description}`;
  return classifyFinding(cweIndex, doc.vulnerability_classes, cwes, haystack, fromText);
}

const assetById = new Map(scan.assets.map((a) => [a.asset_id, a]));

// Stand-in for the scored figures. The point of this harness is the mapping, not the model, so
// expected loss is a deterministic placeholder — clearly not a model output, and never reported.
const findings = scan.findings.map((f) => {
  const asset = assetById.get(f.asset_id);
  const value = asset ? asset.estimated_asset_value_inr : 0;
  return {
    finding_id: f.finding_id,
    vulnClassKey: classify(f).key,
    riskIndex: Math.round(f.cvss_score * 10),
    expectedLossInr: Math.round(value * f.epss_score * 0.01),
  };
});

const investments = (scan.candidate_investments || []).map((c) => ({
  control_id: c.control_id,
  control_name: c.control_name,
}));

const portfolioExposure = findings.reduce((s, f) => s + f.expectedLossInr, 0);

const report = buildComplianceReport(doc, findings, investments, {
  totalExpectedLossInr: portfolioExposure,
  meanExploitProbability: null,
  residualRiskIndex: null,
  criticalFindings: scan.findings.filter((f) => f.cvss_score >= 9).length,
  activelyExploitedCount: scan.findings.filter((f) => f.actively_exploited).length,
  roiPct: null,
  criticalityProfile: {},
  probabilityUnavailableReason: 'harness: no model is loaded in this check',
});

section('catalogue coverage');
const catalogued = FRAMEWORK_ORDER.reduce(
  (s, id) => s + Object.keys(doc.frameworks[id].controls).length,
  0
);
check(
  `every catalogued control produced a register row (${report.controls.length}/${catalogued})`,
  report.controls.length === catalogued,
  `${report.controls.length} rows for ${catalogued} controls`
);
check('all five frameworks summarised', report.frameworks.length === 5, `${report.frameworks.length}`);

for (const fw of report.frameworks) {
  const rows = report.controls.filter((c) => c.framework === fw.id);
  const implicated = rows.filter((c) => c.state !== 'not_implicated').length;
  const planned = rows.filter((c) => c.state === 'gap_with_plan').length;
  check(
    `${fw.id}: summary agrees with the rows (${implicated} implicated, ${planned} planned)`,
    fw.implicated === implicated && fw.planned === planned && fw.unplanned === implicated - planned,
    `summary ${fw.implicated}/${fw.planned}/${fw.unplanned}, rows ${implicated}/${planned}`
  );
  check(
    `${fw.id}: implicated (${fw.implicated}) never exceeds catalogued (${fw.total})`,
    fw.implicated <= fw.total && fw.total === rows.length
  );
  check(
    `${fw.id}: group tallies sum to the framework total`,
    fw.groups.reduce((s, g) => s + g.total, 0) === fw.total,
    `${fw.groups.reduce((s, g) => s + g.total, 0)} vs ${fw.total}`
  );
  check(
    `${fw.id}: this scan implicates at least one control`,
    fw.implicated > 0,
    'nothing implicated — the mapping would render an empty register'
  );
}

section('identifier verification survives the mapping');
for (const fw of report.frameworks) {
  const declared = doc.meta.verification_counts[fw.id];
  const rows = report.controls.filter((c) => c.framework === fw.id);
  const levels = new Set(rows.map((c) => c.verification));
  const declaredLevels = new Set(Object.keys(declared).filter((k) => declared[k] > 0));
  check(
    `${fw.id}: verification levels match the catalogue meta (${[...levels].join('/')})`,
    [...levels].every((l) => declaredLevels.has(l)) && levels.size === declaredLevels.size,
    `rows ${[...levels].join(',')} vs meta ${[...declaredLevels].join(',')}`
  );
  const cited = rows.filter((c) => c.state !== 'not_implicated');
  const citedTally = cited.reduce((acc, c) => {
    acc[c.verification] = (acc[c.verification] || 0) + 1;
    return acc;
  }, {});
  check(
    `${fw.id}: cited-control verification tally matches the summary`,
    Object.keys(citedTally).every((k) => citedTally[k] === fw.verificationCounts[k]) &&
      Object.keys(fw.verificationCounts).every((k) => fw.verificationCounts[k] === citedTally[k])
  );
}

const rbi = report.controls.filter((c) => c.framework === 'rbi');
const sebi = report.controls.filter((c) => c.framework === 'sebi');
check(
  'no RBI identifier is marked verified (all 30 are inferred)',
  rbi.length > 0 && rbi.every((c) => c.verification === 'inferred'),
  `${rbi.filter((c) => c.verification !== 'inferred').length} exceptions`
);
check(
  'no SEBI identifier is marked verified (all 25 are assigned)',
  sebi.length > 0 && sebi.every((c) => c.verification === 'assigned'),
  `${sebi.filter((c) => c.verification !== 'assigned').length} exceptions`
);
check(
  'every assigned identifier carries a recorded mapping basis',
  report.controls.filter((c) => c.verification === 'assigned').every((c) => Boolean(c.basis)),
  'an assigned id with no basis would be unexplainable in a filing'
);

section('control id namespacing');
// The real catalogue happens to have no bare id shared between frameworks (ISO uses A.8.8,
// NIST ID.AM-01, CIS 4.8, and the two Indian registers are prefixed), so asserting against it
// would prove nothing. This builds a two-framework catalogue that deliberately collides on
// "4.8" and checks the buckets stay separate — the invariant compliance.ts keys for.
const collidingDoc = {
  meta: {
    generated_at: doc.meta.generated_at,
    sources: { iso27001: 'synthetic', nistcsf: 'synthetic', cis: 'synthetic', rbi: 'synthetic', sebi: 'synthetic' },
    provenance_note: 'synthetic collision fixture',
    verification_counts: {},
    coverage: {},
    schema_version: doc.meta.schema_version,
    generator: 'check-compliance.cjs',
  },
  frameworks: {},
  vulnerability_classes: [
    {
      key: 'alpha',
      label: 'Alpha',
      cwes: ['CWE-0001'],
      keywords: ['alpha-only-keyword'],
      rationale: 'fixture',
      controls: { iso27001: [], nistcsf: [], cis: ['4.8'], rbi: [], sebi: [] },
    },
    {
      key: 'beta',
      label: 'Beta',
      cwes: ['CWE-0002'],
      keywords: ['beta-only-keyword'],
      rationale: 'fixture',
      controls: { iso27001: [], nistcsf: [], cis: [], rbi: ['4.8'], sebi: [] },
    },
  ],
  mitigation_classes: [],
  risk_metric_map: [],
};
for (const id of FRAMEWORK_ORDER) {
  collidingDoc.frameworks[id] = {
    id,
    name: id,
    long_name: id,
    authority: 'fixture',
    groups: { G: 'Group' },
    controls:
      id === 'cis' || id === 'rbi'
        ? { '4.8': { title: `${id} control 4.8`, group: 'G', group_name: 'Group', verification: 'verified' } }
        : {},
  };
}
const collisionReport = buildComplianceReport(
  collidingDoc,
  [
    { finding_id: 'F-CIS', vulnClassKey: 'alpha', riskIndex: 50, expectedLossInr: 100 },
    { finding_id: 'F-RBI', vulnClassKey: 'beta', riskIndex: 60, expectedLossInr: 200 },
  ],
  [],
  {
    totalExpectedLossInr: 300,
    meanExploitProbability: null,
    residualRiskIndex: null,
    criticalFindings: 0,
    activelyExploitedCount: 0,
    roiPct: null,
    criticalityProfile: {},
  }
);
const cis48 = collisionReport.controls.find((c) => c.framework === 'cis' && c.id === '4.8');
const rbi48 = collisionReport.controls.find((c) => c.framework === 'rbi' && c.id === '4.8');
check(
  'a CIS "4.8" and an RBI "4.8" produce two separate register rows',
  collisionReport.controls.length === 2 && Boolean(cis48) && Boolean(rbi48)
);
check(
  'each keeps only its own finding and its own attributed exposure',
  cis48 &&
    rbi48 &&
    cis48.findingIds.join() === 'F-CIS' &&
    rbi48.findingIds.join() === 'F-RBI' &&
    cis48.exposureInr === 100 &&
    rbi48.exposureInr === 200,
  cis48 && rbi48
    ? `cis=[${cis48.findingIds}] ₹${cis48.exposureInr}, rbi=[${rbi48.findingIds}] ₹${rbi48.exposureInr}`
    : 'a row is missing'
);
check(
  'the real catalogue still produces one row per catalogued control',
  report.controls.length === catalogued
);

section('attributed exposure is not additive');
const summedDownColumn = report.controls.reduce((s, c) => s + c.exposureInr, 0);
check(
  'summing the exposure column overstates the portfolio, as the caveat says',
  summedDownColumn > portfolioExposure,
  `column ${summedDownColumn} vs portfolio ${portfolioExposure}`
);
console.log(
  `       summing all five registers gives ${(summedDownColumn / Math.max(1, portfolioExposure)).toFixed(1)}x the portfolio total`
);
for (const fw of report.frameworks) {
  const within = report.controls
    .filter((c) => c.framework === fw.id)
    .reduce((s, c) => s + c.exposureInr, 0);
  check(
    `${fw.id}: no single control is attributed more than the portfolio total`,
    report.controls
      .filter((c) => c.framework === fw.id)
      .every((c) => c.exposureInr <= portfolioExposure),
    `framework column sums to ${within}`
  );
}

section('reportable metrics');
check(
  `all ${doc.risk_metric_map.length} catalogued metrics produced a statement`,
  report.metrics.length === doc.risk_metric_map.length
);
check(
  'every metric statement is either a value or a stated reason, never blank',
  report.metrics.every((m) => (m.value === null ? Boolean(m.unavailableReason) : m.value.length > 0)),
  report.metrics.filter((m) => m.value === null && !m.unavailableReason).map((m) => m.key).join(', ')
);
for (const key of ['residualRiskScore', 'roiPct', 'exploitProbability']) {
  const metric = report.metrics.find((m) => m.field === key);
  check(
    `${key} is null with a reason when it cannot be computed, not zero`,
    metric && metric.value === null && Boolean(metric.unavailableReason),
    metric ? `value=${JSON.stringify(metric.value)}` : 'metric missing'
  );
}
const eal = report.metrics.find((m) => m.field === 'totalExpectedLossINR');
check(
  'expected annual loss is reported with a currency and a horizon',
  eal && eal.value !== null && eal.value.includes('₹') && /per year/.test(eal.value),
  eal ? eal.value : 'missing'
);
check(
  'every metric names at least one control it is evidence for',
  report.metrics.every((m) => m.controlCount > 0),
  report.metrics.filter((m) => m.controlCount === 0).map((m) => m.key).join(', ')
);

section('coverage gaps are reported, not hidden');
const unclassified = report.unclassifiedFindingIds;
const unmapped = report.unmappedInvestmentIds;
check(
  `unclassified findings are listed by id (${unclassified.length} of ${findings.length})`,
  Array.isArray(unclassified) &&
    unclassified.length === findings.filter((f) => f.vulnClassKey === null).length
);
check(
  `unmapped investments are listed by id (${unmapped.length} of ${investments.length})`,
  Array.isArray(unmapped) && unmapped.length < investments.length,
  'if no investment mapped, the remediation column would be empty everywhere'
);
check(
  'a finding that implicates nothing appears in no register',
  unclassified.every((id) => !report.controls.some((c) => c.findingIds.includes(id)))
);
check('the provenance note travels with the report', Boolean(report.provenanceNote));

section('ranking and tallies');
const ranked = rankControlGaps(report);
check(
  'rankControlGaps returns only implicated controls',
  ranked.every((c) => c.state !== 'not_implicated')
);
check(
  'ranked worst-first by attributed exposure',
  ranked.every((c, i) => i === 0 || ranked[i - 1].exposureInr >= c.exposureInr)
);
const cited = citedVerificationCounts(report);
check(
  'cited verification tally equals the number of implicated controls',
  cited.verified + cited.inferred + cited.assigned === ranked.length,
  `${cited.verified}+${cited.inferred}+${cited.assigned} vs ${ranked.length}`
);
check(
  'the register cites at least one Indian-regulator requirement, so the RBI/SEBI mapping is live',
  ranked.some((c) => c.framework === 'rbi') && ranked.some((c) => c.framework === 'sebi')
);

console.log(
  `\n${failures === 0 ? 'PASS' : 'FAIL'}: ${checks - failures}/${checks} checks passed` +
    ` — ${ranked.length} controls cited across five frameworks` +
    ` (${cited.verified} verified, ${cited.inferred} inferred, ${cited.assigned} assigned)`
);
console.log(
  'Note: expected-loss figures in this harness are deterministic placeholders, not model output.'
);

fs.rmSync(OUT, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
