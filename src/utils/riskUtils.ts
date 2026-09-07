/**
 * ============================================================================
 * CYBER RISK QUANTIFICATION ENGINE (SIH 2026 Problem Statement 105)
 * ============================================================================
 *
 * There are two ways a finding gets a number here, and the difference is reported rather
 * than hidden.
 *
 * 1. TRAINED MODEL (`score_basis: 'model'` / `'observed_kev'`). A gradient-boosted model
 *    fitted on CISA KEV outcomes gives P(exploitation within 365 days); a second model
 *    fitted on VERIS incident losses gives a loss band. Expected annual loss is their
 *    product, capped at the asset's value. See src/model/.
 *
 * 2. DETERMINISTIC FALLBACK (`score_basis: 'heuristic'`). The formula below:
 *      Risk Score = f(CVSS, EPSS, Active Exploitation, Asset Criticality)
 *      EAL        = (Risk Score / 100) × Asset Value × EPSS Likelihood Factor
 *    Transparent and defensible as a formula, but not fitted to historical outcomes, so it
 *    must never be described as a measurement.
 *
 * The 0-100 index shown in the UI is derived from the expected loss in BOTH cases, by the
 * same function (`lossRatioToRiskIndex`), so the two paths stay comparable on one scale and
 * a mixed-coverage scan can still be sorted and tiered coherently.
 * ============================================================================
 */
import type { EnrichmentProvenance, FindingEnrichment, OrgProfile } from '../model/features';
import { classifyFindingFromScan } from '../model/features';
import type { Classification, CrosswalkFile } from '../model/crosswalk';
import type { ComplianceReport } from '../model/compliance';
import { buildComplianceReport } from '../model/compliance';
import type {
  EngineFindingInput,
  FindingScore,
  ModelStatus,
  ParityReport,
  RiskEngine,
} from '../model/engine';
import { lossRatioToRiskIndex, riskIndexToLossRatio, RISK_INDEX_RATIO_CEILING, RISK_INDEX_RATIO_FLOOR } from '../model/engine';
import type { DataQualityReport } from './scanValidation';
import { validateAndNormalizeScan } from './scanValidation';

export type { DataQualityIssue, DataQualityReport } from './scanValidation';
export { ScanRejected, isCleanScan, validateAndNormalizeScan } from './scanValidation';

export interface ScanMetadata {
  organization: string;
  scan_date: string;
  total_assets_scanned: number;
  total_findings: number;
  security_budget_available_inr: number;
}

export interface RawAsset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  business_criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  estimated_asset_value_inr: number;
  data_sensitivity: string;
  /**
   * Feeds the severity model's `records` feature, the single strongest predictor of
   * incident loss in VCDB. Optional: absent means "not stated", which the severity row
   * encodes as unobserved rather than as zero records.
   */
  records_at_risk?: number;
}

export interface RawFinding {
  finding_id: string;
  asset_id: string;
  cve_id: string;
  vulnerability_name: string;
  cvss_score: number;
  epss_score: number;
  actively_exploited: boolean;
  description: string;
  /**
   * NVD/EPSS fields a real scanner exports and `ml/enrich_scan.py` can fill from
   * data/raw/. All optional, so a scan file written before the model existed still
   * validates — it simply cannot be model-scored, and the UI says so.
   */
  enrichment?: FindingEnrichment;
}

export interface RawCandidateInvestment {
  control_id: string;
  control_name: string;
  cost_inr: number;
  estimated_risk_reduction_pct: number;
  addresses_findings: string[];
}

export interface ScanData {
  scan_metadata: ScanMetadata;
  assets: RawAsset[];
  findings: RawFinding[];
  candidate_investments: RawCandidateInvestment[];
  /**
   * Written by `ml/enrich_scan.py` when it fills the per-finding `enrichment` blocks. Optional,
   * and absent on any scan a scanner exported directly — which is the honest state, not a defect.
   *
   * Carried through to the UI rather than left in the file: the enrichment is what makes a
   * finding scoreable at all, so "these vectors came from the NVD extract, anchored at the scan
   * date" is part of where the number came from. A scan whose findings carry vectors from an
   * unstated source is worse than one with no vectors, because it scores.
   */
  enrichment_provenance?: EnrichmentProvenance;
}

/** Where a finding's numbers came from. Rendered next to them, never inferred downstream. */
export type ScoreBasisLabel = 'model' | 'observed_kev' | 'heuristic';

export interface EnrichedFinding extends RawFinding {
  asset: RawAsset;
  computed_risk_score: number; // 0 - 100, a log-scale restatement of expected_loss_inr / asset value
  expected_loss_inr: number; // ₹
  ai_explanation: string;
  /** 'heuristic' means the trained model did not produce this figure. Must be shown. */
  score_basis: ScoreBasisLabel;
  /** Populated only when score_basis is not 'heuristic'. Carries the loss band and provenance. */
  model_score: FindingScore | null;
  /**
   * Vulnerability class from the framework crosswalk, resolved for EVERY finding — including
   * ones the model declined to score. Classification is a crosswalk operation, not a model
   * output: a finding still implicates ISO A.8.8 whether or not its probability is estimable.
   * Null only when the crosswalk could not be loaded or nothing matched.
   */
  vuln_class: Classification | null;
  tier: {
    label: 'Critical' | 'High' | 'Medium' | 'Low';
    color: string;
    bg: string;
    border: string;
  };
}

