/**
 * Builds both regulatory deliverables in Node and validates the bytes with real parsers.
 *
 * `tsc --noEmit` proves the writers type-check. It says nothing about whether Excel can open the
 * workbook or whether a PDF reader finds the pages, and both formats fail silently when they fail
 * — a wrong xref offset yields blank pages, a wrong central-directory offset yields "file is
 * corrupt", and neither shows up in a type check. So this harness composes the two files from the
 * real crosswalk and the real sample scan, then:
 *
 *   - checks the ZIP container structurally in Node (signatures, CRC32 of every entry, EOCD)
 *   - opens the workbook with openpyxl and asserts the cells parse, the sheets are all present,
 *     and currency cells are NUMBERS rather than pre-formatted strings
 *   - checks the PDF's object table: every `N 0 obj` has an xref entry, `startxref` lands on the
 *     xref keyword, and each offset lands on the object it claims
 *   - asserts the honesty caveats are actually in the bytes, not just in the source
 *
 * The scored figures here are deterministic placeholders, not model output. This harness tests
 * the writers and the composition, and it must never be cited for model performance.
 *
 * Run: node scripts/check-exports.cjs
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'export-check-'));
// `node scripts/check-exports.cjs <dir>` keeps the two files somewhere inspectable, so the same
// bytes this harness asserts on can be opened in Excel or a PDF reader by hand.
const ARTEFACTS = process.argv[2]
  ? (fs.mkdirSync(process.argv[2], { recursive: true }), path.resolve(process.argv[2]))
  : fs.mkdtempSync(path.join(os.tmpdir(), 'export-files-'));

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
    path.join(ROOT, 'src', 'export', 'reports.ts'),
    path.join(ROOT, 'src', 'model', 'compliance.ts'),
  ],
  { stdio: 'inherit' }
);

const reports = require(path.join(OUT, 'export', 'reports.js'));
const engineModule = require(path.join(OUT, 'model', 'engine.js'));
const { buildComplianceReport } = require(path.join(OUT, 'model', 'compliance.js'));
const { buildCweIndex, classifyFinding, extractCweIds } = require(path.join(OUT, 'model', 'crosswalk.js'));

const doc = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public', 'frameworks', 'crosswalk.json'), 'utf8')
);
const scan = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'sample-scan.json'), 'utf8'));
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

const TIER = { label: 'High', color: '', bg: '', border: '' };
const assetById = new Map(scan.assets.map((a) => [a.asset_id, a]));

// Deterministic stand-ins for the model's output. Every other finding is given a model_score so
// the writers are exercised on both the scored and the unscored path — a blank probability cell
// is a case the workbook has to render correctly, not an edge case to avoid.
//
// All THREE bases appear, not two. `observed_kev` carries a different claim from `model` — the
// probability is an observation, only the loss is modelled — and the writers now print that
// distinction, so a fixture that never produced one would leave the label unrendered.
const findings = scan.findings.map((f, i) => {
  const asset = assetById.get(f.asset_id);
  const value = asset ? asset.estimated_asset_value_inr : 0;
  const eal = Math.round(value * f.epss_score * 0.01);
  const scored = i % 2 === 0;
  const basis = !scored ? 'heuristic' : f.actively_exploited ? 'observed_kev' : 'model';
  return {
    ...f,
    asset,
    computed_risk_score: Math.round(f.cvss_score * 10),
    expected_loss_inr: eal,
    ai_explanation: 'harness placeholder',
    score_basis: basis,
    model_score: scored
      ? {
          exploitProbability: basis === 'observed_kev' ? 1 : Math.min(0.99, f.epss_score * 2),
          probabilityBasis: basis,
          probabilityHorizonDays: 365,
          rawScore: basis === 'observed_kev' ? null : 0,
          uncalibratedProbability: basis === 'observed_kev' ? null : f.epss_score,
          lossUsd: { mean: 0, p10: 0, p90: 0 },
          lossInr: { mean: value * 0.02, p10: value * 0.005, p90: value * 0.08 },
          lossCappedAtAssetValue: false,
          eal,
          riskIndex: Math.round(f.cvss_score * 10),
          vulnClass: classify(f).key,
          exploitProvenance: 'harness',
          severityProvenance: 'harness',
        }
      : null,
    vuln_class: classify(f),
    tier: TIER,
  };
});

const totalExposure = findings.reduce((s, f) => s + f.expected_loss_inr, 0);

// Derived from the findings rather than written out by hand, so it cannot drift from them. If the
// basis rule above changes, this follows; a hand-typed split would silently start lying and the
// harness would still pass. All three keys are present even at zero, because the writers index
// this record by label and a missing key would throw rather than print nothing.
const byBasis = findings.reduce(
  (acc, f) => {
    acc[f.score_basis].findings += 1;
    acc[f.score_basis].exposureInr += f.expected_loss_inr;
    return acc;
  },
  {
    model: { findings: 0, exposureInr: 0 },
    observed_kev: { findings: 0, exposureInr: 0 },
    heuristic: { findings: 0, exposureInr: 0 },
  }
);

const data = {
  scanMetadata: scan.scan_metadata,
  assets: scan.assets,
  findings,
  candidateInvestments: scan.candidate_investments || [],
  overallOrgRiskScore: 62,
  totalFinancialExposureInr: totalExposure,
  criticalFindingsCount: scan.findings.filter((f) => f.cvss_score >= 9).length,
  activelyExploitedCount: scan.findings.filter((f) => f.actively_exploited).length,
  trendData: [],
  model: {
    status: {
      state: 'absent',
      message: 'HARNESS FIXTURE: no trained artefact is loaded in this check.',
      dataIsReal: false,
      generatedAt: null,
      detail: ['Figures below are deterministic placeholders produced by scripts/check-exports.cjs.'],
    },
    parity: null,
    scored: findings.filter((f) => f.model_score !== null).length,
    total: findings.length,
    byBasis,
    org: null,
    usdInr: null,
    // The scan file states a date, so this is the reassurance branch. The substituted branch prints
    // different text in both deliverables and is exercised on the second build, below.
    scanDateAnchor: { stated: scan.scan_metadata.scan_date, used: scan.scan_metadata.scan_date },
  },
  /*
   * The ingest's own report on the file. Hand-built here for the same reason `model` is: this
   * harness assembles a ProcessedScanResult directly rather than running processScanData, so it
   * gets no validation pass of its own. Clean by default — the exporters' clean wording is what
   * this file's assertions read — and a deliberately dirty copy is built below to exercise the
   * other branch, because both deliverables now print a completeness block.
   *
   * A note for whoever adds the next field to ProcessedScanResult: tsc cannot see this object. It
   * is a .cjs fixture, so a missing required field is a TypeError at harness runtime and nothing at
   * typecheck time. That is exactly how this line came to be added.
   */
  dataQuality: {
    issues: [],
    errorCount: 0,
    warningCount: 0,
    assetsAccepted: scan.assets.length,
    assetsWithStatedValue: scan.assets.length,
    findingsAccepted: findings.length,
    findingsQuantifiable: findings.length,
    controlsAccepted: (scan.candidate_investments || []).length,
    controlsDropped: 0,
  },
  crosswalk: doc,
};

