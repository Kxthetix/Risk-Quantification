/**
 * Framework compliance and governance mapping.
 *
 * The page answers three questions a reviewer actually asks, in order:
 *   1. Which specific controls does this scan give me evidence about, in each framework?
 *   2. For those controls, is there a remediation on the table, or is it an open gap?
 *   3. Which of my reportable risk metrics can I file, and against which requirement?
 *
 * Two honesty rules are enforced here rather than left to the reader. Every identifier is
 * shown with its verification status, because an RBI or SEBI number this project assigned is
 * not a citation of the circular. And attributed exposure is never summed down a column: one
 * finding implicates several controls, so the same rupee appears under each.
 */
import React, { useMemo, useState } from 'react';
import type { ProcessedScanResult } from '../utils/riskUtils';
import { buildScanComplianceReport, formatINR, runKnapsackOptimization } from '../utils/riskUtils';
import ModelProvenanceBanner from '../components/ModelProvenanceBanner';
import ExposureBasisNote from '../components/ExposureBasisNote';
import DataQualityBanner from '../components/DataQualityBanner';
import type { ControlStatus, ComplianceReport, FrameworkSummary } from '../model/compliance';
import { citedVerificationCounts } from '../model/compliance';
import type { FrameworkId, Verification } from '../model/crosswalk';
import { FRAMEWORK_ORDER } from '../model/crosswalk';
import type { OptimizationResult } from '../utils/riskUtils';
import {
  boardReportFilename,
  buildBoardReportPdf,
  buildControlRegisterWorkbook,
  downloadBytes,
  registerFilename,
  PDF_MIME,
  XLSX_MIME,
} from '../export/reports';
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Landmark,
  Scale,
  Search,
  ShieldCheck,
  Target,
} from 'lucide-react';

interface Props {
  data: ProcessedScanResult;
}

const VERIFICATION_STYLE: Record<Verification, { chip: string; label: string; tooltip: string }> = {
  verified: {
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    label: 'verified',
    tooltip: 'Identifier and title checked against the published standard. Citable.',
  },
  inferred: {
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    label: 'inferred',
    tooltip:
      'Requirement substance follows the primary document, but the official clause numbering could not be confirmed. Not a citation.',
  },
  assigned: {
    chip: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    label: 'assigned',
    tooltip:
      'Identifier created by this platform, with the mapping basis recorded. Not a citation.',
  },
};

export default function Compliance({ data }: Props) {
  const [activeFramework, setActiveFramework] = useState<FrameworkId>('iso27001');
  const [query, setQuery] = useState('');
  const [onlyGaps, setOnlyGaps] = useState(true);

  // Residual risk and ROI are governance metrics several frameworks ask for, and both need a
  // selected portfolio. Running the same optimiser the Investment tab runs keeps the number
  // on this page identical to the number on that one.
  const optimization = useMemo(
    () =>
      data.candidateInvestments.length > 0
        ? runKnapsackOptimization(
            data.scanMetadata.security_budget_available_inr,
            data.candidateInvestments,
            data.overallOrgRiskScore,
            data.totalFinancialExposureInr
          )
        : null,
    [data]
  );

  const report = useMemo(() => buildScanComplianceReport(data, optimization), [data, optimization]);

  if (!report) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-6 space-y-2">
        <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
          <FileWarning className="w-5 h-5" />
          Framework catalogue unavailable
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          public/frameworks/crosswalk.json could not be loaded, so no control-level mapping can
          be produced. This page shows nothing rather than a partial mapping: a compliance view
          that silently rendered four of five frameworks would be worse than one that reports it
          could not load the catalogue.
        </p>
      </div>
    );
  }

  const cited = citedVerificationCounts(report);
  const summary = report.frameworks.find((f) => f.id === activeFramework)!;
  const rows = report.controls
    .filter((c) => c.framework === activeFramework)
    .filter((c) => (onlyGaps ? c.state !== 'not_implicated' : true))
    .filter((c) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.groupName.toLowerCase().includes(q) ||
        c.vulnClassKeys.some((k) => k.includes(q))
      );
    })
    .sort((a, b) => b.exposureInr - a.exposureInr || a.id.localeCompare(b.id, undefined, { numeric: true }));

  return (
    <div className="space-y-6">
      {/* Two different provenance questions are asked on this page and they must not be conflated.
          `Caveats` covers how each framework identifier was sourced (verified / inferred /
          assigned). This covers where the rupee figures attributed to those controls came from —
          the register sorts controls by exposure, so the sort order itself inherits the split. */}
      <ModelProvenanceBanner model={data.model} />
      <DataQualityBanner quality={data.dataQuality} label="the exposure attributed to each control below" />
      <Header report={report} cited={cited} data={data} optimization={optimization} />
      <ExposureBasisNote
        model={data.model}
        totalExposureInr={data.totalFinancialExposureInr}
        label="the exposure attributed to controls below"
      />
      <FrameworkCards
        frameworks={report.frameworks}
        active={activeFramework}
        onSelect={setActiveFramework}
      />
      <MetricGovernance report={report} />
      <ControlRegister
        summary={summary}
        rows={rows}
        query={query}
        onQuery={setQuery}
        onlyGaps={onlyGaps}
        onToggleGaps={() => setOnlyGaps((v) => !v)}
        totalInFramework={report.controls.filter((c) => c.framework === activeFramework).length}
      />
      <Caveats report={report} />
    </div>
  );
}

