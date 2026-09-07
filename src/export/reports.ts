/**
 * Composes the two regulatory deliverables from a processed scan: an Excel control register and
 * a PDF board report.
 *
 * The split of labour between them is deliberate. The workbook is the machine-readable artefact
 * — every control, every finding, every mapping, as numbers a reviewer can sort, filter and
 * total for themselves. The PDF is the argument: the headline exposure, what it is evidence
 * about, and what the money would buy, in the order a board reads.
 *
 * Both carry the same three caveats the UI carries, because an exported file outlives the tab
 * it came from and will be read by someone who never saw the screen:
 *   - which identifiers are citations and which this project assigned;
 *   - that attributed exposure per control is not additive;
 *   - whether the figures came from a trained model, from observed exploitation, or from the
 *     deterministic fallback.
 */
import type {
  ProcessedScanResult,
  OptimizationResult,
  EnrichedFinding,
  ScoreBasisLabel,
} from '../utils/riskUtils';
import type { ComplianceReport, ControlStatus } from '../model/compliance';
import type { ControlRefs, CrosswalkFile, FrameworkId, Verification } from '../model/crosswalk';
import { FRAMEWORK_ORDER, classifyMitigation } from '../model/crosswalk';
import { USD_INR_ASSUMPTION } from '../model/engine';
import { STYLE, buildXlsx, type Cell, type Sheet } from './xlsx';
import { INK, PdfBuilder, pdfCurrency, type Rgb, type TableRow } from './pdf';

const VERIFICATION_MEANING: Record<Verification, string> = {
  verified:
    'Identifier and title checked against the published standard. Citable as a reference to that standard.',
  inferred:
    'Requirement substance follows the primary document, but the official clause numbering could not be confirmed. NOT a citation.',
  assigned:
    'Identifier created by this platform, with the mapping basis recorded on each row. NOT a citation.',
};

const NON_ADDITIVE_NOTE =
  'Attributed EAL is not additive. One finding implicates several controls, so the same rupee of ' +
  'expected annual loss appears on every row it is evidence for. Use the portfolio total on the ' +
  'Summary sheet, never a column sum.';

function t(value: string, style: number = STYLE.TEXT_WRAP): Cell {
  return { v: value, s: style };
}
function n(value: number, style: number = STYLE.INTEGER): Cell {
  return { v: value, s: style };
}
function money(value: number, style: number = STYLE.INR): Cell {
  return { v: value, s: style };
}
function head(value: string): Cell {
  return { v: value, s: STYLE.HEADER };
}

function refsFor(doc: CrosswalkFile, classKey: string | null): ControlRefs | null {
  if (!classKey) return null;
  return doc.vulnerability_classes.find((c) => c.key === classKey)?.controls ?? null;
}

function refList(refs: ControlRefs | null, framework: FrameworkId): string {
  return refs ? (refs[framework] ?? []).join(', ') : '';
}

/** The weakest verification level a framework's cited controls carry — the honest headline. */
function weakest(counts: Partial<Record<Verification, number>>): Verification {
  if ((counts.assigned ?? 0) > 0) return 'assigned';
  if ((counts.inferred ?? 0) > 0) return 'inferred';
  return 'verified';
}

function stateLabel(state: ControlStatus['state']): string {
  return state === 'gap' ? 'OPEN GAP' : state === 'gap_with_plan' ? 'remediation mapped' : 'no evidence';
}

function section(label: string): Cell[] {
  return [{ v: label, s: STYLE.BOLD }];
}

/**
 * The exposure total, divided by the method that produced each part of it.
 *
 * Both writers need this and neither may compute it differently, so it lives here once. Bases with
 * no findings are dropped rather than printed as zero: a row reading "model estimate: ₹0" in a
 * deployment with no model invites the reader to think the model scored everything at nil.
 *
 * `observed_kev` is kept separate from `model` on purpose. Its probability is 1 because CISA says
 * the CVE is exploited, not because an ensemble estimated it — merging the two would let a
 * regulator read observed facts as model output, which is the more flattering of the two readings
 * and therefore the one to avoid.
 */
function exposureByBasis(
  data: ProcessedScanResult
): Array<{ label: string; claim: string; findings: number; exposureInr: number }> {
  const spec: Array<{ basis: ScoreBasisLabel; label: string; claim: string }> = [
    {
      basis: 'model',
      label: 'model estimate',
      claim: 'exploitation probability from the fitted ensemble, loss band from the severity model',
    },
    {
      basis: 'observed_kev',
      label: 'observed exploitation (CISA KEV)',
      claim: 'probability is 1 by observation, not prediction; only the loss figure is modelled',
    },
    {
      basis: 'heuristic',
      label: 'deterministic CVSS/EPSS formula',
      claim: 'transparent but not fitted to historical outcomes',
    },
  ];
  return spec
    .map((s) => ({ ...s, ...data.model.byBasis[s.basis] }))
    .filter((s) => s.findings > 0);
}

/**
 * Sheet 1. Scan identity, the headline figures, and — first, before any number — where those
 * figures came from. A reviewer who reads only this sheet should still know whether the
 * exposure column is model output or the deterministic fallback.
 */