const report = buildComplianceReport(
  doc,
  findings.map((f) => ({
    finding_id: f.finding_id,
    vulnClassKey: f.vuln_class ? f.vuln_class.key : null,
    riskIndex: f.computed_risk_score,
    expectedLossInr: f.expected_loss_inr,
  })),
  data.candidateInvestments.map((c) => ({ control_id: c.control_id, control_name: c.control_name })),
  {
    totalExpectedLossInr: totalExposure,
    meanExploitProbability: null,
    residualRiskIndex: null,
    criticalFindings: data.criticalFindingsCount,
    activelyExploitedCount: data.activelyExploitedCount,
    roiPct: null,
    criticalityProfile: {},
    probabilityUnavailableReason: 'harness: no model is loaded in this check',
  }
);

const optimization = {
  selectedControls: data.candidateInvestments.slice(0, 4),
  totalCost: data.candidateInvestments.slice(0, 4).reduce((s, c) => s + c.cost_inr, 0),
  remainingBudget: 0,
  budgetUtilizationPct: 74,
  totalRiskReductionPct: 38,
  currentRiskScore: 62,
  projectedRiskScore: 48,
  currentExposure: totalExposure,
  projectedExposure: Math.round(totalExposure * 0.62),
  savedExposure: Math.round(totalExposure * 0.38),
  addressedFindingIds: [],
  averageROSI: 210,
};

const xlsxBytes = Buffer.from(
  reports.buildControlRegisterWorkbook(data, report, optimization, doc)
);
const pdfBytes = Buffer.from(reports.buildBoardReportPdf(data, report, optimization, doc));
const xlsxPath = path.join(ARTEFACTS, 'register.xlsx');
const pdfPath = path.join(ARTEFACTS, 'board.pdf');
fs.writeFileSync(xlsxPath, xlsxBytes);
fs.writeFileSync(pdfPath, pdfBytes);
console.log(`\nwrote ${xlsxPath} (${xlsxBytes.length} bytes) and ${pdfPath} (${pdfBytes.length} bytes)`);

/* ---------------------------------------------------------------- ZIP container */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

section('xlsx: ZIP container');
check('starts with a local file header signature', xlsxBytes.readUInt32LE(0) === 0x04034b50);

const eocdAt = xlsxBytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
check('end-of-central-directory record found', eocdAt > 0, `index ${eocdAt}`);
const entryCount = xlsxBytes.readUInt16LE(eocdAt + 10);
const cdSize = xlsxBytes.readUInt32LE(eocdAt + 12);
const cdOffset = xlsxBytes.readUInt32LE(eocdAt + 16);
check(
  'central directory offset + size lands exactly on the EOCD',
  cdOffset + cdSize === eocdAt,
  `${cdOffset} + ${cdSize} = ${cdOffset + cdSize}, EOCD at ${eocdAt}`
);
check('EOCD declares no archive comment', xlsxBytes.readUInt16LE(eocdAt + 20) === 0);

const names = [];
let cursor = cdOffset;
let cdOk = true;
let crcOk = true;
for (let i = 0; i < entryCount; i += 1) {
  if (xlsxBytes.readUInt32LE(cursor) !== 0x02014b50) {
    cdOk = false;
    break;
  }
  const crcDeclared = xlsxBytes.readUInt32LE(cursor + 16);
  const size = xlsxBytes.readUInt32LE(cursor + 24);
  const nameLen = xlsxBytes.readUInt16LE(cursor + 28);
  const extraLen = xlsxBytes.readUInt16LE(cursor + 30);
  const commentLen = xlsxBytes.readUInt16LE(cursor + 32);
  const localAt = xlsxBytes.readUInt32LE(cursor + 42);
  const name = xlsxBytes.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8');
  names.push(name);

  if (xlsxBytes.readUInt32LE(localAt) !== 0x04034b50) cdOk = false;
  const localNameLen = xlsxBytes.readUInt16LE(localAt + 26);
  const localName = xlsxBytes.subarray(localAt + 30, localAt + 30 + localNameLen).toString('utf8');
  if (localName !== name) cdOk = false;
  const dataAt = localAt + 30 + localNameLen + xlsxBytes.readUInt16LE(localAt + 28);
  if (crc32(xlsxBytes.subarray(dataAt, dataAt + size)) !== crcDeclared) crcOk = false;

  cursor += 46 + nameLen + extraLen + commentLen;
}
check(`central directory walks cleanly across all ${entryCount} entries`, cdOk);
check('CRC32 of every entry matches its recorded checksum', crcOk);
check(
  'central directory consumed exactly its declared size',
  cursor === cdOffset + cdSize,
  `stopped at ${cursor}, expected ${cdOffset + cdSize}`
);

for (const required of [
  '[Content_Types].xml',
  '_rels/.rels',
  'xl/workbook.xml',
  'xl/_rels/workbook.xml.rels',
  'xl/styles.xml',
  'docProps/core.xml',
]) {
  check(`archive contains ${required}`, names.includes(required));
}
check('[Content_Types].xml is the first entry', names[0] === '[Content_Types].xml');
check('six worksheet parts are present', names.filter((n) => n.startsWith('xl/worksheets/')).length === 6);
check(
  'zlib can inflate nothing here because entries are STORED, as intended',
  xlsxBytes.readUInt16LE(8) === 0,
  `method ${xlsxBytes.readUInt16LE(8)}`
);
void zlib;

/* ---------------------------------------------------------------- PDF structure */

const pdfText = pdfBytes.toString('latin1');

section('pdf: file structure');
check('begins with the PDF 1.4 header', pdfText.startsWith('%PDF-1.4'));
check('ends with %%EOF', pdfText.trimEnd().endsWith('%%EOF'));

const startxrefAt = pdfText.lastIndexOf('startxref');
check('startxref present', startxrefAt > 0);
const xrefStart = parseInt(pdfText.slice(startxrefAt + 9).trim(), 10);
check(
  'startxref offset lands on the xref keyword',
  pdfText.startsWith('xref', xrefStart),
  `offset ${xrefStart} points at ${JSON.stringify(pdfText.substr(xrefStart, 12))}`
);

const xrefHeader = /^xref\s+0\s+(\d+)\s/.exec(pdfText.slice(xrefStart));
check('xref subsection header parses', xrefHeader !== null);
const declaredSize = xrefHeader ? parseInt(xrefHeader[1], 10) : 0;

