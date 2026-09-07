/**
 * The inference engine: loads the exported artefacts, refuses them if they do not verify,
 * and turns a scan finding into a probability, a loss distribution and a rupee figure.
 *
 * Three refusals are built in, and each one leaves the platform working on its documented
 * fallback rather than degrading quietly:
 *   1. no model file present            -> `state: 'absent'`, the deterministic path is used
 *   2. feature vocabulary disagrees     -> `state: 'rejected'`, the model is not used at all
 *   3. parity fixture does not reproduce -> `state: 'rejected'`, likewise
 *
 * The second and third are the ones that matter. A model whose columns have shifted still
 * returns numbers; they are simply meaningless. Checking the exported `feature_names`
 * against the names this bundle generates, and re-deriving held-out rows the training run
 * recorded, is what makes "the browser computes what was evaluated" a checked claim.
 */
import type { CrosswalkFile, Classification, VulnClass } from './crosswalk';
import { buildCweIndex, loadCrosswalk } from './crosswalk';
import type { ParityFixture, RiskModelFile } from './types';
import { looksLikeMarkupNotJson, markupInsteadOfJsonDetail, stripBom } from './http';
import { applyCalibration, predictRaw, sigmoid } from './gbm';
import type { FeatureProvenance, FindingEnrichment, OrgProfile } from './features';
import {
  buildExploitationRow,
  buildSeverityRow,
  DEFAULT_ORG_PROFILE,
  exploitFeatureNames,
  severityFeatureNames,
} from './features';

/**
 * USD to INR. The severity model is fitted on VERIS incidents recorded in US dollars, so a
 * rate is unavoidable. It is a stated assumption with a date rather than a hidden constant,
 * it is the *default* for `RiskEngine.withAssumptions` rather than a fixed value, and it is
 * printed on every export — a board report that quietly used a two-year-old rate would be
 * misleading in a way nobody could see.
 */
export const USD_INR_ASSUMPTION = {
  rate: 85,
  asOf: '2025-05-31',
  note: 'Stated assumption, not a live rate. Update it before filing anything.',
};

/**
 * The 0-100 risk index is a log-scale restatement of expected annual loss as a share of the
 * value at stake, between two declared anchors: 0.01% of asset value scores 0, 10% scores
 * 100. Two properties follow, and both are why it replaced a weighted blend of unitless
 * factors. Every point on the scale corresponds to a specific percentage of asset value, so
 * "78" can be explained to a board. And because it is a ratio, the scale means the same
 * thing for a ₹5 lakh server and a ₹125 crore records database — an absolute rupee anchor
 * would have pinned every large asset at 100 and every small one at 0.
 *
 * The index is computed from the expected loss whatever produced it, so model-scored and
 * fallback-scored findings remain directly comparable on one scale.
 */
export const RISK_INDEX_RATIO_FLOOR = 1e-4;
export const RISK_INDEX_RATIO_CEILING = 1e-1;

export function lossRatioToRiskIndex(ealInr: number, assetValueInr: number): number {
  if (!(ealInr > 0) || !(assetValueInr > 0)) return 0;
  const lo = Math.log10(RISK_INDEX_RATIO_FLOOR);
  const hi = Math.log10(RISK_INDEX_RATIO_CEILING);
  const share = (Math.log10(ealInr / assetValueInr) - lo) / (hi - lo);
  return Math.round(Math.min(100, Math.max(0, share * 100)));
}

/** Inverse, so a tier boundary can be labelled with the loss share it actually means. */
export function riskIndexToLossRatio(index: number): number {
  const lo = Math.log10(RISK_INDEX_RATIO_FLOOR);
  const hi = Math.log10(RISK_INDEX_RATIO_CEILING);
  return Math.pow(10, lo + (Math.min(100, Math.max(0, index)) / 100) * (hi - lo));
}

// --------------------------------------------------------------------------- //
// load-time verification
// --------------------------------------------------------------------------- //
export interface ParityReport {
  checked: boolean;
  rows: number;
  maxDelta: {
    exploitationRaw: number;
    exploitationProbability: number;
    exploitationCalibrated: number;
    severityMean: number;
    severityP10: number;
    severityP90: number;
  };
  tolerance: number;
  passed: boolean;
  failures: string[];
}

const PARITY_TOLERANCE = 1e-9;

