/**
 * Feature construction for browser inference.
 *
 * The vocabularies and orderings in this file are transcriptions of ml/build_dataset.py.
 * They are duplicated rather than derived because the browser has no access to the Python
 * module — and duplication is safe only because `engine.ts` asserts, at load time, that the
 * names generated here are identical to the `feature_names` recorded inside the model file.
 * If anyone edits one side without the other, the app refuses the model instead of scoring
 * against shifted columns.
 *
 * The harder problem this file solves is honesty about *availability*. The exploitation
 * model was fitted on NVD records, which always carry a CVSS vector, reference tags and a
 * publication date. A vulnerability scan may carry none of those. Rather than substitute
 * plausible values — which would produce a confident probability with nothing behind it —
 * every builder returns a provenance record saying which columns came from the scan and
 * which did not, and `canScoreExploitation` refuses findings that are too thin to score.
 */
import type { CvssBaseMetrics } from './cvss';
import { parseCvssVector } from './cvss';
import type { Classification, VulnClass } from './crosswalk';
import { buildCweIndex, classifyFinding, extractCweIds } from './crosswalk';

// --------------------------------------------------------------------------- //
// exploitation vocabulary — ml/build_dataset.py:48
// --------------------------------------------------------------------------- //
export const NUMERIC_FEATURES = [
  'base_score',
  'exploitability_score',
  'impact_score',
  'log_ref_count',
  'cwe_count',
  'age_days_log',
  'epss',
  'epss_percentile',
  'epss_velocity_90d',
  'epss_max_to_date',
] as const;

/** Insertion order matters: Python iterates the dict, so this is the column order. */
export const CVSS_CATEGORICALS: readonly [keyof CvssBaseMetrics, readonly string[]][] = [
  ['attackVector', ['NETWORK', 'ADJACENT_NETWORK', 'LOCAL', 'PHYSICAL']],
  ['attackComplexity', ['LOW', 'HIGH']],
  ['privilegesRequired', ['NONE', 'LOW', 'HIGH']],
  ['userInteraction', ['NONE', 'REQUIRED']],
  ['scope', ['UNCHANGED', 'CHANGED']],
  ['confidentialityImpact', ['HIGH', 'LOW', 'NONE']],
  ['integrityImpact', ['HIGH', 'LOW', 'NONE']],
  ['availabilityImpact', ['HIGH', 'LOW', 'NONE']],
];

export const REF_TAGS = [
  'Exploit',
  'Patch',
  'Mitigation',
  'Vendor Advisory',
  'Third Party Advisory',
  'VDB Entry',
  'Technical Description',
  'Press/Media Coverage',
  'Mailing List',
  'Issue Tracking',
  'Release Notes',
  'Product',
  'Permissions Required',
  'Broken Link',
  'Not Applicable',
] as const;

export function exploitFeatureNames(vulnKeys: string[]): string[] {
  const names: string[] = [...NUMERIC_FEATURES];
  for (const [field, values] of CVSS_CATEGORICALS) {
    for (const value of values) names.push(`${field}=${value}`);
  }
  for (const tag of REF_TAGS) names.push(`reftag=${tag}`);
  for (const key of vulnKeys) names.push(`vulnclass=${key}`);
  names.push('vulnclass=unmatched');
  return names;
}

// --------------------------------------------------------------------------- //
// severity vocabulary — ml/build_dataset.py:335
// --------------------------------------------------------------------------- //
export const ACTORS = ['external', 'internal', 'partner'] as const;
export const ACTIONS = ['hacking', 'malware', 'error', 'misuse', 'physical', 'social', 'environmental'] as const;
export const ASSET_KINDS = ['S', 'M', 'U', 'P', 'N', 'T', 'K', 'E'] as const;
export const ATTRIBUTES = ['confidentiality', 'integrity', 'availability'] as const;
export const EMPLOYEE_BANDS = [
  '1 to 10',
  '11 to 100',
  '101 to 1000',
  '1001 to 10000',
  '10001 to 25000',
  '25001 to 50000',
  '50001 to 100000',
  'Over 100000',
  'Small',
  'Large',
  'Unknown',
] as const;
export const NAICS2 = [
  '11', '21', '22', '23', '31', '32', '33', '42', '44', '45', '48', '49',
  '51', '52', '53', '54', '55', '56', '61', '62', '71', '72', '81', '92',
] as const;
export const DISCOVERY = ['external', 'internal', 'partner', 'other', 'unknown'] as const;