function Header({
  report,
  cited,
  data,
  optimization,
}: {
  report: ComplianceReport;
  cited: Record<Verification, number>;
  data: ProcessedScanResult;
  optimization: OptimizationResult | null;
}) {
  const totalCited = cited.verified + cited.inferred + cited.assigned;
  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            Control-Level Framework Mapping
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Every finding is resolved to a vulnerability class, and each class carries the
            specific ISO/IEC 27001 Annex A controls, NIST CSF 2.0 subcategories, CIS v8.1
            safeguards, RBI circular requirements and SEBI CSCRF standards it is evidence
            against. Candidate investments are mapped the same way, which is what turns a
            finding list into a control register.
          </p>
        </div>
        <div className="text-right text-[11px] font-mono text-slate-500 flex-shrink-0">
          <div>catalogue {report.crosswalkGeneratedAt.slice(0, 10)}</div>
          <div>{totalCited} controls cited by this scan</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {(['verified', 'inferred', 'assigned'] as Verification[]).map((v) => (
          <span
            key={v}
            title={VERIFICATION_STYLE[v].tooltip}
            className={`text-[11px] font-mono px-2 py-1 rounded border ${VERIFICATION_STYLE[v].chip}`}
          >
            {cited[v]} {VERIFICATION_STYLE[v].label}
          </span>
        ))}
        <div className="flex-1" />
        <ExportButtons data={data} report={report} optimization={optimization} />
      </div>
    </div>
  );
}

/**
 * The two regulatory deliverables. Both are composed in the browser from the same report object
 * this page renders, so an exported file cannot disagree with the screen it came from.
 */