function maxAbsDelta(actual: number[], expected: number[]): number {
  let worst = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const d = Math.abs(actual[i] - expected[i]);
    if (d > worst) worst = d;
  }
  return worst;
}

/**
 * Re-derive the rows ml/train.py recorded from the held-out test split. A pass means this
 * bundle reproduces, to 1e-9, the same numbers the reported metrics were computed from.
 */
export function verifyParity(model: RiskModelFile, fixture: ParityFixture): ParityReport {
  const failures: string[] = [];
  if (fixture.exploitation.feature_names.join('|') !== model.exploitation.feature_names.join('|')) {
    failures.push('the parity fixture and the model disagree on the exploitation feature order');
  }
  if (fixture.severity.feature_names.join('|') !== model.severity.feature_names.join('|')) {
    failures.push('the parity fixture and the model disagree on the severity feature order');
  }

  const exRaw = fixture.exploitation.rows.map((row) => predictRaw(model.exploitation.gbm, row));
  const exProb = exRaw.map(sigmoid);
  const exCal = exProb.map((p) => applyCalibration(model.exploitation.calibration, p));
  const svMean = fixture.severity.rows.map((row) => predictRaw(model.severity.mean, row));
  const svP10 = fixture.severity.rows.map((row) => predictRaw(model.severity.p10, row));
  const svP90 = fixture.severity.rows.map((row) => predictRaw(model.severity.p90, row));

  const maxDelta = {
    exploitationRaw: maxAbsDelta(exRaw, fixture.exploitation.expected_raw),
    exploitationProbability: maxAbsDelta(exProb, fixture.exploitation.expected_probability),
    exploitationCalibrated: maxAbsDelta(exCal, fixture.exploitation.expected_calibrated),
    severityMean: maxAbsDelta(svMean, fixture.severity.expected_log10_mean),
    severityP10: maxAbsDelta(svP10, fixture.severity.expected_log10_p10),
    severityP90: maxAbsDelta(svP90, fixture.severity.expected_log10_p90),
  };
  for (const [name, delta] of Object.entries(maxDelta)) {
    if (!(delta <= PARITY_TOLERANCE)) {
      failures.push(`${name} differs from the training run by ${delta.toExponential(2)}`);
    }
  }

  return {
    checked: true,
    rows: fixture.exploitation.rows.length,
    maxDelta,
    tolerance: PARITY_TOLERANCE,
    passed: failures.length === 0,
    failures,
  };
}

/** Verify the browser's feature vocabulary is the one the model was fitted on. */
export function verifyFeatureNames(model: RiskModelFile, vulnClasses: VulnClass[]): string[] {
  const problems: string[] = [];
  const expectedExploit = exploitFeatureNames(vulnClasses.map((c) => c.key));
  const expectedSeverity = severityFeatureNames();

  const compare = (label: string, mine: string[], theirs: string[]) => {
    if (mine.length !== theirs.length) {
      problems.push(`${label}: this build generates ${mine.length} features, the model has ${theirs.length}`);
      return;
    }
    for (let i = 0; i < mine.length; i += 1) {
      if (mine[i] !== theirs[i]) {
        problems.push(`${label}: column ${i} is "${mine[i]}" here but "${theirs[i]}" in the model`);
        return;
      }
    }
  };
  compare('exploitation', expectedExploit, model.exploitation.feature_names);
  compare('severity', expectedSeverity, model.severity.feature_names);
  return problems;
}

// --------------------------------------------------------------------------- //
// structural validation
// --------------------------------------------------------------------------- //
/**
 * The schema `ml/train.py` writes. A future exporter that reshapes the artefact must bump this,
 * so an old bundle served alongside a new model refuses it instead of misreading it.
 */
export const MODEL_SCHEMA_VERSION = 1;

