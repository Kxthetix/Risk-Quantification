/**
 * ============================================================================
 * SCAN INGEST VALIDATION (SIH 2026 Problem Statement 105)
 * ============================================================================
 *
 * One door into the pipeline. `processScanData` calls this before it reads a single field, so
 * every caller — the upload view, the bundled-sample button, every harness — gets the same
 * treatment of the same malformed file.
 *
 * The rule the whole module follows: **a scan is either refused with a reason, or accepted with
 * its repairs written down.** Nothing in between. What it must never do is what the previous
 * code did:
 *
 *   - An asset value of `"1,00,000"` (a string, which is what a spreadsheet export gives you)
 *     produced `expected_loss_inr: NaN`, and every rupee figure in the app rendered `₹NaN`.
 *     No error, no banner — the app looked like it was working.
 *   - A missing `epss_score` did the same thing.
 *   - An `epss_score` of `42` — a tool exporting EPSS as a percentage instead of a probability,
 *     which is a common real export bug — multiplied the portfolio's stated exposure by 43 and
 *     said nothing.
 *   - A finding whose `asset_id` matched nothing in the inventory was silently given an invented
 *     asset worth ₹2,00,00,000. Eighteen such findings produced ₹5.33 Cr of "exposure" out of a
 *     hard-coded constant. That is fabricated data reaching a board report.
 *   - `assets` arriving as an object rather than an array crashed with
 *     "raw.assets.forEach is not a function", which tells an operator nothing.
 *
 * Severity means exactly one thing here:
 *   `error`   — a stated figure was unusable, so a number the platform reports is now a LOWER
 *               bound or is missing entirely. Must be shown next to the figures.
 *   `warning` — a descriptive field was defaulted. The money is unaffected.
 *
 * Repairs never invent a quantity. An unusable value becomes zero and is counted, because zero
 * with a footnote understates, and understating is visible in the report; a plausible-looking
 * substitute is not.
 */
import type {
  RawAsset,
  RawCandidateInvestment,
  RawFinding,
  ScanData,
  ScanMetadata,
} from './riskUtils';

/** One repair, or one refusal to repair, aggregated across every record it applied to. */
export interface DataQualityIssue {
  severity: 'error' | 'warning';
  /** Stable identifier, safe to switch on. Never rendered raw. */
  code: string;
  /** One sentence: what was found, and what the platform did about it. */
  message: string;
  count: number;
  /** Up to five affected record ids, so an operator can find them in the file. */
  sample: string[];
}

/**
 * What the ingest did to this file. Travels on `ProcessedScanResult` so no view can render the
 * figures without also holding the caveats that belong to them — the same reason
 * `ModelReport` lives there rather than being fetched separately.
 */
export interface DataQualityReport {
  issues: DataQualityIssue[];
  errorCount: number;
  warningCount: number;
  /** Assets in the inventory after normalisation (duplicates dropped). */
  assetsAccepted: number;
  /** Of those, how many state a usable value. Only these can carry a rupee figure. */
  assetsWithStatedValue: number;
  findingsAccepted: number;
  /**
   * Findings that resolve to an asset with a stated value. The rest contribute ₹0 to every
   * total — not because they are harmless, but because nothing in the file says what they
   * could cost. `findingsAccepted - findingsQuantifiable` is the size of that gap.
   */
  findingsQuantifiable: number;
  controlsAccepted: number;
  /** Candidate controls dropped because they could not be budgeted at all. */
  controlsDropped: number;
}

/**
 * Thrown when the file cannot be read as a scan at all — a shape problem, not a value problem.
 *
 * Carries the list of specific problems rather than one sentence, because a hand-edited scan
 * usually has several and finding them one upload at a time is miserable.
 */
export class ScanRejected extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(
      problems.length === 1
        ? `This file cannot be read as a scan: ${problems[0]}`
        : `This file cannot be read as a scan. ${problems.length} problems: ${problems.join(' ')}`
    );
    this.name = 'ScanRejected';
    this.problems = problems;
  }
}

const CRITICALITY_BANDS: RawAsset['business_criticality'][] = ['Critical', 'High', 'Medium', 'Low'];
const SAMPLE_LIMIT = 5;

/** Collects issues so each code is reported once with a count, not once per record. */
class IssueLog {
  private readonly byCode = new Map<string, DataQualityIssue>();

  add(severity: DataQualityIssue['severity'], code: string, message: string, id: string): void {
    const existing = this.byCode.get(code);
    if (existing) {
      existing.count += 1;
      if (existing.sample.length < SAMPLE_LIMIT) existing.sample.push(id);
      return;
    }
    this.byCode.set(code, { severity, code, message, count: 1, sample: [id] });
  }