export interface TrendPoint {
  /** `Day -13` … `Day -0`. Always present, and the only label available when `iso` is null. */
  day: string;
  /** What the axis prints: `Aug 28` when the scan stated a date, else the day offset. */
  date: string;
  /**
   * The real calendar day this point falls on, `YYYY-MM-DD`, or **null** when the scan file
   * stated no parseable date. Null is not a defect and must not be filled in with today or with
   * a constant: the axis is a claim about when these figures apply, and a scan with no date
   * supports no such claim. It is carried separately from `date` because `date` has no year, and
   * a 14-day window can straddle a year boundary.
   */
  iso: string | null;
  riskScore: number;
  financialExposure: number;
}

export interface BasisBreakdown {
  findings: number;
  exposureInr: number;
}

/**
 * Everything the UI needs to state how much of this scan the model actually covered. Kept on
 * the result rather than fetched separately so no view can render figures without also having
 * the caveat that belongs to them.
 */
export interface ModelReport {
  status: ModelStatus;
  parity: ParityReport | null;
  /** Findings the model scored, out of the total. Not the same as engine.coverage() when a
   *  finding is scoreable in principle but its asset is missing. */
  scored: number;
  total: number;
  org: OrgProfile | null;
  usdInr: number | null;
  /**
   * The same split, in money as well as in counts.
   *
   * `totalFinancialExposureInr` is a sum over findings scored by two unrelated methods, and a
   * count alone does not say how the money divides: three model-scored findings out of eighteen
   * can still be most of the exposure, or almost none of it. Every page that prints an aggregate
   * rupee figure needs this to describe it truthfully, so it travels with the result rather than
   * being recomputed — and recomputable-but-not-computed is how the mixing stayed invisible.
   */
  byBasis: Record<ScoreBasisLabel, BasisBreakdown>;
  /**
   * Where the per-finding `enrichment` blocks came from, copied verbatim from the scan file.
   * Null when the scan carries no such statement, which is the case for every scan exported by a
   * scanner rather than passed through `ml/enrich_scan.py`.
   */
  enrichment: EnrichmentProvenance | null;
  /**
   * The date the features were anchored on, and whether the scan file actually stated it.
   *
   * Two features read this anchor: `age_days_log` (how long the CVE had been public) and the
   * severity model's incident year. When the scan states no parseable date the anchor falls back
   * to today, which is the only defensible choice available in a browser — but it is a
   * substitution, and an unstated one would be the exact leak `ml/enrich_scan.py` refuses to make
   * on the training side: today is later than the scan, so the CVEs look older than they were.
   * `stated: null` is therefore a caveat the UI and both exports are obliged to print.
   */
  scanDateAnchor: ScanDateAnchor;
}

export interface ScanDateAnchor {
  /** `YYYY-MM-DD` as the scan file gave it, or null when it gave nothing parseable. */
  stated: string | null;
  /** `YYYY-MM-DD` the features were actually built against. Equals `stated` unless it is null. */
  used: string;
}

export interface ProcessedScanResult {
  scanMetadata: ScanMetadata;
  assets: RawAsset[];
  findings: EnrichedFinding[];
  candidateInvestments: RawCandidateInvestment[];
  overallOrgRiskScore: number;
  totalFinancialExposureInr: number;
  criticalFindingsCount: number;
  activelyExploitedCount: number;
  trendData: TrendPoint[];
  model: ModelReport;
  /**
   * What the ingest had to repair or refuse in this file, and how much of the portfolio can
   * therefore carry a rupee figure at all.
   *
   * Kept beside the figures for the same reason `model` is: a scan whose asset values did not
   * parse still renders a complete-looking dashboard, and the only difference between that and a
   * real one is this report. Every view that prints an aggregate is obliged to surface it when
   * `errorCount > 0`.
   */
  dataQuality: DataQualityReport;
  /**
   * The framework catalogue, so the compliance tab and the exports work from exactly the
   * catalogue the findings were classified against rather than re-fetching it and risking a
   * different version. Null when it could not be loaded, in which case the compliance tab
   * reports that instead of rendering a partial mapping.
   */
  crosswalk: CrosswalkFile | null;
}

// 1. BUSINESS CRITICALITY WEIGHT FACTORS
export const CRITICALITY_WEIGHTS: Record<RawAsset['business_criticality'], number> = {
  Critical: 1.5,
  High: 1.2,
  Medium: 0.85,
  Low: 0.5,
};

/**
 * Format Indian Currency (INR ₹) in compact Lakhs/Crores and standard commas.
 *
 * The non-finite guard is a backstop, not the fix: the ingest validator is what stops NaN reaching
 * a figure at all (see scanValidation.ts). But this function is called from every screen and both
 * exporters, and "₹NaN" printed confidently in a board report is the single worst failure mode this
 * codebase has — so if one ever gets here it says so in words instead of rendering as a number.
 */