function ExportButtons({
  data,
  report,
  optimization,
}: {
  data: ProcessedScanResult;
  report: ComplianceReport;
  optimization: OptimizationResult | null;
}) {
  const [busy, setBusy] = useState<'xlsx' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (kind: 'xlsx' | 'pdf') => {
    const doc = data.crosswalk;
    if (!doc) {
      setError('The framework catalogue is not loaded, so no mapped export can be produced.');
      return;
    }
    setBusy(kind);
    setError(null);
    // Yield a frame so the button can paint its busy state before the synchronous build runs.
    window.setTimeout(() => {
      try {
        if (kind === 'xlsx') {
          downloadBytes(
            buildControlRegisterWorkbook(data, report, optimization, doc),
            registerFilename(data),
            XLSX_MIME
          );
        } else {
          downloadBytes(
            buildBoardReportPdf(data, report, optimization, doc),
            boardReportFilename(data),
            PDF_MIME
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'the export failed for an unrecorded reason');
      } finally {
        setBusy(null);
      }
    }, 0);
  };

  const base =
    'inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded border transition-colors disabled:opacity-50 disabled:cursor-wait';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && (
        <span className="text-[11px] text-rose-300 max-w-xs leading-snug">{error}</span>
      )}
      <button
        type="button"
        onClick={() => run('xlsx')}
        disabled={busy !== null}
        title="Every control, finding, investment and metric as a filterable workbook. Currency cells are numbers, so they sum and pivot."
        className={`${base} bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20`}
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        {busy === 'xlsx' ? 'Building…' : 'Control register (.xlsx)'}
      </button>
      <button
        type="button"
        onClick={() => run('pdf')}
        disabled={busy !== null}
        title="The board version: headline exposure, framework coverage, where the money is, and the caveats that belong to those figures."
        className={`${base} bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20`}
      >
        <FileText className="w-3.5 h-3.5" />
        {busy === 'pdf' ? 'Building…' : 'Board report (.pdf)'}
      </button>
    </div>
  );
}

const FRAMEWORK_ICON: Record<FrameworkId, React.ComponentType<{ className?: string }>> = {
  iso27001: ShieldCheck,
  nistcsf: Target,
  cis: ClipboardList,
  rbi: Landmark,
  sebi: Scale,
};

/**
 * The weakest verification level present among a framework's cited controls, not the most
 * common one. If a framework's register mixes verified and assigned identifiers, the honest
 * headline is the assigned one — a reader who sees "verified" on the card will not go looking
 * for the exception.
 */
function weakestVerification(fw: FrameworkSummary): Verification {
  const counts = fw.verificationCounts;
  if ((counts.assigned ?? 0) > 0) return 'assigned';
  if ((counts.inferred ?? 0) > 0) return 'inferred';
  return 'verified';
}

