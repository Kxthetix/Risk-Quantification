/**
 * Turns a processed scan into control-level statements about five frameworks.
 *
 * Three mappings run in opposite directions and are kept separate because they support
 * different claims:
 *
 *   findings   -> controls   Evidence of a WEAKNESS. A live RCE finding is evidence against
 *                            ISO A.8.8, CIS 7.1 and the rest of its class's control set.
 *   investments-> controls   Evidence of a PLAN. A candidate control maps to the framework
 *                            requirements it would satisfy if funded.
 *   metrics    -> controls   Evidence of GOVERNANCE. The platform's own figures — expected
 *                            annual loss, exploitation probability, ROI — are the artefacts a
 *                            regulator asks for under specific reporting requirements.
 *
 * Two properties of the output are load-bearing and stated wherever it is rendered.
 * Attributed exposure is NOT additive across controls: one finding implicates several
 * controls, so the same rupee is counted under each, and summing a column would inflate the
 * total. And every control carries its `verification` status forward — an RBI or SEBI
 * identifier this project assigned is not a citation of the circular, and a report that
 * printed it as one would be misrepresenting the source.
 */
import type {
  ControlEntry,
  ControlRefs,
  CrosswalkFile,
  FrameworkId,
  MitigationClass,
  RiskMetricMapping,
  Verification,
  VulnClass,
} from './crosswalk';
import { FRAMEWORK_ORDER, classifyMitigation } from './crosswalk';

export type ControlState = 'gap' | 'gap_with_plan' | 'not_implicated';

export interface ControlStatus {
  framework: FrameworkId;
  id: string;
  title: string;
  group: string;
  groupName: string;
  verification: Verification;
  basis?: string;
  note?: string;
  /** Findings whose vulnerability class maps to this control. */
  findingIds: string[];
  /** Vulnerability class keys that produced those findings, for the "why" column. */
  vulnClassKeys: string[];
  /** Worst risk index among the implicating findings. 0 when none. */
  peakRiskIndex: number;
  /** Expected annual loss of the implicating findings (₹). Not additive across controls. */
  exposureInr: number;
  /** Candidate investment control ids that map to this framework control. */
  plannedBy: string[];
  state: ControlState;
}

export interface FrameworkSummary {
  id: FrameworkId;
  name: string;
  longName: string;
  authority: string;
  source: string;
  total: number;
  implicated: number;
  planned: number;
  /** Implicated controls with no candidate investment mapped to them. */
  unplanned: number;
  /** Share of the framework this scan says anything about at all. */
  inScopePct: number;
  /** Share of implicated controls that have a funded-or-proposed remediation. */
  plannedPct: number;
  verificationCounts: Partial<Record<Verification, number>>;
  groups: { key: string; name: string; total: number; implicated: number }[];
}

export interface MetricStatement {
  key: string;
  label: string;
  field: string;
  unit: string;
  statement: string;
  /** Formatted value from this scan, or null when the platform cannot compute it. */
  value: string | null;
  /** Present when value is null: why not. */
  unavailableReason?: string;
  controls: ControlRefs;
  controlCount: number;
}

export interface ComplianceReport {
  generatedAt: string;
  crosswalkGeneratedAt: string;
  frameworks: FrameworkSummary[];
  controls: ControlStatus[];
  metrics: MetricStatement[];
  /** Findings that could not be classified, so they implicate nothing. Reported, not hidden. */
  unclassifiedFindingIds: string[];
  /** Candidate investments that matched no mitigation class. */
  unmappedInvestmentIds: string[];
  provenanceNote: string;
}

/** Inputs the report needs, kept minimal so this module does not import the UI's types. */
export interface ComplianceFinding {
  finding_id: string;
  vulnClassKey: string | null;
  riskIndex: number;
  expectedLossInr: number;
}

export interface ComplianceInvestment {
  control_id: string;
  control_name: string;
}

export interface ComplianceMetricInputs {
  totalExpectedLossInr: number;
  /**
   * Mean calibrated probability over findings the exploitation model actually predicted. Findings
   * already in the KEV catalogue are deliberately excluded: their probability is 1 by observation,
   * and averaging an observation into a figure a regulator will read as model output would let a
   * scan of entirely known-exploited CVEs report "100.0% mean" without a single prediction having
   * run. Their count travels separately in `exploitProbabilityCounts`.
   */
  meanExploitProbability: number | null;
  /** How the probability figure was composed, so the statement can say what it covers. */
  exploitProbabilityCounts?: { modelPredicted: number; observedInKev: number; total: number };
  residualRiskIndex: number | null;
  criticalFindings: number;
  activelyExploitedCount: number;
  roiPct: number | null;
  criticalityProfile: Record<string, number>;
  /** Set when the figures came from the deterministic fallback rather than the model. */
  probabilityUnavailableReason?: string;
}

function emptyRefs(): ControlRefs {
  return { iso27001: [], nistcsf: [], cis: [], rbi: [], sebi: [] };
}