  /** Errors first, then by descending count: the order an operator should fix them in. */
  list(): DataQualityIssue[] {
    return [...this.byCode.values()].sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
      return b.count - a.count;
    });
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isFinite_ = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const str = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Structural gate. Everything checked here makes the file unreadable rather than merely wrong,
 * so it is refused instead of repaired — there is no honest default for "findings is a string".
 */
function structuralProblems(doc: unknown): string[] {
  const problems: string[] = [];
  if (!isObject(doc)) {
    return [
      `the top level is ${Array.isArray(doc) ? 'an array' : describeType(doc)}, but a scan is a JSON object with "assets" and "findings".`,
    ];
  }
  for (const key of ['assets', 'findings'] as const) {
    if (!(key in doc)) problems.push(`"${key}" is missing; it must be an array.`);
    else if (!Array.isArray(doc[key])) problems.push(`"${key}" is ${describeType(doc[key])}, but it must be an array.`);
  }
  if ('candidate_investments' in doc && !Array.isArray(doc.candidate_investments)) {
    problems.push(`"candidate_investments" is ${describeType(doc.candidate_investments)}, but it must be an array (or absent).`);
  }
  if ('scan_metadata' in doc && !isObject(doc.scan_metadata)) {
    problems.push(`"scan_metadata" is ${describeType(doc.scan_metadata)}, but it must be an object (or absent).`);
  }
  for (const key of ['assets', 'findings', 'candidate_investments'] as const) {
    const arr = doc[key];
    if (!Array.isArray(arr)) continue;
    const badIndexes = arr
      .map((entry, i) => (isObject(entry) ? -1 : i))
      .filter((i) => i >= 0)
      .slice(0, SAMPLE_LIMIT);
    if (badIndexes.length > 0) {
      problems.push(`"${key}" contains entries that are not objects, at index ${badIndexes.join(', ')}.`);
    }
  }
  return problems;
}

function describeType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  if (typeof v === 'string') return 'a string';
  if (typeof v === 'number') return 'a number';
  if (typeof v === 'boolean') return 'a boolean';
  if (typeof v === 'object') return 'an object';
  if (v === undefined) return 'absent';
  return `a ${typeof v}`;
}

/**
 * Accept the scan, or refuse it with reasons. Returns a normalised copy — the caller's object is
 * never mutated, because the upload view keeps the raw scan to re-derive the result when an
 * assumption changes, and a silently repaired original would make the two disagree.
 */
export function validateAndNormalizeScan(doc: unknown): { scan: ScanData; quality: DataQualityReport } {
  const problems = structuralProblems(doc);
  if (problems.length > 0) throw new ScanRejected(problems);

  const raw = doc as Record<string, unknown>;
  const log = new IssueLog();

  const assets = normalizeAssets(raw.assets as unknown[], log);
  const assetIds = new Set(assets.map((a) => a.asset_id));
  const findings = normalizeFindings(raw.findings as unknown[], assetIds, log);
  const findingIds = new Set(findings.map((f) => f.finding_id));
  const { controls, dropped } = normalizeControls(
    Array.isArray(raw.candidate_investments) ? raw.candidate_investments : [],
    findingIds,
    log
  );
  if (!('candidate_investments' in raw)) {
    log.add(
      'warning',
      'controls_absent',
      'The scan states no candidate controls, so the investment optimiser has nothing to select from.',
      'candidate_investments'
    );
  }

  const scanMetadata = normalizeMetadata(raw.scan_metadata, assets.length, findings.length, log);

  const scan: ScanData = {
    scan_metadata: scanMetadata,
    assets,
    findings,
    candidate_investments: controls,
  };
  // Copied only when present and shaped like a statement of provenance. An `enrichment_provenance`
  // of the wrong type would reach the banner and both exports, where it is printed as the source of
  // the CVSS vectors — an unreadable source claim is worse than none.
  if (isObject(raw.enrichment_provenance)) {
    scan.enrichment_provenance = raw.enrichment_provenance as ScanData['enrichment_provenance'];
  } else if ('enrichment_provenance' in raw) {
    log.add(
      'warning',
      'enrichment_provenance_unreadable',
      'The scan carries an "enrichment_provenance" block that is not an object, so the source of its CVSS vectors is reported as unstated rather than guessed.',
      'enrichment_provenance'
    );
  }

  const withStatedValue = assets.filter((a) => a.estimated_asset_value_inr > 0);
  const statedValueIds = new Set(withStatedValue.map((a) => a.asset_id));
  const quantifiable = findings.filter((f) => statedValueIds.has(f.asset_id)).length;
  const issues = log.list();

  return {
    scan,
    quality: {
      issues,
      errorCount: issues.filter((i) => i.severity === 'error').length,
      warningCount: issues.filter((i) => i.severity === 'warning').length,
      assetsAccepted: assets.length,
      assetsWithStatedValue: withStatedValue.length,
      findingsAccepted: findings.length,
      findingsQuantifiable: quantifiable,
      controlsAccepted: controls.length,
      controlsDropped: dropped,
    },
  };
}