export function formatINR(val: number, compact = false): string {
  if (!Number.isFinite(val)) return 'unavailable';
  if (compact) {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} L`;
    }
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(0)} K`;
    }
    return `₹${val}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Categorize score into standard risk tiers.
 *
 * Because the score is a log-scale restatement of expected loss as a share of asset value,
 * each boundary has a concrete meaning: Critical starts at 3.98% of asset value lost per
 * year, High at 1%, Medium at 0.25%. `riskTierBoundaryLabel` prints these so a reviewer can
 * check the tiering rather than take it on trust.
 */
export function getRiskTier(score: number): {
  label: 'Critical' | 'High' | 'Medium' | 'Low';
  color: string;
  bg: string;
  border: string;
} {
  if (score >= 80) {
    return {
      label: 'Critical',
      color: 'text-red-400',
      bg: 'bg-red-500/15',
      border: 'border-red-500/30'
    };
  }
  if (score >= 60) {
    return {
      label: 'High',
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30'
    };
  }
  if (score >= 40) {
    return {
      label: 'Medium',
      color: 'text-yellow-300',
      bg: 'bg-yellow-500/15',
      border: 'border-yellow-500/30'
    };
  }
  return {
    label: 'Low',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30'
  };
}

/** The annual loss share a tier boundary corresponds to, e.g. `getRiskTier` 80 -> "3.98%". */
export function riskTierBoundaryLabel(score: number): string {
  return `${(riskIndexToLossRatio(score) * 100).toFixed(2)}%`;
}

export const RISK_TIER_BOUNDARIES = [
  { label: 'Critical' as const, from: 80 },
  { label: 'High' as const, from: 60 },
  { label: 'Medium' as const, from: 40 },
  { label: 'Low' as const, from: 0 },
];

/**
 * Exploitation factor used by the deterministic fallback score. Exported because the findings
 * table shows this breakdown; a second copy of the expression in a component would drift from
 * this one silently and there would be nothing to catch it.
 */
export function heuristicExploitFactor(epss: number, activelyExploited: boolean): number {
  const activeBonus = activelyExploited ? 0.35 : 0.15;
  return epss * 0.5 + activeBonus;
}

/**
 * Deterministic fallback risk score (0-100), used when no trained model figure exists.
 *
 * This is a formula, not a fitted estimator: it says what its authors think matters and in
 * what proportion. That makes it explainable and auditable, and it is why it remains the
 * documented fallback — but its output is not a measurement of anything, and code that
 * presents it must carry `score_basis: 'heuristic'` so the UI can say so.
 */
export function computeFindingRiskScore(
  cvss: number,
  epss: number,
  activelyExploited: boolean,
  criticality: RawAsset['business_criticality']
): number {
  const normCVSS = cvss / 10; // 0.0 to 1.0
  const exploitFactor = heuristicExploitFactor(epss, activelyExploited);
  const critWeight = CRITICALITY_WEIGHTS[criticality] || 1.0;

  const rawScore = normCVSS * exploitFactor * critWeight * 78;
  return Math.round(Math.min(100, Math.max(5, rawScore)));
}

/**
 * Expected annual loss (₹) for the deterministic fallback path.
 *   EAL = (Risk Score / 100) × Asset Value × EPSS Likelihood Factor
 * Unlike the model path there is no loss distribution here, only a point estimate, and the
 * likelihood factor is asserted rather than fitted.
 */
export function computeFindingExpectedLoss(
  riskScore: number,
  assetValue: number,
  epss: number,
  activelyExploited: boolean
): number {
  const normRisk = riskScore / 100;
  // Threat likelihood factor derived from EPSS and confirmed exploitation
  const threatLikelihood = (epss * 0.3) + (activelyExploited ? 0.18 : 0.08);
  return Math.round(normRisk * assetValue * threatLikelihood);
}

/**
 * Plain-English rationale. Two shapes, because the two paths support different claims: the
 * model path can state a calibrated probability over a stated horizon and name its evidence,
 * while the fallback can only recite the inputs to a formula. Neither borrows the other's
 * language — that is the whole point of writing them separately.
 */
export function generateModelExplanation(
  score: FindingScore,
  finding: RawFinding,
  asset: RawAsset
): string {
  const pct = (score.exploitProbability * 100).toFixed(score.exploitProbability < 0.1 ? 1 : 0);
  const cls = score.vulnClass.key ? score.vulnClass.key.replace(/_/g, ' ') : 'unclassified';
  const band = `${formatINR(score.lossInr.p10, true)}–${formatINR(score.lossInr.p90, true)}`;

  const likelihood =
    score.probabilityBasis === 'observed_kev'
      ? `${finding.cve_id} is already in CISA's Known Exploited Vulnerabilities catalogue, so exploitation is observed, not predicted (probability fixed at 100%)`
      : `the exploitation model puts ${finding.cve_id} at ${pct}% probability of entering CISA's KEV catalogue within ${score.probabilityHorizonDays} days, from its CVSS v3.1 sub-vectors, EPSS history and NVD reference profile`;

  const cap = score.lossCappedAtAssetValue
    ? ` The loss band was capped at the asset's stated value of ${formatINR(asset.estimated_asset_value_inr, true)}.`
    : '';

  return (
    `${likelihood}. Comparable ${cls} incidents against ${asset.asset_type.toLowerCase()} assets ` +
    `in VERIS carry a recorded loss of ${band} (80% interval), giving an expected annual loss of ` +
    `${formatINR(score.eal.mean, true)} on ${asset.asset_name}.${cap}`
  );
}

/**
 * Generate plain-English explainable rationale for the deterministic fallback path.
 */
