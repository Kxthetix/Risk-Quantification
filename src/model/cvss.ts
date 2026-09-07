/**
 * CVSS v3.1 vector parsing and sub-score computation.
 *
 * Why this file exists: the exploitation model was fitted on NVD records, and three of its
 * ten numeric features are NVD's `baseScore`, `exploitabilityScore` and `impactScore`,
 * plus twenty-two one-hot columns for the base sub-vectors. A scan that reports only a
 * base score cannot fill any of those twenty-four columns. A scan that reports the vector
 * string — which Nessus, Qualys, OpenVAS and Trivy all do — can fill every one of them
 * exactly, because the sub-scores are closed-form functions of the vector as specified in
 * the CVSS v3.1 specification (section 7.1), not values NVD chooses.
 *
 * Rounding: NVD publishes both sub-scores at one decimal place, and the training features
 * read those published values verbatim. So this file rounds to one decimal too. Computing
 * at full precision here would be *more* accurate and *less* faithful, and faithfulness is
 * what keeps browser features on the same scale as the fitted trees.
 */

export type AttackVector = 'NETWORK' | 'ADJACENT_NETWORK' | 'LOCAL' | 'PHYSICAL';
export type AttackComplexity = 'LOW' | 'HIGH';
export type PrivilegesRequired = 'NONE' | 'LOW' | 'HIGH';
export type UserInteraction = 'NONE' | 'REQUIRED';
export type Scope = 'UNCHANGED' | 'CHANGED';
export type CiaImpact = 'HIGH' | 'LOW' | 'NONE';

export interface CvssBaseMetrics {
  attackVector: AttackVector;
  attackComplexity: AttackComplexity;
  privilegesRequired: PrivilegesRequired;
  userInteraction: UserInteraction;
  scope: Scope;
  confidentialityImpact: CiaImpact;
  integrityImpact: CiaImpact;
  availabilityImpact: CiaImpact;
}

export interface CvssScores {
  baseScore: number;
  exploitabilityScore: number;
  impactScore: number;
}

export interface ParsedCvss extends CvssBaseMetrics, CvssScores {
  version: string;
  vector: string;
}

const AV: Record<string, AttackVector> = { N: 'NETWORK', A: 'ADJACENT_NETWORK', L: 'LOCAL', P: 'PHYSICAL' };
const AC: Record<string, AttackComplexity> = { L: 'LOW', H: 'HIGH' };
const PR: Record<string, PrivilegesRequired> = { N: 'NONE', L: 'LOW', H: 'HIGH' };
const UI: Record<string, UserInteraction> = { N: 'NONE', R: 'REQUIRED' };
const SC: Record<string, Scope> = { U: 'UNCHANGED', C: 'CHANGED' };
const CIA: Record<string, CiaImpact> = { H: 'HIGH', L: 'LOW', N: 'NONE' };

const AV_W: Record<AttackVector, number> = {
  NETWORK: 0.85,
  ADJACENT_NETWORK: 0.62,
  LOCAL: 0.55,
  PHYSICAL: 0.2,
};
const AC_W: Record<AttackComplexity, number> = { LOW: 0.77, HIGH: 0.44 };
const UI_W: Record<UserInteraction, number> = { NONE: 0.85, REQUIRED: 0.62 };
const CIA_W: Record<CiaImpact, number> = { HIGH: 0.56, LOW: 0.22, NONE: 0 };

/** Privileges Required is the one weight that depends on Scope. CVSS v3.1 §7.1. */
function prWeight(pr: PrivilegesRequired, scope: Scope): number {
  const changed = scope === 'CHANGED';
  if (pr === 'NONE') return 0.85;
  if (pr === 'LOW') return changed ? 0.68 : 0.62;
  return changed ? 0.5 : 0.27;
}

/**
 * The specification's Roundup, not Math.ceil. It rounds up to one decimal place but treats
 * a value already at one decimal as exact, working in hundred-thousandths to avoid the
 * float artefacts that make 8.6 look like 8.600000000000001 and round up to 8.7.
 */
export function cvssRoundup(input: number): number {
  const scaled = Math.round(input * 100000);
  if (scaled % 10000 === 0) return scaled / 100000;
  return (Math.floor(scaled / 10000) + 1) / 10;
}

/** NVD publishes sub-scores at one decimal place; training read those published values. */
function nvdRound1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeCvssScores(m: CvssBaseMetrics): CvssScores {
  const iss =
    1 -
    (1 - CIA_W[m.confidentialityImpact]) *
      (1 - CIA_W[m.integrityImpact]) *
      (1 - CIA_W[m.availabilityImpact]);

  const impact =
    m.scope === 'UNCHANGED'
      ? 6.42 * iss
      : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);

  const exploitability =
    8.22 * AV_W[m.attackVector] * AC_W[m.attackComplexity] * prWeight(m.privilegesRequired, m.scope) * UI_W[m.userInteraction];

  let base: number;
  if (impact <= 0) {
    base = 0;
  } else if (m.scope === 'UNCHANGED') {
    base = cvssRoundup(Math.min(impact + exploitability, 10));
  } else {
    base = cvssRoundup(Math.min(1.08 * (impact + exploitability), 10));
  }

  return {
    baseScore: base,
    exploitabilityScore: nvdRound1(exploitability),
    impactScore: nvdRound1(impact),
  };
}

/**
 * Parse a CVSS v3.0/v3.1 vector string. Returns null rather than throwing, and rather than
 * guessing: a scan with a malformed vector must degrade to "sub-vectors unobserved" and say
 * so in the UI, not quietly receive a default profile that would look like a measurement.
 *
 * Temporal and environmental metrics are ignored if present. They are not in the training
 * features, so consuming them would put the browser on a different scale to the trees.
 */
export function parseCvssVector(vector: string | undefined | null): ParsedCvss | null {
  if (!vector || typeof vector !== 'string') return null;
  const parts = vector.trim().toUpperCase().split('/').filter(Boolean);
  if (parts.length < 8) return null;

  let version = '3.1';
  const fields = new Map<string, string>();
  for (const part of parts) {
    const [key, value] = part.split(':');
    if (!key || !value) continue;
    if (key === 'CVSS') {
      version = value;
      continue;
    }
    fields.set(key, value);
  }
  if (!version.startsWith('3')) return null;

  const av = AV[fields.get('AV') ?? ''];
  const ac = AC[fields.get('AC') ?? ''];
  const pr = PR[fields.get('PR') ?? ''];
  const ui = UI[fields.get('UI') ?? ''];
  const sc = SC[fields.get('S') ?? ''];
  const c = CIA[fields.get('C') ?? ''];
  const i = CIA[fields.get('I') ?? ''];
  const a = CIA[fields.get('A') ?? ''];
  if (!av || !ac || !pr || !ui || !sc || !c || !i || !a) return null;

  const metrics: CvssBaseMetrics = {
    attackVector: av,
    attackComplexity: ac,
    privilegesRequired: pr,
    userInteraction: ui,
    scope: sc,
    confidentialityImpact: c,
    integrityImpact: i,
    availabilityImpact: a,
  };
  return { version, vector: vector.trim(), ...metrics, ...computeCvssScores(metrics) };
}

/** Human-readable severity band, CVSS v3.1 qualitative rating scale. */
export function cvssSeverityBand(score: number): 'None' | 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score === 0) return 'None';
  if (score < 4) return 'Low';
  if (score < 7) return 'Medium';
  if (score < 9) return 'High';
  return 'Critical';
}