const objMatches = [...pdfText.matchAll(/(?:^|\n)(\d+) 0 obj\n/g)];
check(
  `object count matches the xref /Size (${objMatches.length} objects, size ${declaredSize})`,
  objMatches.length + 1 === declaredSize,
  `${objMatches.length} + 1 !== ${declaredSize}`
);
check(
  'object numbers are 1..N with no gaps',
  objMatches.every((m, i) => Number(m[1]) === i + 1),
  objMatches.map((m) => m[1]).join(',')
);

const sizeMatch = /\/Size (\d+)/.exec(pdfText.slice(pdfText.lastIndexOf('trailer')));
check('trailer /Size agrees with the xref header', sizeMatch !== null && Number(sizeMatch[1]) === declaredSize);
check('trailer names object 1 as /Root', /\/Root 1 0 R/.test(pdfText.slice(pdfText.lastIndexOf('trailer'))));
check('object 1 is the catalog', /1 0 obj\n<< \/Type \/Catalog/.test(pdfText));

// Every xref entry must point at the object that claims that number. A one-byte drift here is
// exactly the bug that produces a PDF opening to blank pages, and nothing else catches it.
const entryBlock = pdfText.slice(xrefStart + (xrefHeader ? xrefHeader[0].length : 0));
let offsetsOk = true;
let checkedOffsets = 0;
for (let i = 1; i < declaredSize; i += 1) {
  const line = entryBlock.substr(i * 20, 20);
  const offset = parseInt(line.slice(0, 10), 10);
  if (!pdfText.startsWith(`${i} 0 obj`, offset)) {
    offsetsOk = false;
    console.log(`       object ${i}: xref says ${offset}, found ${JSON.stringify(pdfText.substr(offset, 14))}`);
    break;
  }
  checkedOffsets += 1;
}
check(`all ${checkedOffsets} xref offsets land on their object header`, offsetsOk);
check('free-list entry 0 is present', entryBlock.startsWith('0000000000 65535 f'));

const pageObjects = (pdfText.match(/\/Type \/Page[^s]/g) || []).length;
const countMatch = /\/Type \/Pages \/Count (\d+)/.exec(pdfText);
check('page tree declares a count', countMatch !== null);
check(
  `/Pages /Count matches the number of page objects (${pageObjects})`,
  countMatch !== null && Number(countMatch[1]) === pageObjects,
  countMatch ? `declared ${countMatch[1]}` : 'no count'
);
check('at least three pages of report', pageObjects >= 3, `${pageObjects} pages`);

const kids = /\/Kids \[([^\]]+)\]/.exec(pdfText);
const kidIds = kids ? [...kids[1].matchAll(/(\d+) 0 R/g)].map((m) => Number(m[1])) : [];
check(`/Kids lists one reference per page (${kidIds.length})`, kidIds.length === pageObjects);
check(
  'every /Kids reference resolves to a page object',
  kidIds.length > 0 &&
    kidIds.every((id) => new RegExp(`\\n${id} 0 obj\\n<< /Type /Page `).test(pdfText))
);

let streamLengthsOk = true;
for (const m of pdfText.matchAll(/<< \/Length (\d+) >>\nstream\n/g)) {
  const declared = Number(m[1]);
  const from = m.index + m[0].length;
  const end = pdfText.indexOf('\nendstream', from);
  if (end - from !== declared) {
    streamLengthsOk = false;
    console.log(`       stream at ${from}: /Length ${declared}, actual ${end - from}`);
    break;
  }
}
check('every content stream /Length equals its actual byte length', streamLengthsOk);

/* ------------------------------------------------------- PDF text: the caveats */

// Text is emitted as `(...) Tj`, one operator per wrapped line, so phrase searches have to run
// against the reassembled string rather than the raw bytes.
const drawn = [...pdfText.matchAll(/\(((?:\\.|[^()\\])*)\) Tj/g)]
  .map((m) => m[1].replace(/\\([()\\])/g, '$1'))
  .join(' ')
  .replace(/\s+/g, ' ');

section('pdf: the caveats are in the bytes, not only in the source');
const phrases = [
  ['the non-additivity heading', 'Attributed exposure is not additive'],
  ['the instruction not to sum a control column', 'never a column sum'],
  ['what silence about a control means', 'That is not a statement that the control is implemented'],
  ['the fixture warning from model status', 'HARNESS FIXTURE'],
  ['that no trained artefact is in use', 'No trained artefact is in use'],
  ['the "not a citation" wording', 'NOT a citation'],
  ['the footer disclaimer', 'not a compliance certification'],
  ['ISO/IEC 27001 named', 'ISO/IEC 27001'],
  ['NIST CSF named', 'NIST'],
  ['CIS Controls named', 'CIS'],
  ['RBI named', 'RBI'],
  ['SEBI named', 'SEBI'],
];
for (const [label, needle] of phrases) {
  check(`report states ${label}`, drawn.includes(needle), `missing: ${JSON.stringify(needle)}`);
}
// The fixture runs in state 'absent'. `dataIsReal` is false in that state too, so the wording that
// belongs to a loaded-but-fixture-built artefact must NOT appear — it would describe an artefact
// that does not exist. Asserting the absence is the only thing that keeps the two cases apart.
check(
  'the report does not describe an artefact it never loaded',
  !drawn.includes('The loaded artefact is NOT built from real data'),
  'the fixture-artefact wording leaked into the no-artefact state'
);
check(
  'currency is written with the INR substitution',
  /INR [\d,]+/.test(drawn),
  'no "INR <digits>" found'
);
// The workbook and the report go to the same board on the same day, so a figure must not be
// grouped one way in Calc and another way in the PDF. Same rule as the LibreOffice section
// applies here: three digits in the last group, two in every group before it.
const pdfAmounts = [...drawn.matchAll(/INR (\d[\d,]*\d|\d)/g)].map((m) => m[1]);
const pdfMisgrouped = [...new Set(pdfAmounts.filter((a) => a.includes(',') && !/^\d{1,2}(,\d{2})*,\d{3}$/.test(a)))];
check(
  'the PDF groups currency in lakhs and crores, exactly as the workbook does',
  pdfAmounts.length > 10 && pdfMisgrouped.length === 0,
  pdfMisgrouped.slice(0, 4).join(' ') || `${pdfAmounts.length} amounts`
);
check(
  'the rupee sign never reaches the PDF, since WinAnsi cannot render it',
  !pdfBytes.includes(Buffer.from('₹', 'utf8')) && !drawn.includes('₹')
);