/**
 * Check every field the inference path will dereference, before it dereferences one.
 *
 * `types.ts` is a compile-time contract and `JSON.parse` honours none of it: a truncated,
 * hand-edited or wrong-schema artefact satisfies `RiskModelFile` only because the cast in
 * `fetchJson` asserts it does. Two distinct failure modes make this worth real code rather than a
 * try/catch alone.
 *
 * A missing sub-object throws inside `verifyFeatureNames`. That used to reject the whole
 * `loadRiskEngine` promise, leaving the caller with no engine at all — so a *malformed* model was
 * indistinguishable on screen from a *missing* one, and the one case that needs a loud explanation
 * got the quietest one.
 *
 * A child index or feature index out of range throws nothing whatsoever. Traversal reads
 * `tree.feature[oob]`, gets `undefined`, `undefined >= 0` is false, so the loop treats the node as
 * a leaf and adds `tree.value[undefined]` — NaN. That NaN passes through `sigmoid`, the
 * calibrator, the loss band and the rupee conversion without one exception being raised, and ends
 * up on a board report. Refusing the artefact is the only defence that exists.
 *
 * The validator is deliberately no stricter than `ml/gbm.py:to_dict` is generous: leaf rows carry
 * `threshold: 0.0` and whatever `left`/`right` were allocated, so child indices are range-checked
 * on internal nodes only.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((n) => typeof n === 'number' && Number.isFinite(n));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((s) => typeof s === 'string');
}

/** Cap per-model tree complaints: a corrupt export can have thousands, and four locate it. */
const MAX_TREE_PROBLEMS = 4;

function validateGbm(
  label: string,
  value: unknown,
  expectedObjective: string[],
  problems: string[]
): void {
  if (!isRecord(value)) {
    problems.push(`${label} is missing or is not an object`);
    return;
  }

  const nFeatures = value.n_features;
  const featureCountOk = typeof nFeatures === 'number' && Number.isInteger(nFeatures) && nFeatures > 0;
  if (!featureCountOk) problems.push(`${label}.n_features is not a positive integer`);
  if (typeof value.base_score !== 'number' || !Number.isFinite(value.base_score)) {
    problems.push(`${label}.base_score is not a finite number`);
  }
  if (typeof value.learning_rate !== 'number' || !Number.isFinite(value.learning_rate)) {
    problems.push(`${label}.learning_rate is not a finite number`);
  }
  // The engine sigmoids the exploitation score and reads the severity scores as log10 USD. An
  // artefact with the objectives swapped returns numbers on both paths and means nothing on either.
  if (typeof value.objective !== 'string' || !expectedObjective.includes(value.objective)) {
    problems.push(
      `${label}.objective is ${JSON.stringify(value.objective)}, expected one of ${expectedObjective.join('/')}`
    );
  }
  if (!isStringArray(value.feature_names)) {
    problems.push(`${label}.feature_names is not an array of strings`);
  } else if (featureCountOk && value.feature_names.length !== nFeatures) {
    problems.push(
      `${label} lists ${value.feature_names.length} feature names but declares n_features=${nFeatures}`
    );
  }

  const trees = value.trees;
  if (!Array.isArray(trees) || trees.length === 0) {
    problems.push(`${label}.trees is missing or empty`);
    return;
  }
  if (value.n_trees !== trees.length) {
    problems.push(`${label}.n_trees says ${String(value.n_trees)} but ${trees.length} trees are present`);
  }

  let treeProblems = 0;
  for (let t = 0; t < trees.length && treeProblems < MAX_TREE_PROBLEMS; t += 1) {
    const tree = trees[t];
    const fault = (problem: string) => {
      problems.push(`${label}.trees[${t}] ${problem}`);
      treeProblems += 1;
    };
    if (!isRecord(tree)) {
      fault('is not an object');
      continue;
    }
    const { feature, threshold, left, right } = tree;
    if (
      !isFiniteNumberArray(feature) ||
      !isFiniteNumberArray(threshold) ||
      !isFiniteNumberArray(left) ||
      !isFiniteNumberArray(right) ||
      !isFiniteNumberArray(tree.value)
    ) {
      fault('has a node array that is missing or holds a non-finite value');
      continue;
    }
    const n = feature.length;
    if (n === 0) {
      fault('has no nodes');
      continue;
    }
    if (threshold.length !== n || left.length !== n || right.length !== n || tree.value.length !== n) {
      fault(
        `has ragged node arrays (feature ${n}, threshold ${threshold.length}, ` +
          `left ${left.length}, right ${right.length}, value ${tree.value.length})`
      );
      continue;
    }
    if (!feature.some((f) => f < 0)) {
      fault('has no leaf, so traversal could never terminate');
      continue;
    }
    for (let i = 0; i < n && treeProblems < MAX_TREE_PROBLEMS; i += 1) {
      if (feature[i] < 0) continue; // leaf: threshold/left/right are unread padding
      if (featureCountOk && feature[i] >= (nFeatures as number)) {
        fault(`node ${i} splits on feature ${feature[i]}, beyond the ${String(nFeatures)} declared`);
        continue;
      }
      for (const [side, child] of [['left', left[i]] as const, ['right', right[i]] as const]) {
        if (!Number.isInteger(child) || child < 0 || child >= n) {
          fault(`node ${i} has ${side} child ${child}, outside [0,${n})`);
        } else if (child === i) {
          fault(`node ${i} is its own ${side} child`);
        }
      }
    }
  }
}