export function generateExplainableReason(
  cvss: number,
  epss: number,
  activelyExploited: boolean,
  criticality: RawAsset['business_criticality'],
  assetName: string,
  cveId: string,
  riskScore: number
): string {
  const exploitText = activelyExploited
    ? `confirmed active in-the-wild exploitation detected (EPSS ${(epss * 100).toFixed(0)}%)`
    : `EPSS ${(epss * 100).toFixed(0)}% represents elevated weaponization likelihood`;

  const critText = criticality === 'Critical' || criticality === 'High'
    ? `directly threatens mission-critical infrastructure (${assetName})`
    : `impacts supporting campus asset (${assetName})`;

  return `Assigned Risk Score ${riskScore}/100 by the deterministic CVSS/EPSS formula (no trained-model figure available for this finding) because ${cveId} exhibits CVSS ${cvss.toFixed(1)} with ${exploitText}, and ${critText} without immediate compensating containment.`;
}

/**
 * The 14-day trend is ILLUSTRATIVE. A single scan file contains one date, so there is no
 * history to plot; this draws a converging path to the current figure so the chart axis is
 * legible. It is not a measurement of anything and every view that renders it must caption it
 * as illustrative — hence the exported constant rather than a comment nobody reads.
 */
export const TREND_IS_ILLUSTRATIVE =
  'Illustrative shape only — a single scan file contains one date, so no prior history exists to plot. ' +
  'The final point is the figure computed from this scan.';

/**
 * Synthesize plausible last-14-day trend leading up to current org risk score.
 *
 * The shape is illustrative (see TREND_IS_ILLUSTRATIVE). The *dates*, however, are a factual
 * claim about when the figures apply, so they are handled as one:
 *
 *  - No invented anchor. This used to read `new Date(scanDateStr || '2026-08-28')`, which gave a
 *    dateless scan a calendar that came from nowhere, and turned an unparseable date into fourteen
 *    axis labels reading "Invalid Date" — `new Date('n/a')` does not throw, it returns one.
 *  - Arithmetic in UTC on epoch milliseconds, not `setDate` on a local Date. `new Date('2026-08-28')`
 *    is UTC midnight, and `toLocaleDateString` renders in the host's zone, so every label shifted
 *    back a day for any reader west of Greenwich.
 *  - A fixed month table rather than `toLocaleDateString`, because that depends on the host's ICU
 *    data and the same scan would then label its axis differently in the browser and in a harness.
 */
export function generate14DayTrend(
  currentRiskScore: number,
  currentExposure: number,
  scanDateStr: string | undefined
): TrendPoint[] {
  const trend: TrendPoint[] = [];
  const anchor = parseIsoDayUtc(scanDateStr);

  // Generate 14 past points with realistic slight variations converging to the current score
  for (let i = 13; i >= 0; i--) {
    const iso = anchor === null ? null : isoDayUtc(anchor - i * DAY_MS);
    const day = `Day -${i}`;

    // Converging random walk
    const progress = (14 - i) / 14;
    const offset = (Math.sin(i * 1.7) * 4) * (1 - progress * 0.8);
    const score = Math.round(Math.max(0, Math.min(100, currentRiskScore + offset)));
    // Guarded: the index is now a log-scale loss ratio, so a scan with no exposure at all
    // legitimately scores 0, and dividing by it would put NaN into the chart.
    const exposureFactor = currentRiskScore > 0 ? score / currentRiskScore : 1;
    const exposure = Math.round(currentExposure * exposureFactor);

    trend.push({
      day,
      date: iso === null ? day : trendDayLabel(iso),
      iso,
      riskScore: score,
      financialExposure: exposure
    });
  }

  // Ensure last point matches exactly
  trend[trend.length - 1].riskScore = currentRiskScore;
  trend[trend.length - 1].financialExposure = currentExposure;

  return trend;
}

const DAY_MS = 86_400_000;
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * `YYYY-MM-DD` at UTC midnight as epoch ms, or null. Strict on purpose: `new Date` accepts a
 * great deal that is not a date and silently rolls impossible days forward (`2026-02-31` becomes
 * 3 March), and an axis that must either state a date or state that it has none cannot guess.
 */
function parseIsoDayUtc(value: string | undefined): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((value ?? '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) {
    return null;
  }
  return ms;
}

function isoDayUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** `2026-08-28` → `Aug 28`. The year lives in `TrendPoint.iso`, not in the axis label. */
function trendDayLabel(iso: string): string {
  const parts = iso.split('-');
  return `${MONTHS_SHORT[Number(parts[1]) - 1]} ${parts[2]}`;
}

/**
 * The risk-index axis window for the trend chart, as `[lo, hi]`.
 *
 * Lives here rather than in the chart component because it encodes a fact this module owns: the
 * index is a log-scale loss ratio over 0..100 where 0.01% of asset value scores 0 and 0.1% scores
 * 33. The chart had `domain={[30, 100]}` hard-coded, which loses the good news — a well-secured
 * portfolio scoring 18 drew entirely below the floor, a flat line pinned to the bottom edge and
 * indistinguishable from a broken chart. A fixed floor is only safe for a quantity that cannot go
 * below it, and this one reaches 0.
 *
 * Guarantees, asserted in scripts/check-pipeline.cjs: the window contains every point, never
 * leaves 0..100, and spans at least TREND_AXIS_MIN_SPAN so a nearly-flat 14-day shape is not
 * magnified into apparent volatility.
 */