function normalizeAssets(entries: unknown[], log: IssueLog): RawAsset[] {
  const out: RawAsset[] = [];
  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    const row = entry as Record<string, unknown>;
    let id = str(row.asset_id);
    if (id === null) {
      id = `ASSET-${index + 1}`;
      log.add('error', 'asset_id_missing', 'An asset states no "asset_id", so findings cannot be attributed to it and it was given a positional identifier.', id);
    }
    // First declaration wins. Last-wins (the previous `Map.set` behaviour) makes the figures depend
    // on the order rows happen to appear in, which is not a property of the estate being measured.
    if (seen.has(id)) {
      log.add('error', 'asset_id_duplicate', 'Two or more assets share an "asset_id". Only the first declaration of each is used, so the later rows contribute no value to the portfolio.', id);
      return;
    }
    seen.add(id);

    const name = str(row.asset_name);
    if (name === null) log.add('warning', 'asset_name_missing', 'An asset states no "asset_name" and is labelled by its identifier.', id);
    const type = str(row.asset_type);
    if (type === null) log.add('warning', 'asset_type_missing', 'An asset states no "asset_type". It is treated as General, which changes which VERIS loss comparison set the severity model uses.', id);

    let criticality = CRITICALITY_BANDS.find((b) => b.toLowerCase() === String(row.business_criticality).trim().toLowerCase());
    if (criticality === undefined) {
      criticality = 'Medium';
      log.add('warning', 'criticality_unknown', `An asset states a "business_criticality" outside Critical/High/Medium/Low. It is weighted as Medium.`, id);
    }

    let value = 0;
    if (isFinite_(row.estimated_asset_value_inr) && row.estimated_asset_value_inr > 0) {
      value = row.estimated_asset_value_inr;
    } else {
      log.add('error', 'asset_value_unusable', 'An asset states no usable "estimated_asset_value_inr" (missing, non-numeric, zero or negative). Its findings carry ₹0 expected loss, so every rupee total is a LOWER bound until the value is stated.', id);
    }

    const asset: RawAsset = {
      asset_id: id,
      asset_name: name ?? `Unnamed asset (${id})`,
      asset_type: type ?? 'General',
      business_criticality: criticality,
      estimated_asset_value_inr: value,
      data_sensitivity: str(row.data_sensitivity) ?? 'Unstated',
    };
    if (row.records_at_risk !== undefined) {
      if (isFinite_(row.records_at_risk) && row.records_at_risk >= 0) asset.records_at_risk = row.records_at_risk;
      else log.add('warning', 'records_at_risk_unusable', 'An asset states a "records_at_risk" that is not a non-negative number. It is treated as unstated rather than as zero records.', id);
    }
    out.push(asset);
  });

  return out;
}