export type VerisAction = (typeof ACTIONS)[number];
export type VerisAttribute = (typeof ATTRIBUTES)[number];
export type EmployeeBand = (typeof EMPLOYEE_BANDS)[number];

export function severityFeatureNames(): string[] {
  const names = [
    'incident_year',
    'log_data_total',
    'n_data_varieties',
    'n_assets',
    'n_action_kinds',
    'employee_band_ordinal',
  ];
  for (const a of ACTORS) names.push(`actor=${a}`);
  for (const a of ACTIONS) names.push(`action=${a}`);
  for (const a of ASSET_KINDS) names.push(`asset=${a}`);
  names.push('asset=other');
  for (const a of ATTRIBUTES) names.push(`attribute=${a}`);
  for (const b of EMPLOYEE_BANDS) names.push(`employees=${b}`);
  for (const n of NAICS2) names.push(`naics=${n}`);
  names.push('naics=other');
  for (const d of DISCOVERY) names.push(`discovery=${d}`);
  return names;
}

// --------------------------------------------------------------------------- //
// scan enrichment — the fields a real scanner emits beyond a bare base score
// --------------------------------------------------------------------------- //
/**
 * Optional per-finding fields. Every one of these is a published fact about the CVE rather
 * than a judgement, and `ml/enrich_scan.py` fills them from data/raw/ so the values in a
 * scan file trace back to NVD and EPSS rather than to anyone's recollection.
 */
export interface FindingEnrichment {
  /** CVSS v3.x base vector, e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H". */
  cvss_vector?: string;
  cwe_ids?: string[];
  /** NVD publication timestamp; drives the age feature. */
  published_date?: string;
  /** NVD reference tags, e.g. ["Exploit", "Vendor Advisory"]. */
  reference_tags?: string[];
  reference_count?: number;
  epss_percentile?: number;
  epss_velocity_90d?: number;
  epss_max_to_date?: number;
}

export interface EnrichmentProvenance {
  /** Where the enrichment came from, copied verbatim from the scan file if present. */
  source?: string;
  generated_at?: string;
  nvd_records_matched?: number;
  epss_snapshot?: string;
}

/** Per-column accounting so the UI can state what the probability actually rests on. */
export interface FeatureProvenance {
  observed: string[];
  unobserved: string[];
  /** Fraction of columns filled from scan data rather than the no-signal convention. */
  completeness: number;
  notes: string[];
}

export interface ExploitationRow {
  row: number[];
  provenance: FeatureProvenance;
  classification: Classification;
  cvssVectorParsed: boolean;
}

export interface ExploitationInput {
  cvss_score: number;
  epss_score: number;
  vulnerability_name: string;
  description: string;
  enrichment: FindingEnrichment;
  /** Date the features are computed as of — the scan date, not today. */
  asOf: Date;
}

/**
 * A finding is scoreable when the CVSS vector is present, because that single field fills
 * twenty-four of the sixty-six columns exactly and none of them can be recovered from the
 * base score alone. Without it the platform uses the deterministic fallback and says so.
 */
export function canScoreExploitation(enrichment: FindingEnrichment): boolean {
  return parseCvssVector(enrichment.cvss_vector) !== null;
}

/**
 * Resolve a finding to a vulnerability class without building a feature row.
 *
 * The compliance mapping needs a class for *every* finding, including the ones the model
 * refuses to score for want of a CVSS vector — a finding still implicates ISO A.8.8 whether
 * or not its exploitation probability could be estimated. This function is the classification
 * half of `buildExploitationRow`, factored out so the two cannot drift: note in particular
 * that when CWEs are present the keyword haystack is the CWE string and not the description,
 * which is what `buildExploitationRow` does and therefore what training did.
 */
export function classifyFindingFromScan(
  input: { vulnerability_name: string; description: string; enrichment?: FindingEnrichment },
  vulnClasses: VulnClass[],
  cweIndex?: Map<string, string>
): Classification {
  const index = cweIndex ?? buildCweIndex(vulnClasses);
  const e = input.enrichment ?? {};
  let cwes = (e.cwe_ids ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean);
  let cwesFromText = false;
  if (cwes.length === 0) {
    cwes = extractCweIds(`${input.vulnerability_name} ${input.description}`);
    cwesFromText = cwes.length > 0;
  }
  return classifyFinding(
    index,
    vulnClasses,
    cwes,
    cwes.length > 0 ? cwes.join(' ') : `${input.vulnerability_name} ${input.description}`,
    cwesFromText
  );
}