// The board report leads with one exposure figure. Coverage stated in findings does not qualify
// it: three model-scored findings out of eighteen sounds like formula output, but if those three
// sit on the highest-value assets the money is mostly model estimate. So the report must state
// the split in money, and the split must reconcile — a breakdown that does not add up to the
// headline is worse than none, because it looks like arithmetic.
const BASIS_LABELS = {
  model: 'model estimate',
  observed_kev: 'observed exploitation (CISA KEV)',
  heuristic: 'deterministic CVSS/EPSS formula',
};
// A label alone is a name, not a claim. Each method asserts something different about where the
// certainty in its figures came from, and that sentence is the part a regulator reads. Keyed by
// basis so the expectation follows the fixture: assert the wording of a method that scored
// nothing and the harness fails for the writer doing the right thing.
const BASIS_CLAIMS = {
  model: 'from the fitted ensemble',
  observed_kev: 'probability is 1 by observation, not prediction',
  heuristic: 'not fitted to historical outcomes',
};
const presentBases = Object.keys(byBasis).filter((b) => byBasis[b].findings > 0);
check('the report states exposure by method, not only by finding count', drawn.includes('Exposure by method'));
for (const b of presentBases) {
  check(
    `the report names the "${BASIS_LABELS[b]}" share`,
    drawn.includes(BASIS_LABELS[b]),
    `missing: ${JSON.stringify(BASIS_LABELS[b])}`
  );
  check(
    `that share states what it claims, not just its name`,
    drawn.includes(BASIS_CLAIMS[b]),
    `missing: ${JSON.stringify(BASIS_CLAIMS[b])}`
  );
}
for (const b of Object.keys(BASIS_LABELS)) {
  if (presentBases.includes(b)) continue;
  check(
    `the report prints no share for "${BASIS_LABELS[b]}", which scored nothing`,
    !drawn.includes(BASIS_LABELS[b]),
    'a zero-finding method was printed as a zero row'
  );
}
check(
  'the printed shares add up to the exposure the report leads with',
  (() => {
    let sum = 0;
    for (const b of presentBases) {
      // Wrapping is word-based, so "INR 12,34,567 model estimate" survives a line break as three
      // adjacent words in the reassembled string. Match the amount that immediately precedes the
      // label rather than trusting a fixed position in the sentence.
      const m = drawn.match(new RegExp(`INR ([\\d,]+) ${BASIS_LABELS[b].replace(/[()/.]/g, '\\$&')}`));
      if (!m) return false;
      sum += Number(m[1].replace(/,/g, ''));
    }
    return sum === Math.round(totalExposure);
  })(),
  `expected the three shares to sum to ${Math.round(totalExposure)}`
);

// Enrichment provenance. The fixture states no source, which is the state every scan exported by
// a real scanner is in, so the wording that must appear is the explanation of *why* most findings
// cannot be model-scored — not a shrug. Asserting the absent branch is the useful half: the
// present branch only renders once someone has run enrich_scan.py against real NVD data.
check(
  'the report explains why an unenriched scan cannot be model-scored',
  drawn.includes('states no enrichment source') && drawn.includes('24 of its 66 inputs'),
  'the enrichment provenance row is missing or reworded'
);
check(
  'it does not claim an enrichment source it was never given',
  !drawn.includes('enrich_scan.py from data/raw/'),
  'the fixture has no provenance block, so naming the script as the source would be false'
);

// The present branch, rendered for real rather than assumed to work. A second board report from
// the same fixture with an enrichment block attached is cheap (no ZIP walk, no LibreOffice) and
// it is the only coverage that branch can get until data/raw/ is populated — which is exactly the
// kind of code that is written once, never executed, and wrong when it finally runs.
section('pdf: an enriched scan states where its vectors came from');
const enrichedDrawn = (() => {
  const enriched = {
    ...data,
    model: {
      ...data.model,
      enrichment: {
        source: 'ml/enrich_scan.py from data/raw/ (NVD CVE 2.0 extract, EPSS daily archive, CISA KEV)',
        generated_at: '2026-09-02T10:00:00+00:00',
        nvd_records_matched: 17,
        epss_snapshot: '2026-09-01',
      },
    },
  };
  const bytes = Buffer.from(reports.buildBoardReportPdf(enriched, report, optimization, doc));
  return [...bytes.toString('latin1').matchAll(/\(((?:\\.|[^()\\])*)\) Tj/g)]
    .map((m) => m[1].replace(/\\([()\\])/g, '$1'))
    .join(' ')
    .replace(/\s+/g, ' ');
})();
check('it names the script that produced the enrichment', enrichedDrawn.includes('enrich_scan.py'));
check('it names all three upstream sources',
  enrichedDrawn.includes('NVD CVE 2.0') && enrichedDrawn.includes('EPSS daily archive') && enrichedDrawn.includes('CISA KEV'));
check('it states how many findings matched an NVD record',
  enrichedDrawn.includes('17 findings matched an NVD record'));
check('it dates the EPSS snapshot, not just the run', enrichedDrawn.includes('EPSS as of 2026-09-01'));
check(
  'the "no source stated" wording is gone once a source exists',
  !enrichedDrawn.includes('states no enrichment source'),
  'both branches rendered, which means the condition is not exclusive'
);

// Same reasoning as the enrichment branch above, for the two assumptions an operator can now set.
// The base fixture runs with `org: null, usdInr: null`, so without a second build the only wording
// ever executed is "no engine is loaded" — and the branch that a filer will actually read, the one
// naming their sector and their rate, would ship unexercised.
section('pdf: a stated profile and an overridden rate are attributed to the operator');
const statedDrawn = (config) => {
  const stated = { ...data, model: { ...data.model, ...config } };
  const bytes = Buffer.from(reports.buildBoardReportPdf(stated, report, optimization, doc));
  return [...bytes.toString('latin1').matchAll(/\(((?:\\.|[^()\\])*)\) Tj/g)]
    .map((m) => m[1].replace(/\\([()\\])/g, '$1'))
    .join(' ')
    .replace(/\s+/g, ' ');
};
const bankDrawn = statedDrawn({
  org: { employeeBand: '1001 to 10000', naics2: '52', sectorLabel: 'Finance and insurance' },
  usdInr: 92.5,
});
check('the comparison set names the sector and the headcount band', bankDrawn.includes('Finance and insurance, 1001 to 10000 employees'));
check(
  'it says the profile is part of every loss figure, not a label on them',
  bankDrawn.includes('select which comparable incidents the severity model reasons from')
);
check('a fully stated profile is described as narrower than the default', bankDrawn.includes('narrower than the platform default'));
check(
  'an overridden rate is attributed to the operator and the default it replaced is printed',
  bankDrawn.includes('USD/INR 92.5') && bankDrawn.includes('Operator override') && bankDrawn.includes('the platform default is 85'),
  'an override that printed the default\'s as-of date would credit a dated assumption for an operator\'s number'
);
check('and it says what the rate does to the figures', bankDrawn.includes('scales linearly with this number'));
check(
  'the "no engine loaded" wording is gone once both are stated',
  !bankDrawn.includes('No engine is loaded, so no comparison set applies'),
  'both branches rendered, which means the condition is not exclusive'
);
// A profile with a sector but no headcount is the likeliest real state — an operator names their
// industry and leaves the band alone. It must not be described as narrower than the default.
const halfDrawn = statedDrawn({
  org: { employeeBand: 'Unknown', naics2: '61', sectorLabel: 'Educational services' },
  usdInr: 85,
});
check(
  'a half-stated profile is described as the broadest comparison set, not as narrower',
  halfDrawn.includes('broadest available') && !halfDrawn.includes('narrower than the platform default')
);
check(
  'a rate left at the default is still attributed to the platform, with its date',
  halfDrawn.includes('Platform default, stated as of 2025-05-31') && !halfDrawn.includes('Operator override')
);
check(
  'the unstated half is called a training category rather than a missing value',
  halfDrawn.includes('real training category rather than a missing')
);