function summarySheet(
  data: ProcessedScanResult,
  report: ComplianceReport,
  optimization: OptimizationResult | null
): Sheet {
  const status = data.model.status;
  const cited = report.controls.filter((c) => c.state !== 'not_implicated');
  const citedCounts: Record<Verification, number> = { verified: 0, inferred: 0, assigned: 0 };
  for (const c of cited) citedCounts[c.verification] += 1;

  const rows: Cell[][] = [
    [{ v: 'Cyber Risk Control Register', s: STYLE.TITLE }],
    [t(`${data.scanMetadata.organization} — scan of ${data.scanMetadata.scan_date}`, STYLE.NOTE)],
    [t(`Generated ${new Date(report.generatedAt).toISOString()} by CyberRisk Optimizer.`, STYLE.NOTE)],
    [],
    section('Model provenance'),
    [t('Model state'), t(status.state)],
    [t('What that means'), t(status.message)],
    [
      t('Figures are from real data'),
      t(
        status.state !== 'trained'
          ? 'NO — no trained artefact is in use, so these are deterministic-formula figures'
          : status.dataIsReal
            ? 'yes'
            : 'NO — do not quote these figures as measured performance'
      ),
    ],
    [t('Model artefact built'), t(status.generatedAt ?? 'not applicable — no artefact loaded')],
    [
      // Deliberately NOT labelled "scored by the model": `scored` counts every finding carrying a
      // model-derived figure, and for a KEV finding the probability is 1 by observation — the engine
      // refuses to predict a fact it was told. Reporting 15 of 18 as model coverage when the
      // exploitation model predicted 3 of them overstates the model in the one row a reviewer reads
      // to size it. The split is stated instead of the total alone.
      t('Findings with a model-derived figure'),
      n(data.model.scored),
      t(
        `of ${data.model.total} in this scan — ${data.model.byBasis.model.findings} with an exploitation ` +
          `probability predicted by the model, ${data.model.byBasis.observed_kev.findings} listed in CISA KEV ` +
          'and carrying probability 1 by observation'
      ),
    ],
    [
      // The usual reason the row above is low. Stated next to it rather than in a footnote.
      t('Scan enrichment source'),
      t(
        data.model.enrichment?.source ??
          'none stated in the scan file — findings without a CVSS v3 vector cannot reach the exploitation model'
      ),
      t(
        data.model.enrichment
          ? [
              typeof data.model.enrichment.nvd_records_matched === 'number'
                ? `${data.model.enrichment.nvd_records_matched} findings matched an NVD record`
                : '',
              data.model.enrichment.epss_snapshot ? `EPSS as of ${data.model.enrichment.epss_snapshot}` : '',
              data.model.enrichment.generated_at ? `written ${data.model.enrichment.generated_at}` : '',
            ]
              .filter(Boolean)
              .join('; ')
          : 'run ml/enrich_scan.py against a populated data/raw/ to fill them from NVD',
        STYLE.NOTE
      ),
    ],
    [
      /*
       * The date the features were anchored on. Two features read it — how long the CVE had been
       * public, and the severity model's incident year — so a filer reproducing these figures needs
       * to know which date they were computed against, and needs to be told when it was not the
       * scan's own. Today is later than any scan, so a substituted anchor makes every CVE look
       * older than it was: understating age is impossible, overstating it is what happens by
       * default, and the training side (ml/enrich_scan.py) refuses the substitution outright.
       */
      t('Feature anchor date'),
      t(data.model.scanDateAnchor.used),
      t(
        data.model.scanDateAnchor.stated === null
          ? "SUBSTITUTED — the scan file states no parseable scan_date, so today's date was used. " +
            'CVE age is therefore an upper bound, not the age at scan time. Set scan_metadata.scan_date.'
          : 'stated by the scan file',
        STYLE.NOTE
      ),
    ],
    [
      t('Python/TypeScript parity'),
      t(
        data.model.parity === null
          ? 'not checked — no parity fixture shipped with the artefact'
          : data.model.parity.passed
            ? `passed on ${data.model.parity.rows} rows (tolerance ${data.model.parity.tolerance})`
            : `FAILED: ${data.model.parity.failures.join('; ')}`
      ),
    ],
    [
      t('USD→INR rate used'),
      t(data.model.usdInr === null ? 'not applicable' : String(data.model.usdInr)),
      t(
        data.model.usdInr === null
          ? 'no engine loaded'
          : data.model.usdInr === USD_INR_ASSUMPTION.rate
            ? `platform default, stated as of ${USD_INR_ASSUMPTION.asOf} — not a live rate`
            : `operator override; the platform default is ${USD_INR_ASSUMPTION.rate} as of ${USD_INR_ASSUMPTION.asOf}`,
        STYLE.NOTE
      ),
    ],
    [
      // Which comparable incidents the severity model reasons from. Two of its columns, and the
      // only two an operator can set — so a report that omitted them could not be reproduced.
      t('Comparison set'),
      t(
        data.model.org === null
          ? 'not applicable — no engine loaded'
          : `${data.model.org.sectorLabel} · ${data.model.org.employeeBand} employees`
      ),
      t(
        data.model.org === null
          ? ''
          : 'selects which VERIS incidents the severity model reasons from; a broader profile means a broader comparison set',
        STYLE.NOTE
      ),
    ],
  ];

  for (const line of status.detail) rows.push([t(''), t(line, STYLE.NOTE)]);

  /*
   * Scan completeness, as its own block rather than a footnote under Model provenance. The two
   * qualify different things: provenance says how the figures were computed, this says what they
   * were computed over. A filer who quotes the total below is answerable for both.
   *
   * The ingest never substitutes a plausible value for an unusable one, so an incomplete file
   * produces a total that is genuinely lower than the exposure — correct arithmetic that gives the
   * wrong impression unless the gap is stated in the same workbook as the number.
   */
  const q = data.dataQuality;
  rows.push([]);
  rows.push(section('Scan file completeness'));
  rows.push([
    t('Are the totals in this workbook complete?'),
    t(
      q.errorCount === 0
        ? 'yes — every figure the pipeline reads was stated and usable'
        : `NO — ${q.errorCount} stated figure${q.errorCount === 1 ? '' : 's'} could not be used. ` +
            'Nothing was substituted, so every rupee total here is a LOWER bound.'
    ),
  ]);
  rows.push([
    t('Assets carrying a stated value'),
    n(q.assetsWithStatedValue),
    t(
      q.assetsWithStatedValue === q.assetsAccepted
        ? `of ${q.assetsAccepted} — all of them`
        : `of ${q.assetsAccepted} — the other ${q.assetsAccepted - q.assetsWithStatedValue} contribute ₹0 ` +
            'to every total in this workbook',
      STYLE.NOTE
    ),
  ]);
  rows.push([
    t('Findings carrying a rupee figure'),
    n(q.findingsQuantifiable),
    t(
      q.findingsQuantifiable === q.findingsAccepted
        ? `of ${q.findingsAccepted} — all of them`
        : `of ${q.findingsAccepted} — the other ${q.findingsAccepted - q.findingsQuantifiable} are counted ` +
            'as findings but priced at ₹0',
      STYLE.NOTE
    ),
  ]);
  rows.push([
    t('Candidate controls excluded from the optimiser'),
    n(q.controlsDropped),
    t(
      q.controlsDropped === 0
        ? `none — all ${q.controlsAccepted} state a usable cost and benefit`
        : 'stated no usable cost_inr or estimated_risk_reduction_pct, so the optimiser could not price them',
      STYLE.NOTE
    ),
  ]);
  for (const issue of q.issues) {
    rows.push([
      t(issue.severity === 'error' ? 'ERROR' : 'warning'),
      t(`${issue.code}${issue.count > 1 ? ` (${issue.count})` : ''}`),
      t(
        `${issue.message} Affected: ${issue.sample.join(', ')}${
          issue.count > issue.sample.length ? `, and ${issue.count - issue.sample.length} more` : ''
        }.`,
        STYLE.NOTE
      ),
    ]);
  }

  rows.push([]);
  rows.push(section('Portfolio exposure'));
  rows.push([t('Total expected annual loss'), money(data.totalFinancialExposureInr, STYLE.INR_BOLD)]);
  // The total above is a sum over findings scored by unrelated methods. A filer who quotes it
  // needs to be able to say how much of it is a model estimate; a count of scored findings does
  // not answer that, because the exposure is not distributed evenly across them.
  for (const b of exposureByBasis(data)) {
    rows.push([t(`  of which ${b.label}`), money(b.exposureInr), t(`${b.findings} finding${b.findings === 1 ? '' : 's'} — ${b.claim}`, STYLE.NOTE)]);
  }
  rows.push([t('Organisation risk index'), n(data.overallOrgRiskScore), t('0-100, log scale on loss ratio')]);
  rows.push([t('Assets scanned'), n(data.scanMetadata.total_assets_scanned)]);
  rows.push([t('Findings'), n(data.findings.length)]);
  rows.push([t('Critical findings'), n(data.criticalFindingsCount)]);
  rows.push([t('Actively exploited (KEV)'), n(data.activelyExploitedCount)]);
  rows.push([t('Security budget available'), money(data.scanMetadata.security_budget_available_inr)]);

  if (optimization) {
    rows.push([]);
    rows.push(section('Selected mitigation portfolio'));
    rows.push([t('Controls selected'), n(optimization.selectedControls.length)]);
    rows.push([t('Cost'), money(optimization.totalCost)]);
    rows.push([
      t('Budget utilisation'),
      { v: optimization.budgetUtilizationPct / 100, s: STYLE.PERCENT },
    ]);
    rows.push([t('Projected risk index'), n(optimization.projectedRiskScore), t(`from ${optimization.currentRiskScore}`)]);
    rows.push([t('Exposure avoided per year'), money(optimization.savedExposure)]);
    rows.push([t('Average ROSI'), { v: optimization.averageROSI / 100, s: STYLE.PERCENT }]);
  }

  rows.push([]);
  rows.push(section('Framework coverage'));
  rows.push([head('Framework'), head('Controls cited'), head('Of total'), head('Weakest identifier status')]);
  for (const fw of report.frameworks) {
    rows.push([
      t(fw.name),
      n(fw.implicated),
      n(fw.total),
      t(weakest(fw.verificationCounts)),
    ]);
  }

  rows.push([]);
  rows.push(section('Identifier verification, across the controls this report cites'));
  for (const level of ['verified', 'inferred', 'assigned'] as Verification[]) {
    rows.push([t(`${level} (${citedCounts[level]})`), t(VERIFICATION_MEANING[level])]);
  }
  rows.push([t('Catalogue built'), t(report.crosswalkGeneratedAt)]);
  rows.push([t('Provenance note'), t(report.provenanceNote)]);

  rows.push([]);
  rows.push(section('Read this before totalling anything'));
  rows.push([t(''), t(NON_ADDITIVE_NOTE)]);
  rows.push([
    t(''),
    t(
      'A control marked "no evidence" means this scan says nothing about it. It does not mean the ' +
        'control is implemented, and it must not be reported as compliant on the strength of this file.'
    ),
  ]);
  if (report.unclassifiedFindingIds.length > 0) {
    rows.push([
      t('Findings implicating nothing'),
      t(`${report.unclassifiedFindingIds.length}: ${report.unclassifiedFindingIds.join(', ')}`),
    ]);
  }
  if (report.unmappedInvestmentIds.length > 0) {
    rows.push([
      t('Investments mapped to nothing'),
      t(`${report.unmappedInvestmentIds.length}: ${report.unmappedInvestmentIds.join(', ')}`),
    ]);
  }

  return { name: 'Summary', columns: [34, 58, 24, 26], rows };
}