function validateCalibration(value: unknown, problems: string[]): void {
  if (!isRecord(value)) {
    problems.push('exploitation.calibration is missing or is not an object');
    return;
  }
  const { x, y } = value;
  if (!isFiniteNumberArray(x) || !isFiniteNumberArray(y)) {
    problems.push('exploitation.calibration.x/.y is missing or holds a non-finite value');
    return;
  }
  if (x.length !== y.length) {
    problems.push(`exploitation.calibration has ${x.length} x knots and ${y.length} y knots`);
    return;
  }
  if (x.length === 0) {
    problems.push('exploitation.calibration has no knots');
    return;
  }
  // applyCalibration binary-searches x. Unsorted knots make that search return a neighbouring
  // segment rather than an error, so the probability is quietly drawn from the wrong interval.
  for (let i = 1; i < x.length; i += 1) {
    if (!(x[i] >= x[i - 1])) {
      problems.push(`exploitation.calibration.x is not non-decreasing at knot ${i}`);
      break;
    }
  }
  // The map's output is a probability and is multiplied straight into a rupee loss. A knot outside
  // [0,1] would produce an expected loss larger than the loss itself.
  const outOfRange = y.findIndex((p) => p < 0 || p > 1);
  if (outOfRange >= 0) {
    problems.push(`exploitation.calibration.y[${outOfRange}] is ${y[outOfRange]}, outside [0,1]`);
  }
}

/** Everything `loadRiskEngine`, `score()` and the provenance banner dereference. */
export function validateModelShape(value: unknown): string[] {
  const problems: string[] = [];
  if (!isRecord(value)) return ['the model file did not parse to a JSON object'];

  if (value.schema_version !== MODEL_SCHEMA_VERSION) {
    problems.push(
      `schema_version is ${JSON.stringify(value.schema_version)}, this build reads ${MODEL_SCHEMA_VERSION}`
    );
  }
  // Missing is not the same as false. `Boolean(undefined)` would fail safe into the fixture
  // warning, but an artefact that never states its provenance is not an artefact whose provenance
  // is "fixture" — it is one nobody can vouch for, and this field is the only thing standing
  // between a fixture-built model and a figure quoted to a regulator.
  if (typeof value.data_is_real !== 'boolean') {
    problems.push('data_is_real is missing or is not a boolean, so the artefact states no provenance');
  }
  if (typeof value.generated_at !== 'string' || value.generated_at.length === 0) {
    problems.push('generated_at is missing, so the artefact cannot be dated');
  }

  const exploitation = value.exploitation;
  if (!isRecord(exploitation)) {
    problems.push('exploitation is missing or is not an object');
  } else {
    if (!isStringArray(exploitation.feature_names)) {
      problems.push('exploitation.feature_names is not an array of strings');
    }
    validateGbm('exploitation.gbm', exploitation.gbm, ['logistic'], problems);
    validateCalibration(exploitation.calibration, problems);
    const metrics = exploitation.metrics;
    if (!isRecord(metrics)) {
      problems.push('exploitation.metrics is missing or is not an object');
    } else {
      if (typeof metrics.evaluated_on !== 'string') {
        problems.push('exploitation.metrics.evaluated_on is missing');
      }
      const cal = metrics.calibration;
      if (!isRecord(cal) || typeof cal.method !== 'string' || typeof cal.applied !== 'boolean') {
        problems.push('exploitation.metrics.calibration is missing method or applied');
      }
    }
  }

  const severity = value.severity;
  if (!isRecord(severity)) {
    problems.push('severity is missing or is not an object');
  } else {
    if (!isStringArray(severity.feature_names)) {
      problems.push('severity.feature_names is not an array of strings');
    }
    if (severity.unit !== 'log10_usd') {
      problems.push(
        `severity.unit is ${JSON.stringify(severity.unit)}, expected "log10_usd" — the engine ` +
          'raises 10 to this power to get dollars'
      );
    }
    validateGbm('severity.mean', severity.mean, ['l2'], problems);
    validateGbm('severity.p10', severity.p10, ['quantile'], problems);
    validateGbm('severity.p90', severity.p90, ['quantile'], problems);
  }

  return problems;
}