/*
 * The feature anchor. The base fixture states a scan date, so the branch a reader hits when the
 * scan does NOT — the one that has to admit a substitution — would never be drawn. It is the branch
 * that matters: the substitution is directional (today is later than any scan, so every CVE looks
 * older than it was), and an unstated directional substitution is the leak ml/enrich_scan.py
 * refuses to make on the training side.
 */
section('pdf: a substituted feature anchor admits the substitution and its direction');
check(
  'the stated anchor is printed with the date, and named as the scan file\'s own',
  drawn.includes('Features were anchored on ' + scan.scan_metadata.scan_date) &&
    drawn.includes('the date the scan file states'),
  drawn.slice(drawn.indexOf('Feature anchor'), drawn.indexOf('Feature anchor') + 140)
);
check(
  'a stated anchor says no post-scan information entered the figures',
  drawn.includes('no post-scan information enters the figures')
);
const substitutedDrawn = statedDrawn({ scanDateAnchor: { stated: null, used: '2026-09-02' } });
check(
  'a substituted anchor says the scan states no date, and prints the date used instead',
  substitutedDrawn.includes('states no parseable scan_date') && substitutedDrawn.includes('2026-09-02'),
  substitutedDrawn.slice(substitutedDrawn.indexOf('Feature anchor'), substitutedDrawn.indexOf('Feature anchor') + 200)
);
check(
  'it names both features that read the anchor, so the reader knows what moved',
  substitutedDrawn.includes('how long') && substitutedDrawn.includes('public') &&
    substitutedDrawn.includes('incident year')
);
check(
  'it states the direction of the error rather than calling it merely approximate',
  substitutedDrawn.includes('upper bound'),
  'a substitution that does not say which way it errs is not a caveat'
);
check(
  'it says what to change to remove the substitution',
  substitutedDrawn.includes('scan_metadata.scan_date')
);
check(
  'the reassuring wording is gone once the anchor is substituted',
  !substitutedDrawn.includes('no post-scan information enters the figures'),
  'both branches rendered, which means the condition is not exclusive'
);

section('pdf: the caveats, continued');
check(
  'no run of missing-glyph markers',
  !/\?\?/.test(drawn),
  'found "??", which means characters were dropped rather than transliterated'
);
check(
  'every drawn line stays inside the content column',
  (() => {
    const { textWidth } = require(path.join(OUT, 'export', 'pdf.js'));
    const max = 595.28 - 46 * 2;
    for (const m of pdfText.matchAll(/\/(F1|F2) ([\d.]+) Tf 1 0 0 1 ([\d.]+) [\d.]+ Tm \(((?:\\.|[^()\\])*)\) Tj/g)) {
      const bold = m[1] === 'F2';
      const size = Number(m[2]);
      const x = Number(m[3]);
      const text = m[4].replace(/\\([()\\])/g, '$1');
      if (x - 46 + textWidth(text, size, bold) > max + 0.5) return false;
    }
    return true;
  })()
);

/* --------------------------------------------------- xlsx: open it with openpyxl */

section('xlsx: openpyxl reads it back');

/*
  A second workbook, for the same reason a second PDF is drawn below the caveats section: the
  fixture runs with `org: null, usdInr: null`, so the only wording the base workbook ever executes
  on the two assumption rows is "not applicable — no engine loaded". The branch a filer will
  actually read — the one naming their sector and their own rate — would ship unexercised, and it
  is the branch that has to attribute an operator's number to the operator rather than to a dated
  platform assumption.
*/
const STATED_ORG = {
  employeeBand: '1001 to 10000',
  naics2: '52',
  sectorLabel: 'Finance and insurance',
};
const STATED_RATE = 92.5;
// The second workbook also carries the OTHER branch of the feature-anchor row. The base fixture
// states a scan date, so without this the substituted wording — the one that has to admit today was
// used instead, and say which way that errs — would ship undrawn in the workbook exactly as it
// nearly did in the PDF.
const SUBSTITUTED_ANCHOR = { stated: null, used: '2026-09-02' };
const statedData = {
  ...data,
  model: { ...data.model, org: STATED_ORG, usdInr: STATED_RATE, scanDateAnchor: SUBSTITUTED_ANCHOR },
};
const statedXlsxPath = path.join(ARTEFACTS, 'register-stated.xlsx');
fs.writeFileSync(
  statedXlsxPath,
  Buffer.from(reports.buildControlRegisterWorkbook(statedData, report, optimization, doc))
);

const expectPath = path.join(ARTEFACTS, 'expect.json');
fs.writeFileSync(
  expectPath,
  JSON.stringify({
    xlsx: xlsxPath,
    xlsxStated: statedXlsxPath,
    statedOrg: STATED_ORG,
    statedRate: STATED_RATE,
    statedAnchor: scan.scan_metadata.scan_date,
    substitutedAnchor: SUBSTITUTED_ANCHOR.used,
    defaultRate: engineModule.USD_INR_ASSUMPTION.rate,
    defaultRateAsOf: engineModule.USD_INR_ASSUMPTION.asOf,
    totalExposure,
    controlRows: report.controls.length,
    findingRows: findings.length,
    investmentRows: data.candidateInvestments.length,
    metricRows: report.metrics.length,
    frameworkRows: report.frameworks.length,
    byBasis,
  })
);

