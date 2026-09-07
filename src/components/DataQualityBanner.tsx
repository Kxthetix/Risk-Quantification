/**
 * What the ingest had to repair in the scan file, stated on the screens that print an aggregate.
 *
 * Without this the validation layer is decorative. `validateAndNormalizeScan` already refuses to
 * invent a quantity — an unusable asset value becomes ₹0 rather than a plausible substitute — but
 * an under-statement nobody is told about is not honest either. It looks exactly like a measured
 * total, because it *is* a total; it is simply a total over less than the file claimed to contain.
 * So the rule is: if a stated figure was unusable, the reader is told that the number below is a
 * floor, and told how far the floor sits from the whole portfolio.
 *
 * Two severities, and the distinction is money:
 *   error   — a stated figure was unusable, so a rupee total below is a LOWER bound
 *   warning — a descriptive field was defaulted; the arithmetic is unaffected
 *
 * This renders nothing for a clean scan, deliberately. The bundled sample is clean, so a banner
 * that always appeared would be wallpaper by the third screen and ignored on the one scan where it
 * mattered. `ModelProvenanceBanner` is unconditional for the opposite reason: provenance is always
 * a live claim, whereas "nothing was wrong with your file" is not news.
 */
import React, { useState } from 'react';
import type { DataQualityReport } from '../utils/riskUtils';
import { isCleanScan } from '../utils/riskUtils';
import { AlertOctagon, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  quality: DataQualityReport;
  /** What the figures on this page are, e.g. "the exposure totals below". */
  label?: string;
  className?: string;
}

export default function DataQualityBanner({ quality, label, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  if (isCleanScan(quality)) return null;

  const hasErrors = quality.errorCount > 0;
  const palette = hasErrors
    ? {
        border: 'border-red-500/50',
        bg: 'bg-red-950/35',
        accent: 'text-red-300',
        icon: <AlertOctagon className="w-4 h-4" />
      }
    : {
        border: 'border-amber-500/40',
        bg: 'bg-amber-950/25',
        accent: 'text-amber-300',
        icon: <AlertTriangle className="w-4 h-4" />
      };

  const assetGap = quality.assetsAccepted - quality.assetsWithStatedValue;
  const findingGap = quality.findingsAccepted - quality.findingsQuantifiable;
  const figures = label ?? 'the figures on this page';

  return (
    <div role="alert" className={`rounded-xl border ${palette.border} ${palette.bg} ${className}`}>
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className={`mt-0.5 flex-shrink-0 ${palette.accent}`}>{palette.icon}</span>
            <div className="min-w-0 space-y-1">
              <h3 className={`text-sm font-bold ${palette.accent}`}>
                {hasErrors
                  ? `Scan file incomplete — ${figures} are a lower bound`
                  : `Scan file accepted with ${quality.warningCount} field${quality.warningCount === 1 ? '' : 's'} defaulted`}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {hasErrors ? (
                  <>
                    {quality.errorCount} {quality.errorCount === 1 ? 'problem' : 'problems'} in the
                    uploaded file left a stated figure unusable. Nothing was substituted for it, so
                    the totals below are computed over what the file could actually support and are
                    lower than the true exposure, not higher.
                    {quality.warningCount > 0 && (
                      <>
                        {' '}
                        A further {quality.warningCount}{' '}
                        {quality.warningCount === 1 ? 'field was' : 'fields were'} defaulted without
                        affecting any rupee figure.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Every rupee figure in this scan is derived from a stated value. The items below
                    are descriptive fields that were missing or unrecognised and have been defaulted;
                    none of them changes a total.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md border border-slate-700 bg-slate-900/80 text-[11px] text-slate-300 hover:text-white hover:border-slate-500 transition"
            aria-expanded={open}
          >
            <span>{open ? 'Hide' : `${quality.issues.length} item${quality.issues.length === 1 ? '' : 's'}`}</span>
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* How much of the portfolio can carry a rupee figure at all. This is the sentence that
            sizes the under-statement: "3 of 18 assets state no value" tells a reader how much of
            the total is missing far better than a count of problems does. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono pt-0.5">
          <span className="text-slate-400">
            Assets priced:{' '}
            <span className={assetGap > 0 ? 'text-red-300 font-bold' : 'text-slate-300 font-bold'}>
              {quality.assetsWithStatedValue}/{quality.assetsAccepted}
            </span>
          </span>
          <span className="text-slate-400">
            Findings quantifiable:{' '}
            <span className={findingGap > 0 ? 'text-red-300 font-bold' : 'text-slate-300 font-bold'}>
              {quality.findingsQuantifiable}/{quality.findingsAccepted}
            </span>
          </span>
          {quality.controlsDropped > 0 && (
            <span className="text-amber-400/90">
              {quality.controlsDropped} candidate control
              {quality.controlsDropped === 1 ? '' : 's'} excluded from the optimiser
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-800 p-4 space-y-2.5 text-[11px]">
          {quality.issues.map((issue) => (
            <div key={issue.code} className="flex gap-2.5">
              <span
                className={`mt-0.5 flex-shrink-0 font-mono text-[10px] font-bold uppercase tracking-wide ${
                  issue.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                {issue.severity}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-slate-300 leading-relaxed">
                  {issue.message}
                  {issue.count > 1 && (
                    <span className="text-slate-500"> ({issue.count} occurrences)</span>
                  )}
                </p>
                <p className="font-mono text-[10px] text-slate-500 break-all">
                  {issue.sample.join(', ')}
                  {issue.count > issue.sample.length && ` … and ${issue.count - issue.sample.length} more`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