export const TREND_AXIS_MIN_SPAN = 20;
const TREND_AXIS_PAD = 6;

export function riskTrendDomain(points: TrendPoint[]): [number, number] {
  if (points.length === 0) return [0, 100];
  const values = points.map((p) => p.riskScore);
  let lo = Math.max(0, Math.floor(Math.min(...values)) - TREND_AXIS_PAD);
  let hi = Math.min(100, Math.ceil(Math.max(...values)) + TREND_AXIS_PAD);
  if (hi - lo < TREND_AXIS_MIN_SPAN) {
    const grow = (TREND_AXIS_MIN_SPAN - (hi - lo)) / 2;
    lo = Math.max(0, lo - grow);
    hi = Math.min(100, hi + grow);
    // Clamping one end can leave the span short; take the slack from the other.
    if (hi - lo < TREND_AXIS_MIN_SPAN) {
      if (lo === 0) hi = Math.min(100, TREND_AXIS_MIN_SPAN);
      else lo = Math.max(0, 100 - TREND_AXIS_MIN_SPAN);
    }
  }
  return [Math.floor(lo), Math.ceil(hi)];
}

/**
 * Comprehensive pipeline: Ingest and process raw scan JSON into structured platform state.
 *
 * Validation happens here rather than at the upload view, so there is one door: the sample-scan
 * button, a dragged file and every harness all get the same treatment of the same malformed
 * input. Throws `ScanRejected` when the document is not a scan at all; repairs and reports
 * everything else through `result.dataQuality`.
 */
export function processScanData(
  raw: ScanData,
  engine?: RiskEngine | null,
  /**
   * Why the engine is null, when the caller knows. `loadRiskEngine` reports every artefact
   * problem through `status.detail` itself, so a null engine means the load threw — and the
   * cause belongs on screen rather than in a console nobody opens.
   */
  engineFailureReason?: string | null
): ProcessedScanResult {
  const { scan, quality } = validateAndNormalizeScan(raw);
  const assetMap = new Map<string, RawAsset>();
  scan.assets.forEach((a) => assetMap.set(a.asset_id, a));

  const anchor = resolveScanDateAnchor(scan.scan_metadata.scan_date);
  const scanDate = new Date(`${anchor.used}T00:00:00Z`);
  let totalExposure = 0;
  let criticalCount = 0;
  let activelyExploitedCount = 0;
  let scoredByModel = 0;
  const byBasis: Record<ScoreBasisLabel, BasisBreakdown> = {
    model: { findings: 0, exposureInr: 0 },
    observed_kev: { findings: 0, exposureInr: 0 },
    heuristic: { findings: 0, exposureInr: 0 },
  };

  // The denominator of the organisation-level index: the value of the estate, counted once per
  // asset. It used to accumulate inside the findings loop, which counted an asset once per finding
  // against it — five findings on one server put that server's value into the denominator five
  // times and understated org risk by a factor of five. The bundled scan is 1:1, so the figure it
  // reports is unchanged; the defect only ever showed on a real scan.
  const totalAssetValue = scan.assets.reduce((sum, a) => sum + a.estimated_asset_value_inr, 0);

  const enrichedFindings: EnrichedFinding[] = scan.findings.map((finding) => {
    // A finding whose asset is not in the inventory keeps a placeholder so it still appears in the
    // table — it is a real finding — but the placeholder states a value of ₹0, not the ₹2,00,00,000
    // that used to be invented here. Eighteen unmatched findings previously produced ₹5.33 Cr of
    // reported exposure out of that constant. `dataQuality` names them.
    const asset = assetMap.get(finding.asset_id) || {
      asset_id: finding.asset_id,
      asset_name: finding.asset_id ? `Unknown asset (${finding.asset_id})` : 'Unknown asset',
      asset_type: 'General',
      business_criticality: 'Medium' as const,
      estimated_asset_value_inr: 0,
      data_sensitivity: 'Unstated'
    };


    // Ask the model first. It returns null — rather than a guess — when the finding lacks the
    // CVSS vector its features are built from, and that null is what selects the fallback.
    const modelScore = engine
      ? engine.score(toEngineFinding(finding), toEngineAsset(asset), scanDate)
      : null;

    let expectedLoss: number;
    let basis: ScoreBasisLabel;
    let explanation: string;

    if (modelScore) {
      expectedLoss = Math.round(modelScore.eal.mean);
      basis = modelScore.probabilityBasis === 'observed_kev' ? 'observed_kev' : 'model';
      explanation = generateModelExplanation(modelScore, finding, asset);
      scoredByModel += 1;
    } else {
      const heuristicScore = computeFindingRiskScore(
        finding.cvss_score,
        finding.epss_score,
        finding.actively_exploited,
        asset.business_criticality
      );
      expectedLoss = computeFindingExpectedLoss(
        heuristicScore,
        asset.estimated_asset_value_inr,
        finding.epss_score,
        finding.actively_exploited
      );
      basis = 'heuristic';
      explanation = generateExplainableReason(
        finding.cvss_score,
        finding.epss_score,
        finding.actively_exploited,
        asset.business_criticality,
        asset.asset_name,
        finding.cve_id,
        heuristicScore
      );
    }

    // One scale for both paths: the index is a function of the expected loss, whichever
    // path produced it. A scan with partial model coverage therefore still sorts and tiers
    // coherently instead of interleaving two incomparable 0-100 numbers.
    const computedScore = lossRatioToRiskIndex(expectedLoss, asset.estimated_asset_value_inr);

    // Classify regardless of how the finding was scored — the compliance mapping needs a
    // class for every finding. Reuse the engine's classification when it produced one so
    // there is only ever one answer per finding.
    const vulnClass = modelScore
      ? modelScore.vulnClass
      : engine
      ? classifyFindingFromScan(finding, engine.vulnClasses, engine.cweIndex)
      : null;

    totalExposure += expectedLoss;
    // Attributed as the figure is produced, not reconstructed afterwards from `score_basis`.
    // A later pass would be a second place that has to agree about which path ran.
    byBasis[basis].findings += 1;
    byBasis[basis].exposureInr += expectedLoss;

    if (computedScore >= 80 || asset.business_criticality === 'Critical') {
      criticalCount++;
    }
    if (finding.actively_exploited) {
      activelyExploitedCount++;
    }

    return {
      ...finding,
      asset,
      computed_risk_score: computedScore,
      expected_loss_inr: expectedLoss,
      ai_explanation: explanation,
      score_basis: basis,
      model_score: modelScore,
      vuln_class: vulnClass,
      tier: getRiskTier(computedScore)
    };
  });

  // Rank on money, not on the rounded index: two findings that both round to 71 still have
  // an order, and the one costing more should be remediated first.
  enrichedFindings.sort((a, b) => b.expected_loss_inr - a.expected_loss_inr);

  // The organisation-level index is the same function applied to the portfolio totals, so
  // "org risk 64" and "finding risk 64" mean the same thing: this share of the value at
  // stake is expected to be lost this year.
  const overallOrgRiskScore = lossRatioToRiskIndex(totalExposure, totalAssetValue);
  // `anchor.stated`, not the raw field: the axis and the features must agree about whether this
  // scan has a date at all. Passing the raw string would parse it a second time, and a second
  // parser is how the two would eventually disagree.
  const trendData = generate14DayTrend(overallOrgRiskScore, totalExposure, anchor.stated ?? undefined);

  return {
    scanMetadata: scan.scan_metadata,
    assets: scan.assets,
    findings: enrichedFindings,
    candidateInvestments: scan.candidate_investments,
    overallOrgRiskScore,
    totalFinancialExposureInr: totalExposure,
    criticalFindingsCount: criticalCount,
    activelyExploitedCount,
    trendData,
    dataQuality: quality,
    model: {
      status: engine?.status ?? {
        state: 'absent',
        message:
          'The risk engine was not loaded, so every figure on this page comes from the ' +
          'deterministic CVSS/EPSS formula rather than a model fitted to historical outcomes.',
        dataIsReal: false,
        generatedAt: null,
        detail: engineFailureReason
          ? [`the engine failed to load: ${engineFailureReason}`]
          : [],
      },
      parity: engine?.parity ?? null,
      scored: scoredByModel,
      total: scan.findings.length,
      org: engine?.org ?? null,
      usdInr: engine?.usdInr ?? null,
      byBasis,
      enrichment: scan.enrichment_provenance ?? null,
      scanDateAnchor: anchor,
    },
    crosswalk: engine?.crosswalk ?? null,
  };
}

