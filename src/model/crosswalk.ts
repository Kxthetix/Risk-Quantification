/**
 * Loader and resolvers for public/frameworks/crosswalk.json.
 *
 * `classifyFinding` and `classifyMitigation` below are deliberate re-implementations of the
 * functions of the same name in frameworks/crosswalk.py (lines 636 and 661). The Python
 * versions decide the `vulnclass=*` one-hot columns the exploitation model was fitted on,
 * so a browser that classified differently would feed the trees a different feature than
 * training produced. The resolution order — CWE first because it is an assertion by the CVE
 * assigner, longest-keyword fallback second because it is an inference — is reproduced
 * exactly, including which one wins on a tie.
 */
import { looksLikeMarkupNotJson, markupInsteadOfJsonDetail, stripBom } from './http';

export type FrameworkId = 'iso27001' | 'nistcsf' | 'cis' | 'rbi' | 'sebi';

/** Fixed display order: the two international frameworks, CIS, then the Indian regulators. */
export const FRAMEWORK_ORDER: FrameworkId[] = ['iso27001', 'nistcsf', 'cis', 'rbi', 'sebi'];

/**
 * How much weight an identifier can carry in a report. `verified` was checked against the
 * published standard. `inferred` means the requirement substance is right but the official
 * clause numbering could not be confirmed. `assigned` means this project created the
 * identifier. Only `verified` is a citation; the other two must be labelled wherever they
 * appear, which is why this is part of the control type rather than a footnote.
 */
export type Verification = 'verified' | 'inferred' | 'assigned';

export interface ControlEntry {
  title: string;
  group: string;
  group_name: string;
  verification: Verification;
  /** Present on `assigned` entries: what the mapping is based on. */
  basis?: string;
  /** Present on `inferred` and `assigned` entries: what could not be confirmed. */
  note?: string;
}

export interface FrameworkEntry {
  id: FrameworkId;
  name: string;
  long_name: string;
  authority: string;
  groups: Record<string, string>;
  controls: Record<string, ControlEntry>;
  /** SEBI only. */
  resilience_goals?: Record<string, string>;
  re_categories?: Record<string, string>;
}

export type ControlRefs = Record<FrameworkId, string[]>;

export interface VulnClass {
  key: string;
  label: string;
  cwes: string[];
  keywords: string[];
  rationale: string;
  controls: ControlRefs;
}

export interface MitigationClass {
  key: string;
  label: string;
  control_ids: string[];
  keywords: string[];
  evidence: string;
  controls: ControlRefs;
}

export interface RiskMetricMapping {
  key: string;
  label: string;
  /** Name of the figure in the platform's own vocabulary. */
  field: string;
  unit: 'INR' | 'probability' | 'index_0_100' | 'percent' | 'count' | string;
  /** The governance claim this metric supports. Quoted verbatim in the board report. */
  statement: string;
  controls: ControlRefs;
}

export interface CrosswalkMeta {
  schema_version: number;
  generated_at: string;
  generator: string;
  sources: Record<FrameworkId, string>;
  provenance_note: string;
  verification_counts: Record<FrameworkId, Partial<Record<Verification, number>>>;
  coverage: Record<FrameworkId, { mapped: number; total: number; pct: number }>;
}

export interface CrosswalkFile {
  meta: CrosswalkMeta;
  frameworks: Record<FrameworkId, FrameworkEntry>;
  vulnerability_classes: VulnClass[];
  mitigation_classes: MitigationClass[];
  risk_metric_map: RiskMetricMapping[];
}

export type ClassificationMethod = 'cwe' | 'cwe_from_text' | 'keyword' | 'control_id' | 'unmatched';

export interface Classification {
  key: string | null;
  method: ClassificationMethod;
  matched: string | null;
}

/** CWE id -> class key. `setdefault` semantics: the first class listing a CWE owns it. */
export function buildCweIndex(classes: VulnClass[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const cls of classes) {
    for (const cwe of cls.cwes) {
      if (!index.has(cwe)) index.set(cwe, cls.key);
    }
  }
  return index;
}