export function buildExploitationRow(
  input: ExploitationInput,
  vulnClasses: VulnClass[],
  cweIndex?: Map<string, string>
): ExploitationRow {
  const index = cweIndex ?? buildCweIndex(vulnClasses);
  const e = input.enrichment;
  const observed: string[] = ['base_score', 'epss'];
  const unobserved: string[] = [];
  const notes: string[] = [];

  const parsed = parseCvssVector(e.cvss_vector);
  if (parsed) {
    observed.push('CVSS base sub-vectors (22 columns)', 'exploitability_score', 'impact_score');
    if (Math.abs(parsed.baseScore - input.cvss_score) > 0.05) {
      notes.push(
        `the scan reports CVSS ${input.cvss_score.toFixed(1)} but its vector computes to ` +
          `${parsed.baseScore.toFixed(1)}; the vector is used for the sub-scores and the scan value for base_score`
      );
    }
  } else {
    unobserved.push('CVSS base sub-vectors (22 columns)', 'exploitability_score', 'impact_score');
  }

  // CWE: an explicit list is the assigner's assertion. Falling back to identifiers embedded
  // in the description recovers a real assertion the scanner buried in prose; keyword
  // matching after that is an inference, and `classification.method` records which happened.
  let cwes = (e.cwe_ids ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean);
  let cwesFromText = false;
  if (cwes.length === 0) {
    cwes = extractCweIds(`${input.vulnerability_name} ${input.description}`);
    cwesFromText = cwes.length > 0;
  }
  if (cwes.length > 0) observed.push('cwe_count', 'vulnerability class (19 columns)');
  else unobserved.push('cwe_count');

  const classification = classifyFinding(
    index,
    vulnClasses,
    cwes,
    cwes.length > 0 ? cwes.join(' ') : `${input.vulnerability_name} ${input.description}`,
    cwesFromText
  );
  if (cwes.length === 0) {
    if (classification.key) {
      observed.push('vulnerability class (19 columns, keyword match)');
      notes.push(
        `vulnerability class "${classification.key}" was matched on the keyword ` +
          `"${classification.matched}", not on an assigned CWE`
      );
    } else {
      unobserved.push('vulnerability class (19 columns)');
    }
  }

  const refCount = typeof e.reference_count === 'number' ? e.reference_count : (e.reference_tags?.length ?? 0);
  if (typeof e.reference_count === 'number') observed.push('log_ref_count');
  else unobserved.push('log_ref_count');

  const tags = new Set((e.reference_tags ?? []).map((t) => t.trim()));
  if (tags.size > 0) observed.push('NVD reference tags (15 columns)');
  else unobserved.push('NVD reference tags (15 columns)');

  // Training convention: a CVE with no EPSS snapshot on or before the anchor gets zeros,
  // because at that moment the platform genuinely had no EPSS signal. The same convention is
  // applied here rather than inventing a history — except for max_to_date, where the current
  // score is a hard lower bound and using it is strictly more accurate than zero.
  let ageDaysLog = 0;
  if (e.published_date) {
    const published = new Date(e.published_date);
    if (!Number.isNaN(published.getTime())) {
      const days = Math.max(0, (input.asOf.getTime() - published.getTime()) / 86400000);
      ageDaysLog = Math.log1p(Math.floor(days));
      observed.push('age_days_log');
    } else {
      unobserved.push('age_days_log');
    }
  } else {
    unobserved.push('age_days_log');
  }

  const epss = input.epss_score;
  const percentile = typeof e.epss_percentile === 'number' ? e.epss_percentile : 0;
  if (typeof e.epss_percentile === 'number') observed.push('epss_percentile');
  else unobserved.push('epss_percentile');

  const velocity = typeof e.epss_velocity_90d === 'number' ? e.epss_velocity_90d : 0;
  if (typeof e.epss_velocity_90d === 'number') observed.push('epss_velocity_90d');
  else {
    unobserved.push('epss_velocity_90d');
    notes.push('no EPSS history in the scan, so 90-day velocity is zero — the training convention for "no signal"');
  }

  const maxToDate = typeof e.epss_max_to_date === 'number' ? Math.max(e.epss_max_to_date, epss) : epss;
  if (typeof e.epss_max_to_date === 'number') observed.push('epss_max_to_date');

  const numeric = [
    input.cvss_score,
    parsed ? parsed.exploitabilityScore : 0,
    parsed ? parsed.impactScore : 0,
    Math.log1p(refCount),
    cwes.length,
    ageDaysLog,
    epss,
    percentile,
    velocity,
    maxToDate,
  ];

  const cats: number[] = [];
  for (const [field, values] of CVSS_CATEGORICALS) {
    const actual = parsed ? parsed[field] : '';
    for (const value of values) cats.push(actual === value ? 1 : 0);
  }

  const tagFlags = REF_TAGS.map((t) => (tags.has(t) ? 1 : 0));

  const classFlags = vulnClasses.map((c) => (classification.key === c.key ? 1 : 0));
  classFlags.push(classification.key === null ? 1 : 0);

  const row = [...numeric, ...cats, ...tagFlags, ...classFlags];
  // 24 sub-vector + sub-score columns, 15 tag columns, 19 class columns, 8 remaining numerics.
  const filled = 66 - (parsed ? 0 : 24) - (tags.size > 0 ? 0 : 15) - (classification.key === null ? 19 : 0);
  return {
    row,
    provenance: { observed, unobserved, completeness: filled / 66, notes },
    classification,
    cvssVectorParsed: parsed !== null,
  };
}