const py = `
import json, sys
import openpyxl

spec = json.load(open(sys.argv[1]))
wb = openpyxl.load_workbook(spec["xlsx"])
out = []

def ok(label, cond, detail=""):
    out.append({"label": label, "ok": bool(cond), "detail": detail})

expected_sheets = ["Summary", "Control Register", "Findings", "Investments", "Risk Metrics", "Framework Coverage"]
ok("all six sheets present and in order", wb.sheetnames == expected_sheets, str(wb.sheetnames))

s = wb["Summary"]
labels = {}
for row in s.iter_rows(min_col=1, max_col=2):
    if row[0].value is not None:
        labels[str(row[0].value)] = row[1].value if len(row) > 1 else None

total = labels.get("Total expected annual loss")
ok("Summary total exposure is a number, not a formatted string", isinstance(total, (int, float)), repr(total))
ok("Summary total exposure equals the portfolio total", total == spec["totalExposure"], f"{total} vs {spec['totalExposure']}")
ok("Summary reports whether the data is real", "NO" in str(labels.get("Figures are from real data", "")), repr(labels.get("Figures are from real data")))
joined = " ".join(str(c.value) for row in s.iter_rows() for c in row if c.value)
ok("Summary carries the non-additivity warning", "not additive" in joined)
ok("Summary explains 'no evidence'", "does not mean the control is implemented" in joined.replace("  ", " "))
for level in ("verified", "inferred", "assigned"):
    ok(f"Summary defines '{level}'", level in joined)

# The headline total is a sum over findings scored by unrelated methods. The "of which" rows are
# what let a filer say how much of it is a model estimate, so they are checked as arithmetic
# rather than as prose: each present basis appears once, each amount is a number, and the rows
# reconstruct the total exactly. If they did not, the split would be decorative.
split = {k: v for k, v in labels.items() if k.strip().startswith("of which")}
expected_present = {b for b, v in spec["byBasis"].items() if v["findings"] > 0}
label_for = {
    "model": "model estimate",
    "observed_kev": "observed exploitation (CISA KEV)",
    "heuristic": "deterministic CVSS/EPSS formula",
}
# The claim, not the label. Keyed by basis for the same reason as in the PDF section: a method
# with no findings has no row, so its wording must not be expected.
claim_for = {
    "model": "from the fitted ensemble",
    "observed_kev": "probability is 1 by observation, not prediction",
    "heuristic": "not fitted to historical outcomes",
}
ok("Summary breaks the total down by scoring method, one row per method in use",
   len(split) == len(expected_present), f"{len(split)} rows for {sorted(expected_present)}: {sorted(split)}")
for basis in sorted(expected_present):
    want = label_for[basis]
    ok(f"Summary names the '{want}' share of the total",
       any(want in k for k in split), sorted(split))
    ok(f"the '{want}' share states what it claims", claim_for[basis] in joined)
ok("every 'of which' amount is a number, not a formatted string",
   split and all(isinstance(v, (int, float)) for v in split.values()),
   repr(list(split.values())))
ok("the 'of which' amounts reconstruct the headline total exactly",
   round(sum(v for v in split.values() if isinstance(v, (int, float)))) == round(spec["totalExposure"]),
   f"{sum(v for v in split.values() if isinstance(v, (int, float)))} vs {spec['totalExposure']}")
ok("no 'of which' row is printed for a method that scored nothing",
   not any(label_for[b] in k for b in set(label_for) - expected_present for k in split),
   sorted(split))

# Same reasoning as the PDF: the fixture states no enrichment source, so the Summary must explain
# the consequence rather than leave the cell blank.
enrich = labels.get("Scan enrichment source")
ok("Summary has a scan-enrichment row", enrich is not None, str(sorted(labels)[:6]))
ok("it says no source was stated and why that limits scoring",
   "none stated" in str(enrich) and "CVSS v3 vector" in str(enrich), repr(enrich))
ok("it points at the script that would fix it",
   "ml/enrich_scan.py" in joined, "the remediation is not stated anywhere on the sheet")

# The two rows an operator can change. Read as three cells, not as prose: the value cell has to
# carry the number or the profile itself so a reader can reproduce the figures from it, and the
# note cell has to say whose number it is. Checked here on the base fixture (no engine) and below
# on the stated workbook, because the two take different branches and only one of them is the one
# a filer reads.
def summary_rows(sheet):
    found = {}
    for row in sheet.iter_rows(min_col=1, max_col=3):
        if row[0].value is not None:
            found[str(row[0].value)] = [c.value for c in row[1:]]
    return found

base_rows = summary_rows(s)
rate_row = base_rows.get("USD→INR rate used")
ok("Summary has a USD/INR row with a value and a note cell",
   rate_row is not None and len(rate_row) >= 2, repr(rate_row))
ok("with no engine the rate row says so in both cells rather than printing a rate",
   str(rate_row[0]) == "not applicable" and str(rate_row[1]) == "no engine loaded", repr(rate_row))
comparison_row = base_rows.get("Comparison set")
ok("Summary has a comparison-set row", comparison_row is not None, str(sorted(base_rows)[:8]))
ok("with no engine the comparison set is 'not applicable', and it names the reason",
   "not applicable" in str(comparison_row[0]) and "no engine loaded" in str(comparison_row[0]),
   repr(comparison_row))

# The same two rows, from a workbook built with a stated profile and an overridden rate.
st = openpyxl.load_workbook(spec["xlsxStated"])["Summary"]
stated_rows = summary_rows(st)
stated_joined = " ".join(str(c.value) for row in st.iter_rows() for c in row if c.value)
srate = stated_rows.get("USD→INR rate used")
ok("the overridden rate is printed as the operator set it",
   str(srate[0]) == str(spec["statedRate"]), repr(srate))
ok("the overridden rate is attributed to the operator, not to the platform",
   "operator override" in str(srate[1]).lower(), repr(srate[1]))
ok("the overridden rate's note still names the default it replaced, and that default's date",
   str(spec["defaultRate"]) in str(srate[1]) and spec["defaultRateAsOf"] in str(srate[1]), repr(srate[1]))
ok("an overridden rate does NOT print the platform default's as-of date as its own",
   "platform default, stated as of" not in str(srate[1]), repr(srate[1]))
scomp = stated_rows.get("Comparison set")
ok("the stated comparison set names the sector and the headcount band",
   spec["statedOrg"]["sectorLabel"] in str(scomp[0]) and spec["statedOrg"]["employeeBand"] in str(scomp[0]),
   repr(scomp))
ok("the stated comparison set says what it selects, so the figures can be reproduced",
   "which VERIS incidents" in str(scomp[1]), repr(scomp[1]))
ok("the no-engine wording is gone from the stated workbook's Summary",
   "no engine loaded" not in stated_joined)

# The feature anchor, read as three cells for the same reason as the rate: the value cell must carry
# the date the features were built against so a filer can reproduce them, and the note cell must say
# whether that date came from the scan. Base workbook = stated; stated workbook = substituted.
anchor_row = base_rows.get("Feature anchor date")
ok("Summary has a feature-anchor row with a value and a note cell",
   anchor_row is not None and len(anchor_row) >= 2, repr(anchor_row))
ok("the stated anchor prints the scan's own date",
   str(anchor_row[0]) == spec["statedAnchor"], repr(anchor_row))
ok("and attributes it to the scan file rather than to the platform",
   "stated by the scan file" in str(anchor_row[1]), repr(anchor_row[1]))
sanchor = stated_rows.get("Feature anchor date")
ok("a substituted anchor still prints the date actually used, not a blank",
   str(sanchor[0]) == spec["substitutedAnchor"], repr(sanchor))
ok("a substituted anchor is labelled SUBSTITUTED in the note, not merely explained",
   "SUBSTITUTED" in str(sanchor[1]), repr(sanchor[1]))
ok("it says which direction the substitution errs, so a filer can bound it",
   "upper bound" in str(sanchor[1]), repr(sanchor[1]))
ok("it names the field to set to remove the substitution",
   "scan_metadata.scan_date" in str(sanchor[1]), repr(sanchor[1]))
ok("the 'stated by the scan file' wording is gone once the anchor is substituted",
   "stated by the scan file" not in str(sanchor[1]), repr(sanchor[1]))

reg = wb["Control Register"]
ok("Control Register header sits on row 3", reg.cell(row=3, column=1).value == "Framework")
ok("Control Register has one row per catalogued control",
   reg.max_row == 3 + spec["controlRows"], f"max_row={reg.max_row}, expected {3 + spec['controlRows']}")
ok("Control Register freezes the header", reg.freeze_panes == "A4", repr(reg.freeze_panes))
ok("Control Register has an autofilter", reg.auto_filter.ref is not None, repr(reg.auto_filter.ref))
ok("Control Register row 2 states the non-additivity caveat", "not additive" in str(reg.cell(row=2, column=1).value))
eal_numeric = all(isinstance(reg.cell(row=r, column=11).value, (int, float))
                  for r in range(4, min(reg.max_row, 60) + 1))
ok("Attributed EAL cells are numbers", eal_numeric)
fmt = reg.cell(row=4, column=11).number_format
# The repeated-group spelling ("##,##,##0") is what Excel documents, but LibreOffice ignores
# the repetition and renders plain thousands grouping. The magnitude-band spelling below is
# honoured by both, so that is what the writer must emit. Verified against LibreOffice by
# converting the workbook to CSV with "save cell contents as shown".
ok("Attributed EAL uses the banded Indian rupee grouping",
   fmt.startswith("[>=10000000]") and "[>=100000]" in fmt and "\\\\," in fmt, fmt)
ok("the rupee format bands are ordered crore, lakh, then plain",
   fmt.index("[>=10000000]") < fmt.index("[>=100000]") and fmt.count(";") == 2, fmt)
# That format carries two conditions plus a fallback, which is the maximum, so the fallback
# cannot also carry a sign: a negative amount would print without its minus. Nothing may put
# a negative number in a rupee cell. Discovered by format rather than by column index, so a
# new currency column added later is covered without touching this check.
negative_inr = []
rupee_cells = 0
for sheet in wb.worksheets:
    for row in sheet.iter_rows():
        for cell in row:
            if "₹" not in str(cell.number_format):
                continue
            if isinstance(cell.value, (int, float)):
                rupee_cells += 1
                if cell.value < 0:
                    negative_inr.append(f"{sheet.title}!{cell.coordinate}={cell.value}")
ok("the rupee format is actually applied to cells", rupee_cells > 250, f"{rupee_cells} cells")
ok("no rupee cell holds a negative number (the format cannot show a minus)",
   not negative_inr, "; ".join(negative_inr[:5]))
states = {reg.cell(row=r, column=12).value for r in range(4, reg.max_row + 1)}
ok("register distinguishes the three control states",
   states == {"OPEN GAP", "remediation mapped", "no evidence"}, str(states))
vers = {reg.cell(row=r, column=3).value for r in range(4, reg.max_row + 1)}
ok("register carries verification on every row", vers <= {"verified", "inferred", "assigned"} and vers, str(vers))

f = wb["Findings"]
ok("Findings has one row per finding", f.max_row == 3 + spec["findingRows"], f"max_row={f.max_row}")
epss = [f.cell(row=r, column=11).value for r in range(4, f.max_row + 1)]
ok("EPSS cells are fractions, not strings", all(isinstance(v, (int, float)) and 0 <= v <= 1 for v in epss))
ok("EPSS is formatted as a percentage", "%" in f.cell(row=4, column=11).number_format)
eal = [f.cell(row=r, column=20).value for r in range(4, f.max_row + 1)]
ok("finding expected-loss cells are numbers", all(isinstance(v, (int, float)) for v in eal))
ok("finding expected losses sum to the portfolio total",
   round(sum(eal)) == round(spec["totalExposure"]), f"{sum(eal)} vs {spec['totalExposure']}")
blank_probs = [f.cell(row=r, column=16).value for r in range(4, f.max_row + 1)]
ok("unscored findings leave the probability cell empty rather than zero",
   any(v is None for v in blank_probs) and any(isinstance(v, float) for v in blank_probs))
iso_col = [f.cell(row=r, column=22).value for r in range(4, f.max_row + 1)]
ok("findings carry ISO control references", any(v and "A." in str(v) for v in iso_col))

inv = wb["Investments"]
ok("Investments has one row per candidate", inv.max_row == 3 + spec["investmentRows"], f"max_row={inv.max_row}")
sel = {inv.cell(row=r, column=5).value for r in range(4, inv.max_row + 1)}
ok("Investments marks which controls the optimiser selected", sel <= {"yes", "no"} and "yes" in sel, str(sel))

m = wb["Risk Metrics"]
ok("Risk Metrics has one row per mapped metric", m.max_row == 3 + spec["metricRows"], f"max_row={m.max_row}")
missing_have_reason = True
for r in range(4, m.max_row + 1):
    if str(m.cell(row=r, column=4).value).startswith("not available"):
        if not m.cell(row=r, column=5).value:
            missing_have_reason = False
ok("every unavailable metric states why", missing_have_reason)

cov = wb["Framework Coverage"]
first = [cov.cell(row=r, column=1).value for r in range(4, 4 + spec["frameworkRows"])]
ok("Framework Coverage lists all five frameworks", len([x for x in first if x]) == spec["frameworkRows"], str(first))
sources = [cov.cell(row=r, column=13).value for r in range(4, 4 + spec["frameworkRows"])]
ok("every framework row names the document it was read from",
   all(isinstance(s, str) and len(s) > 40 for s in sources),
   str([len(s) if isinstance(s, str) else None for s in sources]))
ok("the RBI and SEBI rows cite their circular numbers",
   any("DBS.CO/CSITE" in str(s) for s in sources) and any("CIR/2024/113" in str(s) for s in sources))
covjoined = " ".join(str(c.value) for row in cov.iter_rows() for c in row if c.value)
ok("Framework Coverage breaks down by control group", "By control group" in covjoined)

print(json.dumps(out))
`;