function countRefs(refs: ControlRefs | undefined): number {
  if (!refs) return 0;
  return FRAMEWORK_ORDER.reduce((sum, id) => sum + (refs[id]?.length ?? 0), 0);
}

/** ₹ in the Indian numbering system, for figures that go into a filing. */
function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Attach this scan's figures to the metrics the crosswalk says each framework wants reported.
 *
 * A metric the platform cannot compute returns `value: null` with a reason rather than a zero.
 * The distinction matters in a regulatory context: "no findings are actively exploited" and
 * "we did not measure active exploitation" are different statements, and only one of them is
 * a control assertion.
 */
export function buildMetricStatements(
  mappings: RiskMetricMapping[],
  inputs: ComplianceMetricInputs,
  frameworks: FrameworkSummary[]
): MetricStatement[] {
  const totalImplicated = frameworks.reduce((s, f) => s + f.implicated, 0);
  const totalPlanned = frameworks.reduce((s, f) => s + f.planned, 0);

  const resolve = (field: string): { value: string | null; reason?: string } => {
    switch (field) {
      case 'totalExpectedLossINR':
        return { value: `${formatInr(inputs.totalExpectedLossInr)} per year` };
      case 'exploitProbability': {
        const counts = inputs.exploitProbabilityCounts;
        if (inputs.meanExploitProbability === null) {
          return {
            value: null,
            reason:
              inputs.probabilityUnavailableReason ??
              'No calibrated exploitation probability is available; the deterministic formula produces a score, not a probability.',
          };
        }
        const covered =
          counts === undefined
            ? ''
            : ` over ${counts.modelPredicted} of ${counts.total} findings`;
        // Stated rather than folded in: KEV membership is a stronger claim than a prediction, so
        // it belongs beside the figure, not inside it.
        const observed =
          counts && counts.observedInKev > 0
            ? `. A further ${counts.observedInKev} ${counts.observedInKev === 1 ? 'finding is' : 'findings are'} listed in CISA KEV and carry probability 1 by observation, not by prediction`
            : '';
        return {
          value: `${(inputs.meanExploitProbability * 100).toFixed(1)}% mean${covered}, 365-day horizon${observed}`,
        };
      }
      case 'residualRiskScore':
        return inputs.residualRiskIndex === null
          ? { value: null, reason: 'No mitigation portfolio has been selected yet, so residual risk is undefined.' }
          : { value: `${inputs.residualRiskIndex}/100 after the selected portfolio` };
      case 'controlCoveragePct':
        return totalImplicated === 0
          ? { value: null, reason: 'No framework control is implicated by this scan, so coverage has no denominator.' }
          : {
              value: `${pct(totalPlanned, totalImplicated)}% of ${totalImplicated} implicated controls have a mapped remediation`,
            };
      case 'criticalFindings':
        return { value: `${inputs.criticalFindings}` };
      case 'activelyExploitedCount':
        return { value: `${inputs.activelyExploitedCount}` };
      case 'roiPct':
        return inputs.roiPct === null
          ? { value: null, reason: 'ROI requires a selected investment portfolio; none has been optimised yet.' }
          : { value: `${inputs.roiPct}%` };
      case 'assetCriticalityProfile': {
        const entries = Object.entries(inputs.criticalityProfile).filter(([, v]) => v > 0);
        return entries.length === 0
          ? { value: null, reason: 'No assets carry a business-criticality label in this scan.' }
          : { value: entries.map(([k, v]) => `${k}: ${formatInr(v)}`).join(' · ') };
      }
      default:
        return { value: null, reason: `The platform has no figure wired to "${field}".` };
    }
  };

  return mappings.map((mapping) => {
    const resolved = resolve(mapping.field);
    return {
      key: mapping.key,
      label: mapping.label,
      field: mapping.field,
      unit: mapping.unit,
      statement: mapping.statement,
      value: resolved.value,
      unavailableReason: resolved.reason,
      controls: mapping.controls ?? emptyRefs(),
      controlCount: countRefs(mapping.controls),
    };
  });
}

/** Controls a framework says are in scope, worst first — the order a remediation plan wants. */
export function rankControlGaps(report: ComplianceReport, framework?: FrameworkId): ControlStatus[] {
  return report.controls
    .filter((c) => c.state !== 'not_implicated' && (!framework || c.framework === framework))
    .sort((a, b) => b.exposureInr - a.exposureInr || b.peakRiskIndex - a.peakRiskIndex);
}

/** Verification tally across the controls this report actually cites. */
export function citedVerificationCounts(report: ComplianceReport): Record<Verification, number> {
  const counts: Record<Verification, number> = { verified: 0, inferred: 0, assigned: 0 };
  for (const control of report.controls) {
    if (control.state !== 'not_implicated') counts[control.verification] += 1;
  }
  return counts;
}

function classByKey(classes: VulnClass[]): Map<string, VulnClass> {
  return new Map(classes.map((c) => [c.key, c]));
}

/** Percentage helper that returns 0 rather than NaN for an empty denominator. */
function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