// --------------------------------------------------------------------------- //
// severity translation — scan finding -> VERIS coding
// --------------------------------------------------------------------------- //
/**
 * The severity model was fitted on VERIS-coded incidents, so using it on a scan finding
 * requires translating "this asset has this weakness" into "an incident of this shape". That
 * translation is a modelling decision, not a measurement, and it is written out in full here
 * so a reviewer can disagree with a specific row rather than with a black box. Everything in
 * this section is surfaced in the UI under the severity figure.
 *
 * Three codings are fixed rather than derived, each for a stated reason:
 *   actor = external     the modal VERIS actor for exploitation of an internet-reachable
 *                        weakness; internal misuse is a different risk this scan cannot see
 *   discovery = internal the finding was in fact found by the organisation's own scan, so
 *                        this one is an observation rather than an assumption
 *   n_assets = 1         one finding is scored against one asset
 */
export interface OrgProfile {
  employeeBand: EmployeeBand;
  /** Two-digit NAICS. Empty string maps to the `naics=other` column. */
  naics2: string;
  sectorLabel: string;
}

export const DEFAULT_ORG_PROFILE: OrgProfile = {
  employeeBand: 'Unknown',
  naics2: '',
  sectorLabel: 'Not specified',
};

/** NAICS sector codes present in the training vocabulary, with plain-language labels. */
export const SECTOR_OPTIONS: { naics2: string; label: string }[] = [
  { naics2: '61', label: 'Educational services' },
  { naics2: '52', label: 'Finance and insurance' },
  { naics2: '62', label: 'Health care and social assistance' },
  { naics2: '51', label: 'Information and telecoms' },
  { naics2: '54', label: 'Professional and technical services' },
  { naics2: '92', label: 'Public administration' },
  { naics2: '44', label: 'Retail trade' },
  { naics2: '31', label: 'Manufacturing' },
  { naics2: '22', label: 'Utilities' },
  { naics2: '48', label: 'Transportation' },
  { naics2: '', label: 'Other / not specified' },
];

interface VerisMapping {
  actions: VerisAction[];
  attributes: VerisAttribute[];
}

/**
 * Vulnerability class -> VERIS action and attribute codings. Attributes follow the CIA
 * consequence of the weakness class; actions follow how such a weakness is exercised.
 */
const VULN_CLASS_TO_VERIS: Record<string, VerisMapping> = {
  rce_injection: { actions: ['hacking'], attributes: ['confidentiality', 'integrity', 'availability'] },
  deserialization: { actions: ['hacking'], attributes: ['integrity', 'availability'] },
  sql_injection: { actions: ['hacking'], attributes: ['confidentiality', 'integrity'] },
  path_traversal_upload: { actions: ['hacking'], attributes: ['confidentiality', 'integrity'] },
  auth_bypass: { actions: ['hacking'], attributes: ['confidentiality', 'integrity'] },
  authz_broken_access: { actions: ['hacking'], attributes: ['confidentiality'] },
  privilege_escalation: { actions: ['hacking'], attributes: ['integrity', 'confidentiality'] },
  memory_corruption: { actions: ['hacking'], attributes: ['availability', 'integrity'] },
  credential_exposure: { actions: ['hacking'], attributes: ['confidentiality'] },
  crypto_transport: { actions: ['hacking'], attributes: ['confidentiality'] },
  misconfiguration: { actions: ['hacking', 'error'], attributes: ['confidentiality'] },
  info_disclosure: { actions: ['hacking'], attributes: ['confidentiality'] },
  web_client_side: { actions: ['hacking', 'social'], attributes: ['confidentiality', 'integrity'] },
  ssrf_xxe: { actions: ['hacking'], attributes: ['confidentiality'] },
  supply_chain: { actions: ['hacking', 'malware'], attributes: ['integrity', 'confidentiality'] },
  dos_resource: { actions: ['hacking'], attributes: ['availability'] },
  race_condition: { actions: ['hacking'], attributes: ['integrity'] },
  malware_ransomware: { actions: ['malware', 'hacking'], attributes: ['availability', 'integrity'] },
};