function normalizeFindings(entries: unknown[], assetIds: Set<string>, log: IssueLog): RawFinding[] {
  const out: RawFinding[] = [];
  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    const row = entry as Record<string, unknown>;
    let id = str(row.finding_id);
    if (id === null) {
      id = `FND-${index + 1}`;
      log.add('warning', 'finding_id_missing', 'A finding states no "finding_id" and was given a positional identifier, so a control that claims to address it cannot match it.', id);
    }
    if (seen.has(id)) {
      // Not renamed. A control's `addresses_findings` points at the id as written, and rewriting it
      // here would break that reference to fix a cosmetic collision.
      log.add('error', 'finding_id_duplicate', 'Two or more findings share a "finding_id". A control that addresses that id credits every one of them, so the optimiser may over-count the risk it removes.', id);
    }
    seen.add(id);

    const assetId = str(row.asset_id) ?? '';
    if (!assetIds.has(assetId)) {
      log.add('error', 'finding_asset_unknown', 'A finding references an "asset_id" that is not in the inventory. Nothing states what that asset is worth, so the finding carries ₹0 expected loss instead of an invented value — it is real, and its cost is unknown.', id);
    }

    const cveId = str(row.cve_id);
    if (cveId === null) log.add('warning', 'cve_id_missing', 'A finding states no "cve_id". It cannot be matched against CISA KEV or the EPSS history, so it can only be scored by the deterministic formula.', id);

    let cvss = 0;
    if (isFinite_(row.cvss_score)) {
      cvss = Math.min(10, Math.max(0, row.cvss_score));
      if (cvss !== row.cvss_score) log.add('warning', 'cvss_out_of_range', 'A finding states a "cvss_score" outside 0–10. It was clamped to the ends of the CVSS scale.', id);
    } else {
      log.add('error', 'cvss_unusable', 'A finding states no numeric "cvss_score". It is treated as 0, which makes its deterministic score the floor of the scale rather than a measurement.', id);
    }

    let epss = 0;
    const rawEpss = row.epss_score;
    if (isFinite_(rawEpss) && rawEpss >= 0 && rawEpss <= 1) {
      epss = rawEpss;
    } else if (isFinite_(rawEpss) && rawEpss > 1 && rawEpss <= 100) {
      // Deliberately not divided by 100. EPSS 42 probably means 0.42, but "probably" is how a
      // fabricated input becomes a board figure. The file has to say what it means.
      log.add('error', 'epss_looks_like_a_percentage', 'A finding states an "epss_score" above 1 — EPSS is a probability between 0 and 1, so this looks like a percentage. It is treated as unstated rather than divided by 100, because guessing the scale would change the reported exposure by up to 100x.', id);
    } else if (rawEpss !== undefined) {
      log.add('error', 'epss_unusable', 'A finding states an "epss_score" that is not a probability between 0 and 1. It is treated as unstated, so that finding\'s exposure is a lower bound.', id);
    } else {
      log.add('error', 'epss_missing', 'A finding states no "epss_score". It is treated as 0, so that finding\'s exposure is a lower bound.', id);
    }

    let active = false;
    const rawActive = row.actively_exploited;
    if (typeof rawActive === 'boolean') {
      active = rawActive;
    } else if (rawActive !== undefined) {
      const token = String(rawActive).trim().toLowerCase();
      if (['true', 'yes', '1'].includes(token)) active = true;
      else if (!['false', 'no', '0', ''].includes(token)) {
        log.add('warning', 'actively_exploited_unrecognised', 'A finding states an "actively_exploited" value that is neither true nor false. It is treated as not actively exploited, which lowers its score.', id);
      }
      log.add('warning', 'actively_exploited_not_boolean', 'A finding states "actively_exploited" as something other than a JSON boolean. The string "false" is truthy in JavaScript, so it was read as a token rather than for truthiness.', id);
    }

    const finding: RawFinding = {
      finding_id: id,
      asset_id: assetId,
      cve_id: cveId ?? 'CVE-UNSPECIFIED',
      vulnerability_name: str(row.vulnerability_name) ?? (cveId ?? 'Unnamed finding'),
      cvss_score: cvss,
      epss_score: epss,
      actively_exploited: active,
      description: typeof row.description === 'string' ? row.description : '',
    };
    if (isObject(row.enrichment)) finding.enrichment = row.enrichment as RawFinding['enrichment'];
    else if (row.enrichment !== undefined) {
      log.add('warning', 'enrichment_unreadable', 'A finding carries an "enrichment" block that is not an object. It was dropped, so that finding cannot reach the exploitation model.', id);
    }
    out.push(finding);
  });

  return out;
}