/**
 * The feature anchor: the date the scan states, or today when it states nothing usable.
 *
 * Strictness matters here, and it is the *same* strictness the trend axis uses — one field cannot
 * have two parsers. `new Date(value)` was the previous implementation and it accepts a great deal
 * that is not an ISO date: `'2026-02-31'` silently becomes 3 March, `'08/28/2026'` is read as a US
 * date. With a strict parser on the chart and a lax one here, the same string could leave the axis
 * saying "this scan states no date" while the model scored every finding against a date invented
 * from it. Both now refuse the same inputs.
 *
 * The fallback to today is reported, never silent — see `ModelReport.scanDateAnchor`.
 */
function resolveScanDateAnchor(value: string | undefined): ScanDateAnchor {
  const ms = parseIsoDayUtc(value);
  if (ms !== null) {
    const iso = isoDayUtc(ms);
    return { stated: iso, used: iso };
  }
  return { stated: null, used: isoDayUtc(Date.now()) };
}

function toEngineFinding(finding: RawFinding): EngineFindingInput {
  return {
    cve_id: finding.cve_id,
    vulnerability_name: finding.vulnerability_name,
    description: finding.description,
    cvss_score: finding.cvss_score,
    epss_score: finding.epss_score,
    actively_exploited: finding.actively_exploited,
    enrichment: finding.enrichment,
  };
}

function toEngineAsset(asset: RawAsset) {
  return {
    asset_type: asset.asset_type,
    estimated_asset_value_inr: asset.estimated_asset_value_inr,
    records_at_risk: asset.records_at_risk,
  };
}