/** Fallback for an unmatched class: the least specific coding the model can still use. */
const DEFAULT_VERIS: VerisMapping = { actions: ['hacking'], attributes: ['confidentiality'] };

/** Platform asset type -> VERIS asset variety prefix. */
const ASSET_TYPE_TO_VERIS: Record<string, string> = {
  Database: 'S',
  Application: 'S',
  Server: 'S',
  Infrastructure: 'S',
  Identity: 'S',
  Network: 'N',
  Endpoint: 'U',
  'User Device': 'U',
  Media: 'M',
  Embedded: 'E',
  IoT: 'E',
  Kiosk: 'K',
  Terminal: 'T',
};

export interface SeverityInput {
  vulnClassKey: string | null;
  assetType: string;
  /** Records exposed if the weakness is exercised. Absent is a real VERIS value, not zero-as-unknown. */
  recordsAtRisk?: number;
  incidentYear: number;
  org: OrgProfile;
}

export interface SeverityRow {
  row: number[];
  provenance: FeatureProvenance;
  coding: { actions: VerisAction[]; attributes: VerisAttribute[]; assetKind: string };
}

export function buildSeverityRow(input: SeverityInput): SeverityRow {
  const mapping = (input.vulnClassKey && VULN_CLASS_TO_VERIS[input.vulnClassKey]) || DEFAULT_VERIS;
  const assetKind = ASSET_TYPE_TO_VERIS[input.assetType] ?? 'other';
  const observed: string[] = ['incident_year', 'n_assets', 'discovery=internal'];
  const unobserved: string[] = [];
  const notes: string[] = [
    'actor coded as external and discovery as internal — see the translation table in src/model/features.ts',
  ];

  if (input.vulnClassKey) observed.push('VERIS action and attribute coding');
  else {
    unobserved.push('VERIS action and attribute coding');
    notes.push('vulnerability class unresolved, so the least specific coding (hacking / confidentiality) was used');
  }
  if (ASSET_TYPE_TO_VERIS[input.assetType]) observed.push('asset variety');
  else unobserved.push('asset variety');

  const dataTotal = typeof input.recordsAtRisk === 'number' ? input.recordsAtRisk : 0;
  if (typeof input.recordsAtRisk === 'number') observed.push('log_data_total');
  else {
    unobserved.push('log_data_total');
    notes.push('no record count supplied, so data volume is zero — as it is for the many VCDB incidents with no recorded count');
  }

  const band: EmployeeBand = EMPLOYEE_BANDS.includes(input.org.employeeBand) ? input.org.employeeBand : 'Unknown';
  if (band !== 'Unknown') observed.push('organisation size band');
  else unobserved.push('organisation size band');
  if (NAICS2.includes(input.org.naics2 as (typeof NAICS2)[number])) observed.push('industry sector');
  else unobserved.push('industry sector');

  // n_data_varieties is a COUNT at training time — len(attribute.confidentiality.data) in
  // ml/build_dataset.py, the number of distinct VERIS data varieties an incident compromised
  // (Personal, Payment, Credentials, ...). A scan finding cannot observe that, so the value here
  // is a floor: 0 varieties when the weakness class has no confidentiality consequence, and 1 —
  // the smallest non-zero count — when it has one. Writing it as a bare `? 1 : 0` made it read
  // like a one-hot flag, which it is not; the name and the comment are the only things standing
  // between this column and a silent train/serve skew, so both are load-bearing.
  const dataVarietiesFloor = mapping.attributes.includes('confidentiality') ? 1 : 0;
  if (dataVarietiesFloor > 0) {
    unobserved.push('number of data varieties');
    notes.push(
      'the weakness class has a confidentiality consequence, but a scan cannot say how many data ' +
        'varieties would be exposed, so the count is floored at one — the severity figure is a ' +
        'lower bound in that respect'
    );
  }

  const numeric = [
    input.incidentYear,
    Math.log1p(dataTotal),
    dataVarietiesFloor,
    SEVERITY_ASSETS_PER_FINDING,
    mapping.actions.length,
    EMPLOYEE_BANDS.indexOf(band),
  ];

  const flags: number[] = [];
  for (const a of ACTORS) flags.push(a === 'external' ? 1 : 0);
  for (const a of ACTIONS) flags.push(mapping.actions.includes(a) ? 1 : 0);
  for (const k of ASSET_KINDS) flags.push(assetKind === k ? 1 : 0);
  flags.push(assetKind === 'other' ? 1 : 0);
  for (const a of ATTRIBUTES) flags.push(mapping.attributes.includes(a) ? 1 : 0);
  for (const b of EMPLOYEE_BANDS) flags.push(band === b ? 1 : 0);
  for (const n of NAICS2) flags.push(input.org.naics2 === n ? 1 : 0);
  flags.push(NAICS2.includes(input.org.naics2 as (typeof NAICS2)[number]) ? 0 : 1);
  for (const d of DISCOVERY) flags.push(d === 'internal' ? 1 : 0);

  const total = observed.length + unobserved.length;
  return {
    row: [...numeric, ...flags],
    provenance: { observed, unobserved, completeness: total ? observed.length / total : 0, notes },
    coding: { actions: mapping.actions, attributes: mapping.attributes, assetKind },
  };
}