function FrameworkCards({
  frameworks,
  active,
  onSelect,
}: {
  frameworks: FrameworkSummary[];
  active: FrameworkId;
  onSelect: (id: FrameworkId) => void;
}) {
  const byId = new Map(frameworks.map((f) => [f.id, f]));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {FRAMEWORK_ORDER.map((id) => {
        const fw = byId.get(id);
        if (!fw) return null;
        const Icon = FRAMEWORK_ICON[id];
        const isActive = id === active;
        const weakest = weakestVerification(fw);
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            title={fw.longName}
            className={`text-left rounded-xl border p-4 space-y-3 transition ${
              isActive
                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-white truncate">{fw.name}</span>
              </div>
              <span
                title={VERIFICATION_STYLE[weakest].tooltip}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${VERIFICATION_STYLE[weakest].chip}`}
              >
                {VERIFICATION_STYLE[weakest].label}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white tabular-nums">{fw.implicated}</span>
                <span className="text-[11px] text-slate-500 font-mono">/ {fw.total} controls</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                  style={{ width: `${Math.min(100, fw.inScopePct)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {fw.inScopePct}% of the framework is in scope for this scan
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/80">
              <span className="text-emerald-400">{fw.planned} planned</span>
              <span className={fw.unplanned > 0 ? 'text-rose-400' : 'text-slate-500'}>
                {fw.unplanned} open
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The reportable-metrics half of the request: which of this platform's figures can be filed,
 * and against which requirement. A metric the platform cannot compute prints its reason in
 * amber rather than a zero — "no findings are actively exploited" and "we did not measure
 * active exploitation" are different statements and only one is a control assertion.
 */
function MetricGovernance({ report }: { report: ComplianceReport }) {
  const reportable = report.metrics.filter((m) => m.value !== null).length;
  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-cyan-400" />
            Risk Metrics → Reporting Requirements
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Each row is a figure this platform produces, the governance claim it supports, and the
            controls across all five frameworks that ask for it.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
          {reportable}/{report.metrics.length} computable from this scan
        </span>
      </div>

      <div className="divide-y divide-slate-800/80">
        {report.metrics.map((metric) => (
          <div key={metric.key} className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 space-y-1">
              <div className="text-xs font-semibold text-white">{metric.label}</div>
              <div className="text-[10px] font-mono text-slate-500">
                {metric.field} · {metric.unit}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-1">
              {metric.value !== null ? (
                <div className="text-xs font-mono text-cyan-300 break-words">{metric.value}</div>
              ) : (
                <div className="text-[11px] text-amber-300/90 flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                  <span>Not reportable from this scan. {metric.unavailableReason}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-400 leading-relaxed">{metric.statement}</div>
            </div>

            <div className="lg:col-span-3 space-y-1">
              <div className="text-[10px] font-mono text-slate-500">
                {metric.controlCount} control{metric.controlCount === 1 ? '' : 's'} reference this
              </div>
              <div className="flex flex-wrap gap-1">
                {FRAMEWORK_ORDER.map((id) => {
                  const refs = metric.controls[id] ?? [];
                  if (refs.length === 0) return null;
                  return (
                    <span
                      key={id}
                      title={refs.join(', ')}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300"
                    >
                      {id} ×{refs.length}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATE_BADGE: Record<ControlStatus['state'], { chip: string; label: string }> = {
  gap: { chip: 'bg-rose-500/15 text-rose-300 border-rose-500/40', label: 'open gap' },
  gap_with_plan: {
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    label: 'remediation mapped',
  },
  not_implicated: {
    chip: 'bg-slate-700/40 text-slate-400 border-slate-600/50',
    label: 'no evidence',
  },
};

function ControlRegister({
  summary,
  rows,
  query,
  onQuery,
  onlyGaps,
  onToggleGaps,
  totalInFramework,
}: {
  summary: FrameworkSummary;
  rows: ControlStatus[];
  query: string;
  onQuery: (v: string) => void;
  onlyGaps: boolean;
  onToggleGaps: () => void;
  totalInFramework: number;
}) {
  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">{summary.longName}</h3>
            <p className="text-[11px] text-slate-500">
              {summary.authority} · {summary.total} controls catalogued · {summary.implicated}{' '}
              implicated by this scan · {summary.planned} with a mapped remediation
            </p>
            <p className="text-[10px] font-mono text-slate-600 break-all">source: {summary.source}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="control, title, class"
                aria-label="Filter controls"
                className="w-48 pl-8 pr-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <button
              onClick={onToggleGaps}
              className={`text-[11px] font-mono px-2.5 py-1.5 rounded-lg border transition ${
                onlyGaps
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {onlyGaps ? 'implicated only' : `all ${totalInFramework}`}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {summary.groups.map((g) => (
            <span
              key={g.key}
              title={`${g.name}: ${g.implicated} of ${g.total} implicated`}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                g.implicated > 0
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}
            >
              {g.key} {g.implicated}/{g.total}
            </span>
          ))}
        </div>
      </div>

      <ControlRows rows={rows} />
    </div>
  );
}

function ControlRows({ rows }: { rows: ControlStatus[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        No control in this framework matches the current filter.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-950/60 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Control</th>
            <th className="px-4 py-2.5 font-medium">Requirement</th>
            <th className="px-4 py-2.5 font-medium">Evidence from this scan</th>
            <th className="px-4 py-2.5 font-medium text-right" title="Expected annual loss of the implicating findings. NOT additive down this column: one finding implicates several controls, so the same rupee appears in more than one row.">
              Attributed EAL*
            </th>
            <th className="px-4 py-2.5 font-medium">Remediation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {rows.map((row) => {
            const badge = STATE_BADGE[row.state];
            const style = VERIFICATION_STYLE[row.verification];
            return (
              <tr key={`${row.framework} ${row.id}`} className="hover:bg-slate-800/30 align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-xs font-mono font-bold text-white">{row.id}</div>
                  <span
                    title={row.note ?? row.basis ?? style.tooltip}
                    className={`inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${style.chip}`}
                  >
                    {style.label}
                  </span>
                </td>

                <td className="px-4 py-3 max-w-sm">
                  <div className="text-xs text-slate-200 leading-snug">{row.title}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {row.group} · {row.groupName}
                  </div>
                  {row.basis && (
                    <div className="text-[10px] text-orange-300/80 mt-1 leading-relaxed">
                      basis: {row.basis}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 max-w-xs">
                  {row.findingIds.length === 0 ? (
                    <span className="text-[11px] text-slate-600">
                      Nothing in this scan is evidence about this control.
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-300">
                        {row.findingIds.length} finding{row.findingIds.length === 1 ? '' : 's'} · peak
                        risk index {row.peakRiskIndex}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {row.vulnClassKeys.map((k) => (
                          <span
                            key={k}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span
                    className={`text-xs font-mono font-bold ${
                      row.exposureInr > 0 ? 'text-amber-300' : 'text-slate-600'
                    }`}
                  >
                    {row.exposureInr > 0 ? formatINR(row.exposureInr, true) : '—'}
                  </span>
                </td>

                <td className="px-4 py-3 max-w-xs">
                  <span
                    className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border ${badge.chip}`}
                  >
                    {badge.label}
                  </span>
                  {row.plannedBy.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.plannedBy.map((id) => (
                        <span
                          key={id}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="px-4 py-2.5 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed">
        * Attributed EAL is not additive down this column. One finding implicates several controls,
        so the same rupee of expected annual loss appears in every row it is evidence for. The
        portfolio total is on the Overview tab.
      </div>
    </div>
  );
}

/**
 * What this mapping does not support. Kept on the page rather than in a footnote because the
 * two items that matter most — that RBI and SEBI identifiers are not citations, and that some
 * findings implicate nothing at all — are exactly the ones a reader would otherwise assume away.
 */
function Caveats({ report }: { report: ComplianceReport }) {
  const unclassified = report.unclassifiedFindingIds;
  const unmapped = report.unmappedInvestmentIds;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-semibold text-white flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-cyan-400" />
          What each identifier is worth
        </h3>
        <div className="space-y-2">
          {(['verified', 'inferred', 'assigned'] as Verification[]).map((v) => (
            <div key={v} className="flex items-start gap-2">
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 mt-px ${VERIFICATION_STYLE[v].chip}`}
              >
                {VERIFICATION_STYLE[v].label}
              </span>
              <span className="text-[11px] text-slate-400 leading-relaxed">
                {VERIFICATION_STYLE[v].tooltip}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
          {report.provenanceNote}
        </p>
      </div>

      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Coverage gaps in the mapping itself
        </h3>

        <div className="space-y-2 text-[11px] leading-relaxed">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400">
              Findings that matched no vulnerability class, so they implicate no control in any
              framework and are absent from every register above.
            </span>
            <span
              className={`font-mono font-bold flex-shrink-0 ${
                unclassified.length > 0 ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {unclassified.length}
            </span>
          </div>
          {unclassified.length > 0 && (
            <div className="font-mono text-[10px] text-slate-500 break-words">
              {unclassified.slice(0, 12).join(', ')}
              {unclassified.length > 12 ? ` … +${unclassified.length - 12}` : ''}
            </div>
          )}

          <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-800">
            <span className="text-slate-400">
              Candidate investments that matched no mitigation class, so funding them would not
              show up as a remediation against any control.
            </span>
            <span
              className={`font-mono font-bold flex-shrink-0 ${
                unmapped.length > 0 ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {unmapped.length}
            </span>
          </div>
          {unmapped.length > 0 && (
            <div className="font-mono text-[10px] text-slate-500 break-words">
              {unmapped.join(', ')}
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800">
          A control marked "no evidence" means this scan says nothing about it — not that it is
          implemented. Framework coverage here is evidence of weakness and of plan, not an
          assessment of the control environment.
        </p>
      </div>
    </div>
  );
}