export function buildComplianceReport(
  doc: CrosswalkFile,
  findings: ComplianceFinding[],
  investments: ComplianceInvestment[],
  metrics: ComplianceMetricInputs
): ComplianceReport {
  const vulnIndex = classByKey(doc.vulnerability_classes);

  // --- findings -> controls -------------------------------------------------
  // Keyed `${framework} ${controlId}` so a CIS "4.8" and an RBI "4.8" can never collide.
  const implicated = new Map<string, { findingIds: string[]; classes: Set<string>; peak: number; exposure: number }>();
  const unclassified: string[] = [];

  for (const finding of findings) {
    const cls = finding.vulnClassKey ? vulnIndex.get(finding.vulnClassKey) : undefined;
    if (!cls) {
      unclassified.push(finding.finding_id);
      continue;
    }
    for (const framework of FRAMEWORK_ORDER) {
      for (const controlId of cls.controls[framework] ?? []) {
        const key = `${framework} ${controlId}`;
        let bucket = implicated.get(key);
        if (!bucket) {
          bucket = { findingIds: [], classes: new Set(), peak: 0, exposure: 0 };
          implicated.set(key, bucket);
        }
        bucket.findingIds.push(finding.finding_id);
        bucket.classes.add(cls.key);
        bucket.peak = Math.max(bucket.peak, finding.riskIndex);
        bucket.exposure += finding.expectedLossInr;
      }
    }
  }

  // --- investments -> controls ---------------------------------------------
  const planned = new Map<string, string[]>();
  const unmappedInvestments: string[] = [];
  for (const investment of investments) {
    const match = classifyMitigation(doc.mitigation_classes, investment.control_id, investment.control_name);
    const cls = match.key
      ? doc.mitigation_classes.find((m: MitigationClass) => m.key === match.key)
      : undefined;
    if (!cls) {
      unmappedInvestments.push(investment.control_id);
      continue;
    }
    for (const framework of FRAMEWORK_ORDER) {
      for (const controlId of cls.controls[framework] ?? []) {
        const key = `${framework} ${controlId}`;
        const list = planned.get(key) ?? [];
        if (!list.includes(investment.control_id)) list.push(investment.control_id);
        planned.set(key, list);
      }
    }
  }

  // --- assemble one row per control in all five frameworks ------------------
  const controls: ControlStatus[] = [];
  const summaries: FrameworkSummary[] = [];

  for (const framework of FRAMEWORK_ORDER) {
    const fw = doc.frameworks[framework];
    const groupCounts = new Map<string, { total: number; implicated: number }>();
    let implicatedCount = 0;
    let plannedCount = 0;
    const verificationCounts: Partial<Record<Verification, number>> = {};

    for (const [controlId, entry] of Object.entries(fw.controls) as [string, ControlEntry][]) {
      const key = `${framework} ${controlId}`;
      const bucket = implicated.get(key);
      const plans = planned.get(key) ?? [];
      const isImplicated = Boolean(bucket && bucket.findingIds.length > 0);

      const group = groupCounts.get(entry.group) ?? { total: 0, implicated: 0 };
      group.total += 1;
      if (isImplicated) group.implicated += 1;
      groupCounts.set(entry.group, group);

      if (isImplicated) {
        implicatedCount += 1;
        if (plans.length > 0) plannedCount += 1;
        verificationCounts[entry.verification] = (verificationCounts[entry.verification] ?? 0) + 1;
      }

      controls.push({
        framework,
        id: controlId,
        title: entry.title,
        group: entry.group,
        groupName: entry.group_name,
        verification: entry.verification,
        basis: entry.basis,
        note: entry.note,
        findingIds: bucket ? Array.from(new Set(bucket.findingIds)) : [],
        vulnClassKeys: bucket ? Array.from(bucket.classes) : [],
        peakRiskIndex: bucket ? bucket.peak : 0,
        exposureInr: bucket ? Math.round(bucket.exposure) : 0,
        plannedBy: plans,
        state: isImplicated ? (plans.length > 0 ? 'gap_with_plan' : 'gap') : 'not_implicated',
      });
    }

    const total = Object.keys(fw.controls).length;
    summaries.push({
      id: framework,
      name: fw.name,
      longName: fw.long_name,
      authority: fw.authority,
      source: doc.meta.sources[framework],
      total,
      implicated: implicatedCount,
      planned: plannedCount,
      unplanned: implicatedCount - plannedCount,
      inScopePct: pct(implicatedCount, total),
      plannedPct: pct(plannedCount, implicatedCount),
      verificationCounts,
      groups: Array.from(groupCounts.entries()).map(([key, v]) => ({
        key,
        name: fw.groups[key] ?? key,
        total: v.total,
        implicated: v.implicated,
      })),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    crosswalkGeneratedAt: doc.meta.generated_at,
    frameworks: summaries,
    controls,
    metrics: buildMetricStatements(doc.risk_metric_map, metrics, summaries),
    unclassifiedFindingIds: unclassified,
    unmappedInvestmentIds: unmappedInvestments,
    provenanceNote: doc.meta.provenance_note,
  };
}