/** The fixed codings, for display next to any figure derived from the severity model. */
export const SEVERITY_TRANSLATION_NOTES = [
  'actor = external: the modal VERIS actor for exploitation of a reachable weakness.',
  'discovery = internal: the finding was produced by the organisation\'s own scan.',
  'n_assets = 1: each finding is scored against the single asset it was found on.',
  'n_data_varieties is floored at 1 where the weakness touches confidentiality: a scan cannot ' +
    'say how many kinds of data would be exposed, and the training column counted them.',
  'action and attribute codings are derived from the vulnerability class, not observed.',
  'The model returns log10 USD; conversion to rupees uses the rate shown beside the figure.',
];

/** One finding is scored against one asset. Named so the constant is greppable from both sides. */
export const SEVERITY_ASSETS_PER_FINDING = 1;

/**
 * Where the browser's severity row cannot mean the same thing as the training column, said out
 * loud and in a form a harness can check.
 *
 * The feature-name comparison in engine.ts catches a column that moved or was renamed. It cannot
 * catch a column that kept its name and changed its meaning, which is the more dangerous failure
 * because nothing reports it — the trees just receive a number from a distribution they were never
 * fitted on. Every such column has to appear here, and scripts/check-engine.cjs asserts that the
 * row a scan produces respects the stated domain.
 */
export interface ColumnSubstitution {
  /** Index into the severity feature vector. */
  index: number;
  name: string;
  /** What ml/build_dataset.py put in this column. */
  training: string;
  /** What a scan finding can supply instead. */
  browser: string;
  /** Why the substitution is defensible, and which way it biases the figure. */
  reason: string;
  /** Inclusive bounds the browser value must stay inside. */
  domain: [number, number];
}

export const SEVERITY_COLUMN_SUBSTITUTIONS: ColumnSubstitution[] = [
  {
    index: 2,
    name: 'n_data_varieties',
    training: 'count of VERIS data varieties compromised, len(attribute.confidentiality.data)',
    browser: '0 where the weakness class has no confidentiality consequence, otherwise 1',
    reason:
      'a scan observes a weakness, not a breach, so the varieties are unknowable; flooring at the ' +
      'smallest non-zero count biases the severity estimate downward rather than upward',
    domain: [0, 1],
  },
  {
    index: 3,
    name: 'n_assets',
    training: 'count of assets involved in the incident, len(assets)',
    browser: 'always 1',
    reason:
      'each finding is scored against the one asset it was found on; a real incident may spread ' +
      'further, so this also biases downward',
    domain: [SEVERITY_ASSETS_PER_FINDING, SEVERITY_ASSETS_PER_FINDING],
  },
  {
    index: 0,
    name: 'incident_year',
    training: 'the year the incident occurred',
    browser: 'the year of the scan',
    reason:
      'asks the model what an incident of this shape would cost now rather than when the training ' +
      'incidents happened; the year column is how the model carries loss inflation',
    domain: [1990, 2100],
  },
];