/**
 * The fixture's own shape. `verifyParity` indexes `rows`, `expected_raw` and four more arrays in
 * lockstep, and `maxAbsDelta` iterates the *expected* array while reading the actual one — so a
 * fixture with more expected values than rows compares against `undefined`, yielding NaN, and
 * `!(NaN <= tolerance)` is true, which reports a parity failure with a nonsense delta instead of a
 * malformed fixture. Saying which it is costs twenty lines.
 */
export function validateParityFixtureShape(value: unknown): string[] {
  const problems: string[] = [];
  if (!isRecord(value)) return ['the parity fixture did not parse to a JSON object'];

  const half = (
    label: string,
    section: unknown,
    expectedKeys: string[]
  ): void => {
    if (!isRecord(section)) {
      problems.push(`${label} is missing or is not an object`);
      return;
    }
    if (!isStringArray(section.feature_names)) {
      problems.push(`${label}.feature_names is not an array of strings`);
    }
    const rows = section.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      problems.push(`${label}.rows is missing or empty, so there is nothing to reproduce`);
      return;
    }
    const width = isStringArray(section.feature_names) ? section.feature_names.length : null;
    for (let i = 0; i < rows.length; i += 1) {
      if (!isFiniteNumberArray(rows[i])) {
        problems.push(`${label}.rows[${i}] is not an array of finite numbers`);
        break;
      }
      if (width !== null && (rows[i] as number[]).length !== width) {
        problems.push(
          `${label}.rows[${i}] has ${(rows[i] as number[]).length} values, expected ${width}`
        );
        break;
      }
    }
    for (const key of expectedKeys) {
      const column = section[key];
      if (!isFiniteNumberArray(column)) {
        problems.push(`${label}.${key} is missing or holds a non-finite value`);
      } else if (column.length !== rows.length) {
        problems.push(
          `${label}.${key} has ${column.length} values for ${rows.length} rows — a length ` +
            'mismatch reads as a parity failure rather than as the malformed fixture it is'
        );
      }
    }
  };

  half('exploitation', value.exploitation, [
    'expected_raw',
    'expected_probability',
    'expected_calibrated',
  ]);
  half('severity', value.severity, [
    'expected_log10_mean',
    'expected_log10_p10',
    'expected_log10_p90',
  ]);
  return problems;
}

// --------------------------------------------------------------------------- //
// engine
// --------------------------------------------------------------------------- //
export type ModelState = 'trained' | 'absent' | 'rejected';

export interface ModelStatus {
  state: ModelState;
  /** Shown to the user verbatim. Written to be read by a reviewer, not a developer. */
  message: string;
  /** False for any artefact built from fixtures. Never inferred here — copied from the file. */
  dataIsReal: boolean;
  generatedAt: string | null;
  detail: string[];
}

export type ScoreBasis = 'model' | 'observed_kev' | 'unavailable';

export interface LossBand {
  mean: number;
  p10: number;
  p90: number;
}

export interface FindingScore {
  exploitProbability: number;
  probabilityBasis: ScoreBasis;
  probabilityHorizonDays: number;
  rawScore: number | null;
  uncalibratedProbability: number | null;
  lossUsd: LossBand;
  lossInr: LossBand;
  lossCappedAtAssetValue: boolean;
  eal: LossBand;
  riskIndex: number;
  vulnClass: Classification;
  exploitProvenance: FeatureProvenance;
  severityProvenance: FeatureProvenance;
}

export interface EngineFindingInput {
  cve_id: string;
  vulnerability_name: string;
  description: string;
  cvss_score: number;
  epss_score: number;
  actively_exploited: boolean;
  enrichment?: FindingEnrichment;
}

export interface EngineAssetInput {
  asset_type: string;
  estimated_asset_value_inr: number;
  records_at_risk?: number;
}