const REGISTER_COLUMNS = [
  'Framework',
  'Control ID',
  'Identifier status',
  'Requirement',
  'Group',
  'Basis / limitation of this identifier',
  'Findings',
  'Finding IDs',
  'Vulnerability classes',
  'Peak risk index',
  'Attributed EAL (INR/yr) *',
  'Remediation state',
  'Remediation mapped from',
];

/**
 * Sheet 2. Every control in all five frameworks, not only the implicated ones — a register that
 * omitted the rest would let a reader mistake absence for compliance. The state column carries
 * the distinction, and autofilter makes narrowing to open gaps one click.
 */
function registerSheet(report: ComplianceReport): Sheet {
  const names = new Map(report.frameworks.map((f) => [f.id, f.name]));
  const ordered = [...report.controls].sort((a, b) => {
    const fa = FRAMEWORK_ORDER.indexOf(a.framework);
    const fb = FRAMEWORK_ORDER.indexOf(b.framework);
    if (fa !== fb) return fa - fb;
    if (b.exposureInr !== a.exposureInr) return b.exposureInr - a.exposureInr;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  const rows: Cell[][] = [
    [{ v: 'Control register — all five frameworks', s: STYLE.TITLE }],
    [t(`* ${NON_ADDITIVE_NOTE}`, STYLE.NOTE)],
    REGISTER_COLUMNS.map(head),
  ];

  for (const c of ordered) {
    rows.push([
      t(names.get(c.framework) ?? c.framework),
      { v: c.id, s: STYLE.MONO },
      t(c.verification),
      t(c.title),
      t(`${c.group} — ${c.groupName}`),
      t(c.basis ?? c.note ?? ''),
      n(c.findingIds.length),
      t(c.findingIds.join(', ')),
      t(c.vulnClassKeys.join(', ')),
      c.peakRiskIndex > 0 ? n(c.peakRiskIndex) : t('', STYLE.TEXT_WRAP),
      c.exposureInr > 0 ? money(c.exposureInr) : money(0),
      t(stateLabel(c.state)),
      t(c.plannedBy.join(', ')),
    ]);
  }

  return {
    name: 'Control Register',
    columns: [16, 14, 13, 46, 30, 40, 9, 26, 26, 11, 18, 20, 24],
    rows,
    freezeRow: 3,
    autoFilter: `A3:M${rows.length}`,
  };
}

const FINDING_COLUMNS = [
  'Finding ID',
  'CVE',
  'Asset ID',
  'Asset',
  'Asset type',
  'Business criticality',
  'Asset value (INR)',
  'Data sensitivity',
  'Vulnerability',
  'CVSS',
  'EPSS',
  'Actively exploited (KEV)',
  'Vulnerability class',
  'How classified',
  'Figures from',
  'Exploit probability (365d)',
  'Loss if exploited, p10 (INR)',
  'Loss if exploited, mean (INR)',
  'Loss if exploited, p90 (INR)',
  'Expected annual loss (INR)',
  'Risk index',
  'ISO/IEC 27001',
  'NIST CSF',
  'CIS Controls',
  'RBI',
  'SEBI',
];

/**
 * Sheet 3. One row per finding, with the control identifiers it implicates in five trailing
 * columns. Two different money quantities are kept apart on purpose: the loss band is what an
 * incident would cost if it happened, the expected annual loss folds in how likely that is.
 * Reporting one under the other's name is the most common way these figures get misread.
 */
function findingsSheet(data: ProcessedScanResult, doc: CrosswalkFile): Sheet {
  const rows: Cell[][] = [
    [{ v: 'Findings and the controls they implicate', s: STYLE.TITLE }],
    [
      t(
        'Blank probability and loss-band cells mean the model did not score that finding; the ' +
          '"Figures from" column says which route produced the expected annual loss instead.',
        STYLE.NOTE
      ),
    ],
    FINDING_COLUMNS.map(head),
  ];

  const ordered = [...data.findings].sort((a, b) => b.expected_loss_inr - a.expected_loss_inr);
  for (const f of ordered) {
    const score = f.model_score;
    const refs = refsFor(doc, f.vuln_class?.key ?? null);
    rows.push([
      { v: f.finding_id, s: STYLE.MONO },
      { v: f.cve_id, s: STYLE.MONO },
      { v: f.asset_id, s: STYLE.MONO },
      t(f.asset.asset_name),
      t(f.asset.asset_type),
      t(f.asset.business_criticality),
      money(f.asset.estimated_asset_value_inr),
      t(f.asset.data_sensitivity),
      t(f.vulnerability_name),
      { v: f.cvss_score, s: STYLE.DEFAULT },
      { v: f.epss_score, s: STYLE.PERCENT },
      t(f.actively_exploited ? 'yes' : 'no'),
      t(f.vuln_class?.key ?? 'unclassified'),
      t(f.vuln_class ? `${f.vuln_class.method}${f.vuln_class.matched ? `: ${f.vuln_class.matched}` : ''}` : ''),
      t(f.score_basis),
      score ? { v: score.exploitProbability, s: STYLE.PERCENT } : t(''),
      score ? money(score.lossInr.p10) : t(''),
      score ? money(score.lossInr.mean) : t(''),
      score ? money(score.lossInr.p90) : t(''),
      money(f.expected_loss_inr),
      n(f.computed_risk_score),
      t(refList(refs, 'iso27001')),
      t(refList(refs, 'nistcsf')),
      t(refList(refs, 'cis')),
      t(refList(refs, 'rbi')),
      t(refList(refs, 'sebi')),
    ]);
  }

  return {
    name: 'Findings',
    columns: [13, 17, 12, 26, 18, 16, 18, 16, 40, 8, 10, 12, 22, 24, 13, 15, 18, 18, 18, 20, 11, 26, 26, 22, 22, 22],
    rows,
    freezeRow: 3,
    autoFilter: `A3:Z${rows.length}`,
  };
}

/** Sheet 4. The plan side of the ledger: what each candidate control would satisfy if funded. */
function investmentsSheet(
  data: ProcessedScanResult,
  doc: CrosswalkFile,
  optimization: OptimizationResult | null
): Sheet {
  const selected = new Set((optimization?.selectedControls ?? []).map((c) => c.control_id));
  const rows: Cell[][] = [
    [{ v: 'Candidate investments and the requirements they would satisfy', s: STYLE.TITLE }],
    [
      t(
        'A control appearing here is a proposal, not evidence of implementation. "Selected" means ' +
          'the greedy budget optimiser chose it at the budget on the Summary sheet.',
        STYLE.NOTE
      ),
    ],
    [
      'Control ID',
      'Control name',
      'Cost (INR)',
      'Est. risk reduction',
      'Selected by optimiser',
      'Findings addressed',
      'Finding IDs',
      'Mitigation class',
      'How matched',
      'ISO/IEC 27001',
      'NIST CSF',
      'CIS Controls',
      'RBI',
      'SEBI',
    ].map(head),
  ];

  for (const inv of data.candidateInvestments) {
    const match = classifyMitigation(doc.mitigation_classes, inv.control_id, inv.control_name);
    const cls = match.key ? doc.mitigation_classes.find((m) => m.key === match.key) : undefined;
    const refs = cls?.controls ?? null;
    rows.push([
      { v: inv.control_id, s: STYLE.MONO },
      t(inv.control_name),
      money(inv.cost_inr),
      { v: inv.estimated_risk_reduction_pct / 100, s: STYLE.PERCENT },
      t(selected.has(inv.control_id) ? 'yes' : 'no'),
      n(inv.addresses_findings.length),
      t(inv.addresses_findings.join(', ')),
      t(cls ? cls.label : 'unmapped — implicates no framework control'),
      t(match.key ? `${match.method}${match.matched ? `: ${match.matched}` : ''}` : match.method),
      t(refList(refs, 'iso27001')),
      t(refList(refs, 'nistcsf')),
      t(refList(refs, 'cis')),
      t(refList(refs, 'rbi')),
      t(refList(refs, 'sebi')),
    ]);
  }

  return {
    name: 'Investments',
    columns: [14, 40, 18, 16, 16, 12, 30, 30, 22, 26, 26, 22, 22, 22],
    rows,
    freezeRow: 3,
    autoFilter: `A3:N${rows.length}`,
  };
}

/**
 * Sheet 5. The governance half of the mapping: the platform's own figures, and the reporting
 * requirement each one answers. A metric this scan cannot compute keeps its row and states why,
 * because "not measured" and "zero" are different assertions to a regulator.
 */
function metricsSheet(report: ComplianceReport): Sheet {
  const reportable = report.metrics.filter((m) => m.value !== null).length;
  const rows: Cell[][] = [
    [{ v: 'Risk metrics mapped to reporting requirements', s: STYLE.TITLE }],
    [
      t(
        `${reportable} of ${report.metrics.length} metrics are computable from this scan. The rest ` +
          'keep their row with the reason stated — an empty cell here is not a zero.',
        STYLE.NOTE
      ),
    ],
    [
      'Metric',
      'Platform field',
      'Unit',
      'Value from this scan',
      'Why not available',
      'Governance statement this supports',
      'Requirements cited',
      'ISO/IEC 27001',
      'NIST CSF',
      'CIS Controls',
      'RBI',
      'SEBI',
    ].map(head),
  ];

  for (const m of report.metrics) {
    rows.push([
      t(m.label),
      { v: m.field, s: STYLE.MONO },
      t(m.unit),
      t(m.value ?? 'not available from this scan'),
      t(m.unavailableReason ?? ''),
      t(m.statement),
      n(m.controlCount),
      t(refList(m.controls, 'iso27001')),
      t(refList(m.controls, 'nistcsf')),
      t(refList(m.controls, 'cis')),
      t(refList(m.controls, 'rbi')),
      t(refList(m.controls, 'sebi')),
    ]);
  }

  return {
    name: 'Risk Metrics',
    columns: [30, 24, 14, 40, 46, 60, 13, 26, 26, 22, 22, 22],
    rows,
    freezeRow: 3,
  };
}

/** Sheet 6. Coverage per framework, then per control group, so a gap can be located. */
function coverageSheet(report: ComplianceReport): Sheet {
  const rows: Cell[][] = [
    [{ v: 'Framework coverage', s: STYLE.TITLE }],
    [
      t(
        '"Cited" counts controls this scan produced evidence about. The remainder are not ' +
          'assessed — this file makes no claim either way about them.',
        STYLE.NOTE
      ),
    ],
    [
      'Framework',
      'Full title',
      'Authority',
      'Controls in catalogue',
      'Cited by this scan',
      'With remediation mapped',
      'Open, no remediation',
      'Share of framework in scope',
      'Share of cited with a plan',
      'verified',
      'inferred',
      'assigned',
      'Source consulted',
    ].map(head),
  ];

  for (const fw of report.frameworks) {
    rows.push([
      t(fw.name),
      t(fw.longName),
      t(fw.authority),
      n(fw.total),
      n(fw.implicated),
      n(fw.planned),
      n(fw.unplanned),
      { v: fw.inScopePct / 100, s: STYLE.PERCENT },
      { v: fw.plannedPct / 100, s: STYLE.PERCENT },
      n(fw.verificationCounts.verified ?? 0),
      n(fw.verificationCounts.inferred ?? 0),
      n(fw.verificationCounts.assigned ?? 0),
      t(fw.source),
    ]);
  }

  rows.push([]);
  rows.push([{ v: 'By control group', s: STYLE.BOLD }]);
  rows.push(['Framework', 'Group', 'Group name', 'Controls', 'Cited by this scan', 'Share cited'].map(head));
  for (const fw of report.frameworks) {
    for (const g of fw.groups) {
      rows.push([
        t(fw.name),
        { v: g.key, s: STYLE.MONO },
        t(g.name),
        n(g.total),
        n(g.implicated),
        { v: g.total > 0 ? g.implicated / g.total : 0, s: STYLE.PERCENT },
      ]);
    }
  }

  return {
    name: 'Framework Coverage',
    columns: [16, 52, 30, 20, 18, 22, 20, 24, 24, 10, 10, 10, 44],
    rows,
    freezeRow: 3,
  };
}

export function buildControlRegisterWorkbook(
  data: ProcessedScanResult,
  report: ComplianceReport,
  optimization: OptimizationResult | null,
  doc: CrosswalkFile
): Uint8Array {
  return buildXlsx(
    [
      summarySheet(data, report, optimization),
      registerSheet(report),
      findingsSheet(data, doc),
      investmentsSheet(data, doc, optimization),
      metricsSheet(report),
      coverageSheet(report),
    ],
    {
      title: `${data.scanMetadata.organization} — cyber risk control register`,
      creator: 'CyberRisk Optimizer',
      created: new Date(),
    }
  );
}

/* ============================================================================
 * PDF board report
 * ========================================================================= */

function stateInk(state: ControlStatus['state']): Rgb {
  return state === 'gap' ? INK.danger : state === 'gap_with_plan' ? INK.good : INK.muted;
}

/**
 * The provenance paragraphs. These come before the numbers, not after them, because a board
 * that reads an exposure figure first and its basis second has already anchored on the figure.
 */
function provenanceBlock(builder: PdfBuilder, data: ProcessedScanResult, report: ComplianceReport): void {
  const status = data.model.status;
  builder.heading('Basis of the figures in this report', 2);

  const rows = [
    { term: 'Model state', value: status.message, color: status.dataIsReal ? INK.body : INK.danger },
    {
      term: 'Data',
      // Three cases, not two. `dataIsReal` is false both when a fixture-built artefact is loaded
      // and when nothing is loaded at all, and saying "the loaded artefact is not built from real
      // data" in the second case describes an artefact that does not exist.
      value:
        status.state !== 'trained'
          ? 'No trained artefact is in use, so no figure below is model output. Every number comes ' +
            'from the deterministic CVSS/EPSS formula, which is transparent and reproducible but is ' +
            'not fitted to historical outcomes and yields a score rather than a probability.'
          : status.dataIsReal
            ? 'Figures derive from the trained artefact fitted on historical exploitation and loss data.'
            : 'The loaded artefact is NOT built from real data. Treat every figure below as a pipeline ' +
              'demonstration, not as a measurement of this organisation.',
      color: status.state === 'trained' && status.dataIsReal ? INK.body : INK.danger,
    },
    {
      /*
       * The input, not the model. Everything else on this page qualifies how the figures were
       * computed; this qualifies what they were computed over. It belongs on a board report for a
       * blunt reason: the ingest refuses to substitute a plausible value for an unusable one, so an
       * incomplete scan produces a total that is genuinely lower than the organisation's exposure.
       * That is the right arithmetic and the wrong impression, unless it is stated here.
       */
      term: 'Scan completeness',
      value: (() => {
        const q = data.dataQuality;
        if (q.errorCount === 0 && q.warningCount === 0) {
          return (
            `Every field the pipeline reads was present and usable: ${q.assetsAccepted} assets all ` +
            `carrying a stated value, ${q.findingsAccepted} findings all quantifiable, ` +
            `${q.controlsAccepted} candidate controls all costed. No figure below is a substitute.`
          );
        }
        const parts: string[] = [];
        if (q.errorCount > 0) {
          parts.push(
            `${q.errorCount} stated figure${q.errorCount === 1 ? '' : 's'} in the scan file could ` +
              'not be used. Nothing was substituted for them, so every rupee total in this report is ' +
              'a LOWER bound on the true exposure, not an estimate of it'
          );
          const unpriced = q.assetsAccepted - q.assetsWithStatedValue;
          if (unpriced > 0) {
            parts.push(
              `${unpriced} of ${q.assetsAccepted} assets state no usable value and therefore ` +
                'contribute nothing to the totals'
            );
          }
          const unquantified = q.findingsAccepted - q.findingsQuantifiable;
          if (unquantified > 0) {
            parts.push(
              `${unquantified} of ${q.findingsAccepted} findings carry no rupee figure for the same reason`
            );
          }
          if (q.controlsDropped > 0) {
            parts.push(
              `${q.controlsDropped} candidate control${q.controlsDropped === 1 ? ' was' : 's were'} ` +
                'excluded from the optimiser for stating no usable cost or benefit'
            );
          }
        }
        if (q.warningCount > 0) {
          parts.push(
            `${q.warningCount} descriptive field${q.warningCount === 1 ? ' was' : 's were'} missing ` +
              'or unrecognised and have been defaulted, which does not change any total'
          );
        }
        return parts.join('. ') + '. The itemised list closes this report.';
      })(),
      color: data.dataQuality.errorCount > 0 ? INK.danger : INK.body,
    },
    {
      term: 'Coverage',
      // Same correction as the register's Summary row: `scored` includes findings whose probability
      // was observed in CISA KEV rather than predicted, so stating it as model coverage credits the
      // model with findings it was never asked about.
      value:
        `${data.model.byBasis.model.findings} of ${data.model.total} findings had an exploitation probability ` +
        `predicted by the model. A further ${data.model.byBasis.observed_kev.findings} are listed in CISA KEV and ` +
        'carry probability 1 by observation, with only the loss figure modelled. The remaining ' +
        `${data.model.byBasis.heuristic.findings} use the deterministic fallback, which yields a score rather ` +
        'than a calibrated probability.',
    },
    {
      // Coverage in findings and coverage in money are different numbers, and the second is the one
      // that qualifies the exposure figure this report leads with. A board told "3 of 18 findings
      // were model-scored" will assume the total is mostly formula output; if those three sit on the
      // highest-value assets the opposite can be true.
      term: 'Exposure by method',
      value:
        exposureByBasis(data)
          .map(
            (b) =>
              `${pdfCurrency(b.exposureInr)} ${b.label} (${b.findings} finding${
                b.findings === 1 ? '' : 's'
              }, ${b.claim})`
          )
          .join('; ') +
        `. These sum to the ${pdfCurrency(data.totalFinancialExposureInr)} total below; compare ` +
        'findings within a method, not across them.',
      color: data.model.byBasis.heuristic.findings > 0 ? INK.danger : INK.body,
    },
    {
      // Upstream of coverage, and the usual explanation for it. A regulator reading a low
      // model-scored count deserves to know whether the model was unhelpful or simply never
      // asked, and the answer is almost always that the scan carried no CVSS vectors.
      term: 'Scan enrichment',
      value: (() => {
        const e = data.model.enrichment;
        if (!e) {
          return (
            'The scan file states no enrichment source. A finding needs a CVSS v3 vector to reach the ' +
            'exploitation model — 24 of its 66 inputs are the vector\'s own fields and none can be ' +
            'recovered from the base score — so findings without one use the deterministic fallback.'
          );
        }
        const parts = [e.source || 'source not stated'];
        if (typeof e.nvd_records_matched === 'number') {
          parts.push(`${e.nvd_records_matched} findings matched an NVD record`);
        }
        if (e.epss_snapshot) parts.push(`EPSS as of ${e.epss_snapshot}`);
        if (e.generated_at) parts.push(`written ${e.generated_at}`);
        return parts.join('. ') + '.';
      })(),
      color: data.model.enrichment ? INK.body : INK.danger,
    },
    {
      /*
       * Alongside enrichment, because both answer "what were these features built from". A missing
       * scan date is not cosmetic: it moves `age_days_log` for every finding, and it moves it in one
       * direction only — today is later than the scan, so the CVEs look older than they were.
       */
      term: 'Feature anchor',
      value:
        data.model.scanDateAnchor.stated === null
          ? `The scan file states no parseable scan_date, so features were anchored on ` +
            `${data.model.scanDateAnchor.used} — today, substituted. Two features read this date: how long ` +
            'each CVE had been public, and the incident year the severity model compares against. ' +
            'Today is later than any scan, so CVE age here is an upper bound rather than the age at ' +
            'scan time. Set scan_metadata.scan_date to remove the substitution.'
          : `Features were anchored on ${data.model.scanDateAnchor.used}, the date the scan file states. ` +
            'CVE age and the severity model\'s incident year are both measured from it, so no ' +
            'post-scan information enters the figures above.',
      color: data.model.scanDateAnchor.stated === null ? INK.danger : INK.body,
    },
    {
      term: 'Comparison set',
      value:
        data.model.org === null
          ? 'No engine is loaded, so no comparison set applies.'
          : `${data.model.org.sectorLabel}, ${data.model.org.employeeBand} employees. ` +
            'Sector and headcount select which comparable incidents the severity model reasons ' +
            'from, so they are part of every loss figure above. ' +
            (data.model.org.naics2 === '' || data.model.org.employeeBand === 'Unknown'
              ? 'At least one is unstated, which is a real training category rather than a missing ' +
                'value — but it makes the comparison set the broadest available, and a stated ' +
                'profile would give a narrower and more defensible one.'
              : 'Both are stated, so the comparison set is narrower than the platform default.'),
      color:
        data.model.org && (data.model.org.naics2 === '' || data.model.org.employeeBand === 'Unknown')
          ? INK.muted
          : INK.body,
    },
    {
      term: 'Exchange rate',
      value:
        data.model.usdInr === null
          ? 'No engine is loaded.'
          : `USD/INR ${data.model.usdInr}. ` +
            (data.model.usdInr === USD_INR_ASSUMPTION.rate
              ? `Platform default, stated as of ${USD_INR_ASSUMPTION.asOf}. ${USD_INR_ASSUMPTION.note}`
              : `Operator override; the platform default is ${USD_INR_ASSUMPTION.rate} as of ` +
                `${USD_INR_ASSUMPTION.asOf}. Every rupee figure derived from the severity model ` +
                'scales linearly with this number.'),
    },
    {
      term: 'Artefact built',
      value: status.generatedAt ?? 'No model artefact is loaded; all figures are from the deterministic fallback.',
    },
    {
      term: 'Parity check',
      value:
        data.model.parity === null
          ? 'Not run — the artefact shipped no parity fixture, so browser-side scoring has not been ' +
            'confirmed against the Python training code.'
          : data.model.parity.passed
            ? `Browser scoring matches the Python training code on ${data.model.parity.rows} reference rows ` +
              `within ${data.model.parity.tolerance}.`
            : `FAILED — ${data.model.parity.failures.join('; ')}`,
      color: data.model.parity && !data.model.parity.passed ? INK.danger : INK.body,
    },
    { term: 'Framework catalogue', value: `Built ${report.crosswalkGeneratedAt}. Identifier verification is defined on the closing page.` },
  ];
  builder.definitions(rows, 118);

  if (status.detail.length > 0) {
    builder.spacer(4);
    for (const line of status.detail) {
      builder.paragraph(`- ${line}`, { size: 8.2, color: INK.muted, indent: 6 });
    }
  }
}

function coverageTable(builder: PdfBuilder, report: ComplianceReport): void {
  builder.heading('Coverage of the five frameworks', 2);
  builder.paragraph(
    'Cited controls are those this scan produced evidence about. The rest are not assessed; this ' +
      'report makes no claim that they are implemented.',
    { size: 8.6, color: INK.muted }
  );
  builder.spacer(4);
  const rows: TableRow[] = report.frameworks.map((fw) => ({
    cells: [
      fw.name,
      fw.authority,
      `${fw.implicated} / ${fw.total}`,
      `${fw.inScopePct}%`,
      `${fw.planned}`,
      `${fw.unplanned}`,
      weakest(fw.verificationCounts),
    ],
    color: (fw.verificationCounts.assigned ?? 0) > 0 ? INK.warn : INK.body,
  }));
  builder.table(
    [
      { header: 'Framework', width: 15 },
      { header: 'Authority', width: 21 },
      { header: 'Cited', width: 11, align: 'right' },
      { header: 'In scope', width: 10, align: 'right' },
      { header: 'Planned', width: 10, align: 'right' },
      { header: 'Open', width: 9, align: 'right' },
      { header: 'Weakest ID status', width: 16 },
    ],
    rows
  );
}

/** The controls carrying the most attributed exposure, worst first, across all frameworks. */
function gapTable(builder: PdfBuilder, report: ComplianceReport, limit = 14): void {
  const names = new Map(report.frameworks.map((f) => [f.id, f.name]));
  const worst = report.controls
    .filter((c) => c.state !== 'not_implicated')
    .sort((a, b) => b.exposureInr - a.exposureInr || b.peakRiskIndex - a.peakRiskIndex)
    .slice(0, limit);

  builder.heading('Where the exposure sits', 2);
  builder.paragraph(
    'The requirements with the most expected annual loss behind them. Attributed exposure is not ' +
      'additive down this column: one finding is evidence against several controls, so the same ' +
      'rupee appears on every row it implicates. The portfolio total is on the first page.',
    { size: 8.6, color: INK.muted }
  );
  builder.spacer(4);
  builder.table(
    [
      { header: 'Framework', width: 13 },
      { header: 'Control', width: 11 },
      { header: 'Requirement', width: 34 },
      { header: 'Findings', width: 9, align: 'right' },
      { header: 'Attributed EAL', width: 16, align: 'right' },
      { header: 'Remediation', width: 17 },
    ],
    worst.map((c) => ({
      cells: [
        names.get(c.framework) ?? c.framework,
        `${c.id}${c.verification === 'verified' ? '' : ` (${c.verification})`}`,
        c.title,
        String(c.findingIds.length),
        pdfCurrency(c.exposureInr),
        c.state === 'gap_with_plan' ? c.plannedBy.join(', ') || 'mapped' : 'none mapped',
      ],
      color: stateInk(c.state),
    }))
  );
}

/** The largest single findings — the board question "what is the worst one thing" answered. */
function findingTable(builder: PdfBuilder, findings: EnrichedFinding[], limit = 10): void {
  const worst = [...findings].sort((a, b) => b.expected_loss_inr - a.expected_loss_inr).slice(0, limit);
  builder.heading('Largest single exposures', 2);
  builder.table(
    [
      { header: 'CVE', width: 14 },
      { header: 'Asset', width: 22 },
      { header: 'Criticality', width: 12 },
      { header: 'CVSS', width: 7, align: 'right' },
      { header: 'KEV', width: 6 },
      { header: 'Figures from', width: 12 },
      { header: 'Expected annual loss', width: 17, align: 'right' },
    ],
    worst.map((f) => ({
      cells: [
        f.cve_id,
        f.asset.asset_name,
        f.asset.business_criticality,
        f.cvss_score.toFixed(1),
        f.actively_exploited ? 'yes' : 'no',
        f.score_basis,
        pdfCurrency(f.expected_loss_inr),
      ],
      color: f.actively_exploited ? INK.danger : INK.body,
    }))
  );
}

function metricTable(builder: PdfBuilder, report: ComplianceReport): void {
  const reportable = report.metrics.filter((m) => m.value !== null).length;
  builder.heading('Risk metrics against reporting requirements', 2);
  builder.paragraph(
    `${reportable} of ${report.metrics.length} metrics are computable from this scan. A metric shown ` +
      'as unavailable has not been measured; it is not a zero, and must not be reported as one.',
    { size: 8.6, color: INK.muted }
  );
  builder.spacer(4);
  builder.table(
    [
      { header: 'Metric', width: 20 },
      { header: 'This scan', width: 30 },
      { header: 'Requirements cited', width: 12, align: 'right' },
      { header: 'Governance statement', width: 38 },
    ],
    report.metrics.map((m) => ({
      cells: [
        m.label,
        m.value ?? `not available - ${m.unavailableReason ?? 'no reason recorded'}`,
        String(m.controlCount),
        m.statement,
      ],
      color: m.value === null ? INK.warn : INK.body,
    }))
  );
}

/** What the budget buys. Omitted entirely when no portfolio has been optimised. */
function investmentBlock(
  builder: PdfBuilder,
  data: ProcessedScanResult,
  optimization: OptimizationResult,
  doc: CrosswalkFile
): void {
  builder.heading('Recommended portfolio at the stated budget', 2);
  builder.definitions(
    [
      {
        term: 'Budget',
        value: `${pdfCurrency(data.scanMetadata.security_budget_available_inr)}, of which ` +
          `${pdfCurrency(optimization.totalCost)} is allocated (${optimization.budgetUtilizationPct}%).`,
      },
      {
        term: 'Risk index',
        value: `${optimization.currentRiskScore} today, ${optimization.projectedRiskScore} after this portfolio.`,
      },
      {
        term: 'Exposure',
        value: `${pdfCurrency(optimization.currentExposure)} per year today, ` +
          `${pdfCurrency(optimization.projectedExposure)} after. Avoided: ` +
          `${pdfCurrency(optimization.savedExposure)} per year.`,
        color: INK.good,
      },
      {
        term: 'Return on security spend',
        value: `${optimization.averageROSI}% average, computed as avoided annual loss over cost.`,
      },
      {
        term: 'Selection rule',
        value: 'Greedy by risk reduction per rupee, then compounded with diminishing returns. This is ' +
          'a ranking heuristic, not a proof of optimality.',
        color: INK.muted,
      },
    ],
    118
  );
  builder.spacer(6);
  builder.table(
    [
      { header: 'Control', width: 11 },
      { header: 'Investment', width: 30 },
      { header: 'Cost', width: 14, align: 'right' },
      { header: 'Reduction', width: 10, align: 'right' },
      { header: 'Requirements it would satisfy', width: 35 },
    ],
    optimization.selectedControls.map((inv) => {
      const match = classifyMitigation(doc.mitigation_classes, inv.control_id, inv.control_name);
      const cls = match.key ? doc.mitigation_classes.find((m) => m.key === match.key) : undefined;
      const cited = cls
        ? FRAMEWORK_ORDER.flatMap((id) => (cls.controls[id] ?? []).slice(0, 2)).join(', ')
        : 'no framework mapping';
      return {
        cells: [
          inv.control_id,
          inv.control_name,
          pdfCurrency(inv.cost_inr),
          `${inv.estimated_risk_reduction_pct}%`,
          cited,
        ],
      };
    })
  );
}

/** The closing page. Everything a reader needs in order not to over-read the rest. */
function caveatPage(builder: PdfBuilder, data: ProcessedScanResult, report: ComplianceReport): void {
  builder.pageBreak();
  builder.heading('How to read this report', 1);
  builder.spacer(6);

  builder.heading('Identifier verification', 3);
  const cited: Record<Verification, number> = { verified: 0, inferred: 0, assigned: 0 };
  for (const c of report.controls) if (c.state !== 'not_implicated') cited[c.verification] += 1;
  builder.definitions(
    (['verified', 'inferred', 'assigned'] as Verification[]).map((level) => ({
      term: `${level} (${cited[level]} cited)`,
      value: VERIFICATION_MEANING[level],
      color: level === 'verified' ? INK.good : level === 'inferred' ? INK.warn : INK.danger,
    })),
    118
  );
  builder.spacer(4);
  builder.paragraph(report.provenanceNote, { size: 8.4, color: INK.muted });

  builder.heading('Attributed exposure is not additive', 3);
  builder.paragraph(NON_ADDITIVE_NOTE, { size: 9 });
  builder.paragraph(
    `The portfolio total for this scan is ${pdfCurrency(data.totalFinancialExposureInr)} per year. Any ` +
      'larger figure obtained by summing a control column is double-counting.',
    { size: 9, bold: true }
  );

  builder.heading('What silence means', 3);
  builder.paragraph(
    'A control this report does not cite is one the scan produced no evidence about. That is not a ' +
      'statement that the control is implemented, and it cannot be used as one. Framework coverage ' +
      'figures describe how much of each framework this scan can speak to, not a compliance score.',
    { size: 9 }
  );

  builder.heading('Known gaps in this run', 3);
  builder.definitions(
    [
      {
        term: 'Unclassified findings',
        value:
          report.unclassifiedFindingIds.length === 0
            ? 'None. Every finding resolved to a vulnerability class and implicates at least one control.'
            : `${report.unclassifiedFindingIds.length} finding(s) matched no vulnerability class and therefore ` +
              `implicate nothing: ${report.unclassifiedFindingIds.join(', ')}.`,
        color: report.unclassifiedFindingIds.length === 0 ? INK.good : INK.warn,
      },
      {
        term: 'Unmapped investments',
        value:
          report.unmappedInvestmentIds.length === 0
            ? 'None. Every candidate investment maps to at least one framework requirement.'
            : `${report.unmappedInvestmentIds.length} investment(s) matched no mitigation class: ` +
              `${report.unmappedInvestmentIds.join(', ')}.`,
        color: report.unmappedInvestmentIds.length === 0 ? INK.good : INK.warn,
      },
    ],
    118
  );

  builder.heading('Sources consulted', 3);
  builder.definitions(
    report.frameworks.map((fw) => ({
      term: fw.name,
      // The catalogue's source strings usually open with the authority's own name, so prefixing
      // it again produces "Reserve Bank of India. Reserve Bank of India, 'Cyber Security...'".
      value: fw.source.startsWith(fw.authority) ? fw.source : `${fw.authority}. ${fw.source}`,
    })),
    118
  );

  /*
   * The itemised scan-file problems the 'Scan completeness' row on page 1 promised. Last, because a
   * reader who needs the detail comes looking for it and a reader who does not should not have the
   * headline pushed down the page — but present in full, because "the file had 6 problems" without
   * the list is unactionable, and whoever exported the scan is the one who has to fix it.
   */
  if (data.dataQuality.issues.length > 0) {
    builder.heading('Problems found in the scan file', 3);
    builder.paragraph(
      data.dataQuality.errorCount > 0
        ? 'Items marked ERROR mean a stated figure could not be used. No value was substituted for ' +
            'it, so the rupee totals in this report are a lower bound. Items marked WARNING mean a ' +
            'descriptive field was defaulted and no total is affected.'
        : 'No stated figure was lost. Each item below is a descriptive field that was missing or ' +
            'unrecognised and has been defaulted; the rupee totals are unaffected.',
      { size: 8.6, color: INK.muted }
    );
    builder.spacer(3);
    builder.definitions(
      data.dataQuality.issues.map((issue) => ({
        term: `${issue.severity.toUpperCase()} — ${issue.code}${issue.count > 1 ? ` (${issue.count})` : ''}`,
        value: `${issue.message} Affected: ${issue.sample.join(', ')}${
          issue.count > issue.sample.length ? `, and ${issue.count - issue.sample.length} more` : ''
        }.`,
        color: issue.severity === 'error' ? INK.danger : INK.warn,
      })),
      132
    );
  }
}

export function buildBoardReportPdf(
  data: ProcessedScanResult,
  report: ComplianceReport,
  optimization: OptimizationResult | null,
  doc: CrosswalkFile
): Uint8Array {
  const created = new Date();
  const builder = new PdfBuilder({
    title: `${data.scanMetadata.organization} — cyber risk and framework compliance`,
    author: 'CyberRisk Optimizer',
    subject:
      'Quantified cyber risk mapped to ISO/IEC 27001, NIST CSF, CIS Controls, the RBI Cyber Security ' +
      'Framework and the SEBI CSCRF',
    created,
    footer: `${data.scanMetadata.organization} - scan ${data.scanMetadata.scan_date} - not a compliance certification`,
  });

  builder.heading('Cyber Risk and Framework Compliance', 1);
  builder.paragraph(
    `${data.scanMetadata.organization} · scan of ${data.scanMetadata.scan_date} · ` +
      `${data.scanMetadata.total_assets_scanned} assets · ${data.findings.length} findings`,
    { size: 9.5, color: INK.muted }
  );
  builder.spacer(8);

  const citedTotal = report.controls.filter((c) => c.state !== 'not_implicated').length;
  builder.metricStrip([
    {
      label: 'Expected annual loss',
      value: pdfCurrency(data.totalFinancialExposureInr),
      color: INK.danger,
    },
    { label: 'Risk index (0-100)', value: `${data.overallOrgRiskScore}`, color: INK.accent },
    { label: 'Critical / KEV findings', value: `${data.criticalFindingsCount} / ${data.activelyExploitedCount}` },
    { label: 'Requirements cited', value: `${citedTotal}` },
  ]);

  provenanceBlock(builder, data, report);
  coverageTable(builder, report);
  gapTable(builder, report);
  findingTable(builder, data.findings);
  metricTable(builder, report);
  if (optimization && optimization.selectedControls.length > 0) {
    investmentBlock(builder, data, optimization, doc);
  }
  caveatPage(builder, data, report);

  return builder.build();
}

/* ============================================================================
 * Download plumbing
 * ========================================================================= */

/** Filesystem-safe slug for the organisation name in a filename. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'organisation';
}

export function registerFilename(data: ProcessedScanResult): string {
  return `${slug(data.scanMetadata.organization)}-control-register-${data.scanMetadata.scan_date}.xlsx`;
}

export function boardReportFilename(data: ProcessedScanResult): string {
  return `${slug(data.scanMetadata.organization)}-board-risk-report-${data.scanMetadata.scan_date}.pdf`;
}

/**
 * Hand bytes to the browser as a download. The object URL is revoked on the next tick rather
 * than immediately: Safari has historically cancelled the download if the URL dies in the same
 * frame as the click.
 */
export function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const url = URL.createObjectURL(new Blob([copy], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const PDF_MIME = 'application/pdf';

/** Both deliverables, composed and offered for download. Returns their byte sizes for the UI. */
export function exportRegulatoryPack(
  data: ProcessedScanResult,
  report: ComplianceReport,
  optimization: OptimizationResult | null
): { xlsxBytes: number; pdfBytes: number } {
  const doc = data.crosswalk;
  if (!doc) throw new Error('the framework catalogue is not loaded, so no mapped export can be produced');
  const workbook = buildControlRegisterWorkbook(data, report, optimization, doc);
  const pdf = buildBoardReportPdf(data, report, optimization, doc);
  downloadBytes(workbook, registerFilename(data), XLSX_MIME);
  downloadBytes(pdf, boardReportFilename(data), PDF_MIME);
  return { xlsxBytes: workbook.byteLength, pdfBytes: pdf.byteLength };
}