function normalizeControls(
  entries: unknown[],
  findingIds: Set<string>,
  log: IssueLog
): { controls: RawCandidateInvestment[]; dropped: number } {
  const controls: RawCandidateInvestment[] = [];
  let dropped = 0;

  entries.forEach((entry, index) => {
    const row = entry as Record<string, unknown>;
    const id = str(row.control_id) ?? `CTRL-${index + 1}`;
    if (str(row.control_id) === null) {
      log.add('warning', 'control_id_missing', 'A candidate control states no "control_id" and was given a positional identifier, so it cannot be mapped to a framework control.', id);
    }

    // Dropped rather than repaired. A control with no stated cost cannot be ranked by
    // reduction-per-rupee or fitted to a budget, and a negative cost lets the greedy loop take
    // every control and report a spend below zero — which it did.
    if (!isFinite_(row.cost_inr) || row.cost_inr < 0) {
      log.add('error', 'control_cost_unusable', 'A candidate control states no usable "cost_inr" (missing, non-numeric or negative). It was excluded from the optimiser, which cannot budget for a cost it does not know.', id);
      dropped += 1;
      return;
    }
    if (!isFinite_(row.estimated_risk_reduction_pct)) {
      log.add('error', 'control_reduction_unusable', 'A candidate control states no numeric "estimated_risk_reduction_pct". It was excluded, because selecting it would claim an unknown benefit.', id);
      dropped += 1;
      return;
    }
    const reduction = Math.min(100, Math.max(0, row.estimated_risk_reduction_pct));
    if (reduction !== row.estimated_risk_reduction_pct) {
      log.add('warning', 'control_reduction_out_of_range', 'A candidate control states an "estimated_risk_reduction_pct" outside 0–100. It was clamped; a reduction above 100% would imply removing more risk than exists.', id);
    }

    let addresses: string[] = [];
    if (Array.isArray(row.addresses_findings)) {
      addresses = row.addresses_findings.filter((v): v is string => typeof v === 'string');
      if (addresses.length !== row.addresses_findings.length) {
        log.add('warning', 'addresses_findings_not_strings', 'A candidate control lists "addresses_findings" entries that are not strings. Those entries were dropped.', id);
      }
      const unknown = addresses.filter((f) => !findingIds.has(f));
      if (unknown.length > 0) {
        log.add('warning', 'control_addresses_unknown_finding', `A candidate control claims to address finding ids that are not in this scan (${unknown.slice(0, 3).join(', ')}). Those claims are ignored when attributing risk reduction.`, id);
      }
    } else if (row.addresses_findings !== undefined) {
      log.add('warning', 'addresses_findings_not_an_array', 'A candidate control states "addresses_findings" as something other than an array. It is treated as addressing no specific finding.', id);
    }

    controls.push({
      control_id: id,
      control_name: str(row.control_name) ?? id,
      cost_inr: row.cost_inr,
      estimated_risk_reduction_pct: reduction,
      addresses_findings: addresses,
    });
  });

  return { controls, dropped };
}

/**
 * `scan_metadata` is descriptive except for the budget, so an absent block is a warning rather
 * than a refusal — but the declared counts are worth checking. A truncated upload usually still
 * parses as valid JSON, and `total_findings: 40` beside 18 findings is the only signal that
 * something was lost in transit.
 *
 * `scan_date` is passed through untouched, including when it is unusable: the anchor machinery in
 * riskUtils.ts already reports that substitution in the banner and both exports, and a second
 * opinion here would be the two-parsers-on-one-field problem again.
 */
function normalizeMetadata(
  value: unknown,
  assetCount: number,
  findingCount: number,
  log: IssueLog
): ScanMetadata {
  const row = isObject(value) ? value : {};
  if (!isObject(value)) {
    log.add('warning', 'scan_metadata_missing', 'The scan states no "scan_metadata", so the organisation name, scan date and available budget are all unstated.', 'scan_metadata');
  }

  const declaredAssets = isFinite_(row.total_assets_scanned) ? row.total_assets_scanned : null;
  if (declaredAssets !== null && declaredAssets !== assetCount) {
    log.add(
      'warning',
      'declared_asset_count_disagrees',
      `The scan declares "total_assets_scanned": ${declaredAssets} but carries ${assetCount} asset rows. Total exposure is calculated across the ${assetCount} asset records present.`,
      'scan_metadata'
    );
  }
  const declaredFindings = isFinite_(row.total_findings) ? row.total_findings : null;
  if (declaredFindings !== null && declaredFindings !== findingCount) {
    log.add(
      'warning',
      'declared_finding_count_disagrees',
      `The scan declares "total_findings": ${declaredFindings} but carries ${findingCount} finding rows. Total exposure is calculated across the ${findingCount} finding records present.`,
      'scan_metadata'
    );
  }

  let budget = 0;
  if (isFinite_(row.security_budget_available_inr) && row.security_budget_available_inr >= 0) {
    budget = row.security_budget_available_inr;
  } else if (row.security_budget_available_inr !== undefined) {
    log.add('warning', 'budget_unusable', 'The scan states a "security_budget_available_inr" that is not a non-negative number. The optimiser starts from ₹0 until a budget is set on the Investment page.', 'scan_metadata');
  }

  return {
    organization: str(row.organization) ?? 'Unstated organization',
    scan_date: typeof row.scan_date === 'string' ? row.scan_date : '',
    total_assets_scanned: declaredAssets ?? assetCount,
    total_findings: declaredFindings ?? findingCount,
    security_budget_available_inr: budget,
  };
}

/** True when nothing was repaired and nothing was refused — the state a well-formed scan is in. */
export function isCleanScan(quality: DataQualityReport): boolean {
  return quality.issues.length === 0;
}