const pyPath = path.join(ARTEFACTS, 'verify.py');
fs.writeFileSync(pyPath, py);
try {
  const pyBin = process.env.PYTHON || (
    fs.existsSync(path.join(ROOT, '.venv', 'Scripts', 'python.exe'))
      ? path.join(ROOT, '.venv', 'Scripts', 'python.exe')
      : fs.existsSync(path.join(ROOT, '.venv', 'bin', 'python'))
        ? path.join(ROOT, '.venv', 'bin', 'python')
        : 'python3'
  );
  const raw = execFileSync(pyBin, [pyPath, expectPath], { encoding: 'utf8' });
  for (const r of JSON.parse(raw.slice(raw.indexOf('[')))) check(r.label, r.ok, r.detail);
} catch (e) {
  failures += 1;
  checks += 1;
  console.log(`  FAIL openpyxl could not validate the workbook — ${e.message}`);
}

// ---------------------------------------------------------------------------
// A real spreadsheet application opens it, and renders the currency correctly.
//
// openpyxl reads the number format as a string; it never applies it. Whether ₹6857300 reaches
// the reader as "₹ 68,57,300" or as "₹ 6,857,300" is a rendering question, and getting it wrong
// is the kind of defect that survives every other check in this file — which is exactly what
// happened: the repeated-group format Excel documents turned out to be ignored by LibreOffice.
// So convert the workbook with LibreOffice and read back what it actually drew.
//
// Skipped, not failed, where LibreOffice is absent: it is a stronger check than the harness can
// require of every machine.
// ---------------------------------------------------------------------------
section('xlsx: LibreOffice opens it and renders the rupee grouping');