export interface RiskEngine {
  crosswalk: CrosswalkFile;
  vulnClasses: VulnClass[];
  cweIndex: Map<string, string>;
  model: RiskModelFile | null;
  status: ModelStatus;
  parity: ParityReport | null;
  org: OrgProfile;
  usdInr: number;
  /** Null when no defensible model figure exists; the caller then uses its fallback. */
  score(finding: EngineFindingInput, asset: EngineAssetInput, scanDate: Date): FindingScore | null;
  /** How many of `findings` the model can score, for the honesty banner. */
  coverage(findings: EngineFindingInput[]): { scoreable: number; total: number };
  /**
   * The same verified artefact, scoring against a different organisation profile or exchange rate.
   *
   * Both are inputs, not constants: the severity model's comparison set is selected by sector and
   * headcount, and every rupee figure on the platform is a dollar figure times a rate. Neither was
   * reachable from the UI, so the sector and size columns sat permanently in their "unknown"
   * positions and the rate could only ever be the one hard-coded here — while two comments in this
   * file claimed both were editable.
   *
   * It returns a new engine rather than mutating this one, and it deliberately does **not** re-fetch
   * or re-verify: `status`, `parity` and `model` are the *same objects*, because changing an
   * assumption is not new evidence about the artefact. A re-verification here would either be a lie
   * (the same fixture re-checked, reported as fresh) or a way to lose a verified model to a network
   * blip mid-session. The engine harness asserts that identity.
   *
   * A rate that is not a positive finite number is ignored rather than propagated: it would turn
   * every loss band into NaN or zero, and a screen full of ₹0 reads as "no exposure" rather than as
   * "bad input".
   */
  withAssumptions(next: { org?: OrgProfile; usdInr?: number }): RiskEngine;
}

/**
 * Three outcomes, not two.
 *
 * Collapsing every failure into `null` made a truncated download, an HTML error page and a
 * hand-mangled file all report "No trained model is present in public/model/" — a false statement
 * about the deployment, and the one the operator is least able to act on. `missing` is a fact about
 * what was deployed; `unreadable` means bytes are being served at that path and they are not an
 * artefact, which is a fault and has to be shown as one.
 */
type FetchOutcome<T> =
  | { kind: 'ok'; value: T }
  | { kind: 'missing'; detail: string }
  | { kind: 'unreadable'; detail: string };

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Whether a body is markup rather than the JSON that was asked for, and the message for that case.
 * Both live in `http.ts` because `loadCrosswalk` has the identical exposure and cannot import from
 * this module without a cycle — see that file for the failure this prevents.
 */
async function fetchJson<T>(url: string): Promise<FetchOutcome<T>> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    return { kind: 'missing', detail: `${url} could not be fetched (${errText(err)})` };
  }
  if (!response.ok) {
    return { kind: 'missing', detail: `${url} returned HTTP ${response.status}` };
  }
  let body: string;
  try {
    body = await response.text();
  } catch (err) {
    // The response started and then stopped. Nothing can be said about what is deployed at the
    // path, so this must not be reported as a bad artefact.
    return { kind: 'missing', detail: `${url} answered but its body could not be read (${errText(err)})` };
  }
  if (looksLikeMarkupNotJson(body)) {
    return { kind: 'missing', detail: markupInsteadOfJsonDetail(url, response.headers?.get('content-type')) };
  }
  if (body.trim() === '') {
    return {
      kind: 'unreadable',
      detail: `${url} is served but is empty (0 bytes of body) — an interrupted write, most likely`,
    };
  }
  try {
    return { kind: 'ok', value: JSON.parse(stripBom(body)) as T };
  } catch (err) {
    return { kind: 'unreadable', detail: `${url} is served but is not valid JSON (${errText(err)})` };
  }
}

export interface LoadEngineOptions {
  modelUrl?: string;
  fixtureUrl?: string;
  crosswalkUrl?: string;
  org?: OrgProfile;
  usdInr?: number;
}

const NO_MODEL_MESSAGE =
  'No trained model is present in public/model/. Risk scores below come from the ' +
  'platform\'s deterministic CVSS/EPSS formula, which is transparent but not fitted to ' +
  'historical outcomes. Run ml/fetch_real_data.py, ml/build_dataset.py and ml/train.py to ' +
  'produce the model.';

const REJECTED_MESSAGE =
  'A model file was found but rejected, so the deterministic formula is in use. ' +
  'Rejection is deliberate: a model whose feature columns or arithmetic no longer ' +
  'match the training run would still produce numbers, and they would be wrong in a ' +
  'way nothing on screen could reveal.';