/**
 * Move the risk index to reflect a proportional cut in expected loss.
 *
 * The index is linear in log10(expected loss) — the asset value it is divided by does not
 * change when a control is deployed — so the shift is exactly `(100 / 3) × log10(1 - r)`
 * decades of loss, independent of where on the scale you started. Halving expected loss is a
 * 10-point improvement whether you were at 90 or at 40.
 *
 * Scaling the index itself by `(1 - r)` would be wrong now that the scale is logarithmic: it
 * would report a 50% control as taking 64 down to 32, which is a 99.9% cut in expected loss.
 */
export function projectRiskIndex(currentIndex: number, reductionFraction: number): number {
  const r = Math.min(0.999, Math.max(0, reductionFraction));
  if (currentIndex <= 0) return 0;
  if (r <= 0) return Math.round(currentIndex);
  const decades = Math.log10(1 - r);
  const span = Math.log10(RISK_INDEX_RATIO_CEILING) - Math.log10(RISK_INDEX_RATIO_FLOOR);
  return Math.round(Math.min(100, Math.max(0, currentIndex + (100 / span) * decades)));
}

/**
 * ============================================================================
 * KNAPSACK / GREEDY PORTFOLIO OPTIMIZATION
 * ============================================================================
 */
export interface OptimizationResult {
  selectedControls: RawCandidateInvestment[];
  totalCost: number;
  remainingBudget: number;
  budgetUtilizationPct: number;
  totalRiskReductionPct: number;
  currentRiskScore: number;
  projectedRiskScore: number;
  currentExposure: number;
  projectedExposure: number;
  savedExposure: number;
  addressedFindingIds: string[];
  averageROSI: number;
}

export function runKnapsackOptimization(
  budget: number,
  controls: RawCandidateInvestment[],
  currentRiskScore: number,
  currentExposure: number
): OptimizationResult {
  // Guarded independently of the ingest validator, because the budget here comes from a slider the
  // operator moves, not from the scan file. The validator cannot see it.
  const cap = Number.isFinite(budget) ? Math.max(0, budget) : 0;
  // Controls a scan-file validator would have dropped, in case this is called with a hand-built
  // list: a control with an unknown or negative cost cannot be ranked by reduction-per-rupee, and
  // a negative one drove `spent` below zero and reported 0% budget utilisation on a full basket.
  const usable = controls.filter(
    (c) =>
      Number.isFinite(c.cost_inr) &&
      c.cost_inr >= 0 &&
      Number.isFinite(c.estimated_risk_reduction_pct)
  );

  // Sort candidate investments by risk reduction per rupee ratio. A zero-cost control has infinite
  // ratio by that expression, so it is ordered first explicitly rather than by dividing by zero.
  const ranked = [...usable].sort((a, b) => {
    const ratio = (c: RawCandidateInvestment) =>
      c.cost_inr > 0 ? c.estimated_risk_reduction_pct / c.cost_inr : Number.POSITIVE_INFINITY;
    return ratio(b) - ratio(a);
  });

  const selected: RawCandidateInvestment[] = [];
  let spent = 0;
  const addressedSet = new Set<string>();

  for (const control of ranked) {
    if (spent + control.cost_inr <= cap) {
      selected.push(control);
      spent += control.cost_inr;
      // `addresses_findings` is optional in practice — a hand-written control often omits it — and
      // reading `.forEach` off undefined crashed the Investment page rather than the upload view,
      // where nothing catches it.
      if (Array.isArray(control.addresses_findings)) {
        control.addresses_findings.forEach((id) => addressedSet.add(id));
      }
    }
  }

  // Diminishing returns compounded mitigation calculation
  let remainingFactor = 1.0;
  for (const c of selected) {
    remainingFactor *= (1 - (Math.min(100, Math.max(0, c.estimated_risk_reduction_pct)) / 100));
  }
  const effectiveReductionPct = Math.round((1 - remainingFactor) * 100);

  const projectedRisk = projectRiskIndex(currentRiskScore, effectiveReductionPct / 100);
  const projectedExposure = Math.round(currentExposure * (1 - (effectiveReductionPct / 100)));
  const savedExposure = Math.max(0, currentExposure - projectedExposure);

  const averageROSI = spent > 0 ? Math.round(((savedExposure - spent) / spent) * 100) : 0;

  return {
    selectedControls: selected,
    totalCost: spent,
    remainingBudget: Math.max(0, cap - spent),
    budgetUtilizationPct: cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0,
    totalRiskReductionPct: effectiveReductionPct,
    currentRiskScore,
    projectedRiskScore: projectedRisk,
    currentExposure,
    projectedExposure,
    savedExposure,
    addressedFindingIds: Array.from(addressedSet),
    averageROSI
  };
}