function findSoffice() {
  for (const candidate of ['soffice', 'libreoffice']) {
    try {
      return execFileSync('which', [candidate], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      /* not on PATH */
    }
  }
  return null;
}

const soffice = findSoffice();
if (!soffice) {
  console.log('  skip LibreOffice is not installed, so the rendering check did not run');
} else {
  const csvDir = path.join(ARTEFACTS, 'libreoffice');
  fs.rmSync(csvDir, { recursive: true, force: true });
  fs.mkdirSync(csvDir, { recursive: true });
  // Token 9 of the CSV filter is "save cell contents as shown" — that is the whole point of
  // this section, since it makes LibreOffice apply the number format rather than dump the raw
  // value. Token 12 of -1 exports every sheet to its own file.
  const filter = 'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,true,false,false,-1';
  try {
    execFileSync(
      soffice,
      [
        '--headless',
        '--norestore',
        `-env:UserInstallation=file://${path.join(csvDir, 'profile')}`,
        '--convert-to',
        filter,
        '--outdir',
        csvDir,
        xlsxPath,
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 240000 }
    );
  } catch (e) {
    check('LibreOffice converted the workbook', false, e.message);
  }

  const csvs = fs
    .readdirSync(csvDir)
    .filter((f) => f.endsWith('.csv'))
    .map((f) => ({ sheet: f.replace(/^register-/, '').replace(/\.csv$/, ''), body: fs.readFileSync(path.join(csvDir, f), 'utf8') }));

  check('LibreOffice wrote one file per sheet', csvs.length === 6, `${csvs.length} files`);
  const sheetsSeen = csvs.map((c) => c.sheet).sort();
  check(
    'every expected sheet survived the round trip',
    ['Control Register', 'Findings', 'Framework Coverage', 'Investments', 'Risk Metrics', 'Summary'].every((s) =>
      sheetsSeen.includes(s)
    ),
    sheetsSeen.join(', ')
  );

  const registerCsv = csvs.find((c) => c.sheet === 'Control Register');
  check(
    'the Control Register kept all of its rows',
    registerCsv !== undefined && registerCsv.body.trimEnd().split('\n').length === 3 + report.controls.length,
    registerCsv ? String(registerCsv.body.trimEnd().split('\n').length) : 'missing'
  );

  const allDrawn = csvs.map((c) => c.body).join('\n');
  // The trailing \d matters: in the CSV an unquoted "₹ 0" is followed by the field separator,
  // and a greedier pattern would capture that comma as part of the number.
  const rupeeAmounts = [...allDrawn.matchAll(/₹ (\d[\d,]*\d|\d)/g)].map((m) => m[1]);
  check('LibreOffice drew rupee amounts', rupeeAmounts.length > 250, `${rupeeAmounts.length} amounts`);

  // Indian grouping: three digits in the last group, two in every group before it. The
  // thousands-grouped ₹ 6,857,300 that the previous format produced fails this.
  const misgrouped = [...new Set(rupeeAmounts.filter((a) => a.includes(',') && !/^\d{1,2}(,\d{2})*,\d{3}$/.test(a)))];
  check(
    'every grouped amount uses lakh/crore grouping, not thousands',
    misgrouped.length === 0,
    misgrouped.slice(0, 4).join(' ')
  );
  check(
    'at least one amount is large enough to prove the crore band renders',
    rupeeAmounts.some((a) => a.replace(/,/g, '').length >= 8 && /^\d{1,2}(,\d{2}){2},\d{3}$/.test(a)),
    rupeeAmounts.filter((a) => a.replace(/,/g, '').length >= 8).slice(0, 3).join(' ')
  );

  // The workbook's headline figure must read the same in Calc as the PDF prints it. Grouped
  // here without toLocaleString so the assertion does not depend on how Node was built with ICU.
  const grouped = (() => {
    const digits = String(Math.round(totalExposure));
    if (digits.length <= 3) return digits;
    const head = digits.slice(0, -3);
    return `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${digits.slice(-3)}`;
  })();
  const expectedTotal = `₹ ${grouped}`;
  check(
    `the Summary total reads ${expectedTotal} as drawn`,
    allDrawn.includes(expectedTotal),
    [...new Set(rupeeAmounts)].slice(0, 3).join(' ')
  );

  const summaryCsv = csvs.find((c) => c.sheet === 'Summary');
  // Same three-way split as the PDF: the fixture is in state 'absent', so the Summary cell must
  // say no artefact is loaded, and must not claim a loaded artefact failed the real-data test.
  check(
    'the provenance warning survives into a real spreadsheet application',
    summaryCsv !== undefined &&
      summaryCsv.body.includes('no trained artefact is in use') &&
      !summaryCsv.body.includes('do not quote these figures'),
    summaryCsv ? 'present but worded for the wrong model state' : 'Summary sheet missing'
  );
}

console.log(`\n${checks - failures}/${checks} checks passed`);
console.log(
  'Note: the scored figures in this harness are deterministic placeholders, not model output. ' +
    'It validates the writers and the composition, never model performance.'
);
process.exit(failures === 0 ? 0 : 1);