/** Pull CWE identifiers out of free text. Scanners often name the CWE in the description. */
export function extractCweIds(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const match of text.toUpperCase().matchAll(/CWE-(\d{1,5})\b/g)) {
    const id = `CWE-${match[1]}`;
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Resolve a finding to a vulnerability class.
 *
 * Mirrors frameworks/crosswalk.py:636. The keyword branch takes the *longest* matching
 * keyword, and a strictly-greater comparison means the earliest class wins a length tie —
 * both details matter for agreement with the training-time labels.
 */
export function classifyFinding(
  index: Map<string, string>,
  classes: VulnClass[],
  cwes: string[],
  text: string,
  cwesCameFromText = false
): Classification {
  for (const raw of cwes) {
    const cwe = raw.trim().toUpperCase();
    const key = index.get(cwe);
    if (key) {
      return { key, method: cwesCameFromText ? 'cwe_from_text' : 'cwe', matched: cwe };
    }
  }

  const haystack = (text || '').toLowerCase();
  let best: { len: number; key: string; kw: string } | null = null;
  for (const cls of classes) {
    for (const kw of cls.keywords) {
      if (haystack.includes(kw) && (best === null || kw.length > best.len)) {
        best = { len: kw.length, key: cls.key, kw };
      }
    }
  }
  if (best) return { key: best.key, method: 'keyword', matched: best.kw };
  return { key: null, method: 'unmatched', matched: null };
}

/** Resolve a candidate investment to a mitigation class: control id first, then keywords. */
export function classifyMitigation(
  classes: MitigationClass[],
  controlId: string,
  name: string
): Classification {
  const cid = (controlId || '').trim().toUpperCase();
  if (cid) {
    for (const cls of classes) {
      if (cls.control_ids.includes(cid)) return { key: cls.key, method: 'control_id', matched: cid };
    }
  }

  const haystack = (name || '').toLowerCase();
  let best: { len: number; key: string; kw: string } | null = null;
  for (const cls of classes) {
    for (const kw of cls.keywords) {
      if (haystack.includes(kw) && (best === null || kw.length > best.len)) {
        best = { len: kw.length, key: cls.key, kw };
      }
    }
  }
  if (best) return { key: best.key, method: 'keyword', matched: best.kw };
  return { key: null, method: 'unmatched', matched: null };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Fetch and shape-check the crosswalk. Throws on a malformed file rather than returning a
 * partial one: a compliance tab that silently renders four of five frameworks is worse than
 * one that reports it could not load the catalogue.
 */
export async function loadCrosswalk(url = '/frameworks/crosswalk.json'): Promise<CrosswalkFile> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`could not load the framework crosswalk (${response.status} from ${url})`);
  }
  // Same trap as the model loader, and it surfaces worse here: this throw aborts the whole engine
  // load, so an undeployed crosswalk would reach the operator as `Unexpected token '<'` — a parse
  // error about a file that was never served. `http.ts` records why a 200 does not mean it is there.
  const text = await response.text();
  if (looksLikeMarkupNotJson(text)) {
    throw new Error(
      `could not load the framework crosswalk — ${markupInsteadOfJsonDetail(
        url,
        response.headers?.get('content-type')
      )}`
    );
  }
  let doc: CrosswalkFile;
  try {
    doc = JSON.parse(stripBom(text)) as CrosswalkFile;
  } catch (err) {
    throw new Error(
      `the framework crosswalk at ${url} is served but is not valid JSON ` +
        `(${err instanceof Error ? err.message : String(err)})`
    );
  }

  if (!isPlainObject(doc.meta) || !isPlainObject(doc.frameworks)) {
    throw new Error('crosswalk.json is missing meta or frameworks');
  }
  for (const id of FRAMEWORK_ORDER) {
    const fw = doc.frameworks[id];
    if (!fw || !isPlainObject(fw.controls) || Object.keys(fw.controls).length === 0) {
      throw new Error(`crosswalk.json has no controls for ${id}`);
    }
  }
  if (!Array.isArray(doc.vulnerability_classes) || doc.vulnerability_classes.length === 0) {
    throw new Error('crosswalk.json has no vulnerability classes');
  }
  if (!Array.isArray(doc.mitigation_classes) || !Array.isArray(doc.risk_metric_map)) {
    throw new Error('crosswalk.json is missing mitigation classes or the risk metric map');
  }
  return doc;
}

/** Total controls across all five frameworks — the denominator of the coverage figure. */
export function totalControls(doc: CrosswalkFile): number {
  return FRAMEWORK_ORDER.reduce((sum, id) => sum + Object.keys(doc.frameworks[id].controls).length, 0);
}