/**
 * WHAT-IF SCENARIO SIMULATION
 */export function simulateWhatIfScenario(
  control: RawCandidateInvestment,
  budgetAllocated: number,
  baselineRiskScore: number,
  baselineExposure: number
): {
  reductionPct: number;
  newRiskScore: number;
  newExposure: number;
  deltaExposure: number;
  rosi: number;
  feasibility: 'Fully Funded' | 'Partially Funded' | 'Insufficient Budget';
} {
  // `budgetAllocated / cost_inr` was 0/0 = NaN for a control with no stated cost and nothing
  // allocated, and every field of the result — the projected score, the new exposure, the ROSI —
  // came back NaN and rendered as "NaN%" on the What-If page. A negative allocation was worse:
  // Math.pow of a negative fraction is NaN too, so a stray minus sign produced the same blank
  // screen with no error anywhere.
  const cost = Number.isFinite(control.cost_inr) ? Math.max(0, control.cost_inr) : 0;
  const allocated = Number.isFinite(budgetAllocated) ? Math.max(0, budgetAllocated) : 0;
  const stated = Number.isFinite(control.estimated_risk_reduction_pct)
    ? Math.min(100, Math.max(0, control.estimated_risk_reduction_pct))
    : 0;
  // A control that costs nothing is fully funded by any allocation, including none.
  const fundingRatio = cost <= 0 ? 1 : Math.min(1.0, allocated / cost);

  let feasibility: 'Fully Funded' | 'Partially Funded' | 'Insufficient Budget' = 'Fully Funded';
  if (fundingRatio >= 1.0) {
    feasibility = 'Fully Funded';
  } else if (fundingRatio >= 0.4) {
    feasibility = 'Partially Funded';
  } else {
    feasibility = 'Insufficient Budget';
  }

  const effectiveReduction = stated * Math.pow(fundingRatio, 0.85);
  const newScore = projectRiskIndex(baselineRiskScore, effectiveReduction / 100);
  const newExposure = Math.round(baselineExposure * (1 - effectiveReduction / 100));
  const deltaExposure = baselineExposure - newExposure;
  const rosi = allocated > 0 ? Math.round(((deltaExposure - allocated) / allocated) * 100) : 0;

  return {
    reductionPct: Math.round(effectiveReduction),
    newRiskScore: newScore,
    newExposure,
    deltaExposure,
    rosi,
    feasibility
  };
}

/**
 * ============================================================================
 * FRAMEWORK COMPLIANCE MAPPING
 * ============================================================================
 * Adapter between the platform's scan result and the framework-agnostic mapper in
 * src/model/compliance.ts. Returns null when the crosswalk is unavailable, so the compliance
 * tab reports the missing catalogue rather than rendering an incomplete mapping.
 */
export function buildScanComplianceReport(
  data: ProcessedScanResult,
  optimization?: OptimizationResult | null
): ComplianceReport | null {
  if (!data.crosswalk) return null;

  // Split by basis rather than by "has a score". A finding already in KEV gets probability 1 as an
  // observation (engine.ts refuses to predict a fact it was told), so averaging it into a figure
  // the crosswalk labels "model output" would let a scan of entirely known-exploited CVEs report
  // 100.0% without the exploitation model having run once.
  const modelPredicted = data.findings.filter((f) => f.model_score?.probabilityBasis === 'model');
  const observedInKev = data.findings.filter((f) => f.model_score?.probabilityBasis === 'observed_kev');
  const meanProbability =
    modelPredicted.length > 0
      ? modelPredicted.reduce((s, f) => s + (f.model_score?.exploitProbability ?? 0), 0) / modelPredicted.length
      : null;

  const criticalityProfile: Record<string, number> = {};
  for (const finding of data.findings) {
    const band = finding.asset.business_criticality;
    criticalityProfile[band] = (criticalityProfile[band] ?? 0) + finding.expected_loss_inr;
  }

  // Derived, not asserted. The previous fixed string blamed a missing CVSS vector even when the
  // real cause was something else entirely, which is the kind of confident wrong sentence that
  // costs more credibility than an honest "some findings, for mixed reasons".
  const probabilityUnavailableReason = (() => {
    if (data.model.status.state !== 'trained') return data.model.status.message;
    if (data.findings.length === 0) return 'The scan contains no findings, so there is nothing to score.';
    if (observedInKev.length === data.findings.length) {
      return `All ${data.findings.length} findings in this scan are already listed in CISA KEV, so their exploitation is observed rather than predicted and the model was not asked.`;
    }
    const unscored = data.findings.filter((f) => f.model_score === null);
    const noVector = unscored.filter((f) => !f.enrichment?.cvss_vector).length;
    if (unscored.length === 0) {
      return 'No finding was routed to the exploitation model, so no calibrated probability was produced.';
    }
    if (noVector === unscored.length) {
      return `None of the ${unscored.length} findings the model could have predicted carried the CVSS vector it requires, so no calibrated probability was produced.`;
    }
    return `${unscored.length} findings could not be scored (${noVector} for a missing CVSS vector, ${unscored.length - noVector} for other reasons), so no calibrated probability was produced.`;
  })();

  return buildComplianceReport(
    data.crosswalk,
    data.findings.map((f) => ({
      finding_id: f.finding_id,
      vulnClassKey: f.vuln_class?.key ?? null,
      riskIndex: f.computed_risk_score,
      expectedLossInr: f.expected_loss_inr,
    })),
    data.candidateInvestments.map((c) => ({
      control_id: c.control_id,
      control_name: c.control_name,
    })),
    {
      totalExpectedLossInr: data.totalFinancialExposureInr,
      meanExploitProbability: meanProbability,
      exploitProbabilityCounts: {
        modelPredicted: modelPredicted.length,
        observedInKev: observedInKev.length,
        total: data.findings.length,
      },
      residualRiskIndex: optimization ? optimization.projectedRiskScore : null,
      criticalFindings: data.criticalFindingsCount,
      activelyExploitedCount: data.activelyExploitedCount,
      roiPct: optimization ? optimization.averageROSI : null,
      criticalityProfile,
      probabilityUnavailableReason,
    }
  );
}