export async function loadRiskEngine(options: LoadEngineOptions = {}): Promise<RiskEngine> {
  const crosswalk = await loadCrosswalk(options.crosswalkUrl);
  const vulnClasses = crosswalk.vulnerability_classes;
  const cweIndex = buildCweIndex(vulnClasses);
  const org = options.org ?? DEFAULT_ORG_PROFILE;
  const usdInr = options.usdInr ?? USD_INR_ASSUMPTION.rate;

  const fetched = await fetchJson<unknown>(options.modelUrl ?? '/model/risk-model.json');
  let status: ModelStatus;
  let parity: ParityReport | null = null;
  let accepted: RiskModelFile | null = null;

  const reject = (detail: string[], model?: Record<string, unknown>): ModelStatus => ({
    state: 'rejected',
    message: REJECTED_MESSAGE,
    // Read defensively: this is the path taken when the artefact is known to be malformed, so its
    // own provenance fields cannot be trusted to exist, let alone to be the right type.
    dataIsReal: typeof model?.data_is_real === 'boolean' ? model.data_is_real : false,
    generatedAt: typeof model?.generated_at === 'string' ? model.generated_at : null,
    detail,
  });

  if (fetched.kind === 'missing') {
    status = {
      state: 'absent',
      message: NO_MODEL_MESSAGE,
      dataIsReal: false,
      generatedAt: null,
      detail: [fetched.detail],
    };
  } else if (fetched.kind === 'unreadable') {
    status = reject([fetched.detail]);
  } else {
    // Everything from here can throw on a malformed artefact — verifyFeatureNames and
    // verifyParity both dereference nested arrays. A throw used to reject the whole promise and
    // leave the caller with no engine, which is the one outcome that explains nothing. Any
    // escape becomes a rejection carrying the message instead.
    const raw = fetched.value as Record<string, unknown>;
    try {
      const problems = validateModelShape(raw);
      if (problems.length > 0) {
        status = reject(problems, raw);
      } else {
        const model = raw as unknown as RiskModelFile;
        problems.push(...verifyFeatureNames(model, vulnClasses));

        const fixtureFetch = await fetchJson<unknown>(
          options.fixtureUrl ?? '/model/parity-fixture.json'
        );
        if (fixtureFetch.kind !== 'ok') {
          problems.push(
            `${fixtureFetch.detail} — without it this bundle cannot prove it reproduces the evaluated model`
          );
        } else {
          const fixtureProblems = validateParityFixtureShape(fixtureFetch.value);
          if (fixtureProblems.length > 0) {
            problems.push(...fixtureProblems);
          } else {
            parity = verifyParity(model, fixtureFetch.value as ParityFixture);
            problems.push(...parity.failures);
          }
        }

        if (problems.length > 0) {
          status = reject(problems, raw);
        } else {
          accepted = model;
          const cal = model.exploitation.metrics.calibration;
          status = {
            state: 'trained',
            message: model.data_is_real
              ? 'Trained model loaded and verified against its parity fixture.'
              : 'A model was loaded and verified, but it was built from FIXTURES, not real data. ' +
                'No figure derived from it is a measurement. Do not report any of it.',
            dataIsReal: Boolean(model.data_is_real),
            generatedAt: model.generated_at ?? null,
            detail: [
              `${model.exploitation.gbm.n_trees} trees, ${model.exploitation.feature_names.length} features`,
              `evaluated on ${model.exploitation.metrics.evaluated_on}`,
              `calibration: ${cal.method}${cal.applied ? '' : ' (isotonic map declined on the selection slice)'}`,
              parity ? `parity max delta ${Math.max(...Object.values(parity.maxDelta)).toExponential(2)}` : '',
            ].filter(Boolean),
          };
        }
      }
    } catch (err) {
      accepted = null;
      parity = null;
      status = reject(
        [
          `verification threw rather than returning a verdict: ${errText(err)}`,
          'That is a defect in the artefact or in this bundle. The deterministic formula is in use.',
        ],
        raw
      );
    }
  }

  const score = (
    finding: EngineFindingInput,
    asset: EngineAssetInput,
    scanDate: Date,
    activeOrg: OrgProfile,
    activeRate: number
  ): FindingScore | null => {
    if (!accepted) return null;
    const enrichment = finding.enrichment ?? {};
    const ex = buildExploitationRow(
      {
        cvss_score: finding.cvss_score,
        epss_score: finding.epss_score,
        vulnerability_name: finding.vulnerability_name,
        description: finding.description,
        enrichment,
        asOf: scanDate,
      },
      vulnClasses,
      cweIndex
    );

    let probability: number;
    let basis: ScoreBasis;
    let rawScore: number | null = null;
    let uncalibrated: number | null = null;

    if (finding.actively_exploited) {
      // The model's question is "will this currently-unexploited CVE enter the KEV
      // catalogue". For a CVE already known to be exploited that question is answered, and
      // training drops such rows precisely so the model never learns to predict a fact it
      // was told. So this is an observation, labelled as one, not a prediction.
      probability = 1;
      basis = 'observed_kev';
    } else if (ex.cvssVectorParsed) {
      rawScore = predictRaw(accepted.exploitation.gbm, ex.row);
      uncalibrated = sigmoid(rawScore);
      probability = applyCalibration(accepted.exploitation.calibration, uncalibrated);
      basis = 'model';
    } else {
      // No CVSS vector: twenty-four of sixty-six columns would have to be invented. Refuse.
      return null;
    }

    const sev = buildSeverityRow({
      vulnClassKey: ex.classification.key,
      assetType: asset.asset_type,
      recordsAtRisk: asset.records_at_risk,
      incidentYear: scanDate.getUTCFullYear(),
      org: activeOrg,
    });

    const log10Mean = predictRaw(accepted.severity.mean, sev.row);
    const log10Lo = predictRaw(accepted.severity.p10, sev.row);
    const log10Hi = predictRaw(accepted.severity.p90, sev.row);
    // Quantile models are fitted independently, so nothing forces p10 <= p90. Order them
    // rather than letting a crossed interval print as a negative-width range.
    const lo = Math.min(log10Lo, log10Hi);
    const hi = Math.max(log10Lo, log10Hi);

    const lossUsd: LossBand = { mean: 10 ** log10Mean, p10: 10 ** lo, p90: 10 ** hi };
    const cap = asset.estimated_asset_value_inr;
    const rawInr = {
      mean: lossUsd.mean * activeRate,
      p10: lossUsd.p10 * activeRate,
      p90: lossUsd.p90 * activeRate,
    };
    const capped = rawInr.p90 > cap || rawInr.mean > cap;
    const lossInr: LossBand = {
      mean: Math.min(rawInr.mean, cap),
      p10: Math.min(rawInr.p10, cap),
      p90: Math.min(rawInr.p90, cap),
    };

    const eal: LossBand = {
      mean: probability * lossInr.mean,
      p10: probability * lossInr.p10,
      p90: probability * lossInr.p90,
    };

    return {
      exploitProbability: probability,
      probabilityBasis: basis,
      probabilityHorizonDays: 365,
      rawScore,
      uncalibratedProbability: uncalibrated,
      lossUsd,
      lossInr,
      lossCappedAtAssetValue: capped,
      eal,
      riskIndex: lossRatioToRiskIndex(eal.mean, cap),
      vulnClass: ex.classification,
      exploitProvenance: ex.provenance,
      severityProvenance: sev.provenance,
    };
  };

  /**
   * One engine object per set of assumptions, over one set of verified artefacts. Everything the
   * verification produced is captured above and shared by reference; only `org` and `usdInr` vary.
   */
  const build = (activeOrg: OrgProfile, activeRate: number): RiskEngine => ({
    crosswalk,
    vulnClasses,
    cweIndex,
    model: accepted,
    status,
    parity,
    org: activeOrg,
    usdInr: activeRate,
    score: (finding, asset, scanDate) => score(finding, asset, scanDate, activeOrg, activeRate),
    coverage: (findings) => ({
      total: findings.length,
      scoreable: accepted
        ? findings.filter(
            (f) => f.actively_exploited || Boolean(parseVectorPresent(f.enrichment?.cvss_vector))
          ).length
        : 0,
    }),
    withAssumptions: (next) =>
      build(
        next.org ?? activeOrg,
        typeof next.usdInr === 'number' && Number.isFinite(next.usdInr) && next.usdInr > 0
          ? next.usdInr
          : activeRate
      ),
  });

  return build(org, usdInr);
}

/** Cheap presence check that does not pull the full CVSS parser into the coverage loop. */
function parseVectorPresent(vector: string | undefined): boolean {
  return typeof vector === 'string' && vector.includes('AV:');
}
