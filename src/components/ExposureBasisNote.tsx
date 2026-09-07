/**
 * States how an AGGREGATE rupee figure divides between the two scoring paths.
 *
 * `ModelProvenanceBanner` answers "is a model loaded, and how many findings did it score". That is
 * not the same question as "how much of this total is a model estimate". A scan where the model
 * scored 3 of 18 findings sounds mostly heuristic, but if those three sit on the crown-jewel
 * database they can be most of the money — and the reverse is just as possible. Until this
 * component existed, `totalFinancialExposureInr` was printed on four screens as a single
 * authoritative number that was silently a sum across two unrelated methods.
 *
 * The three segments are genuinely different claims and are never merged:
 *   model         — probability from the fitted ensemble, loss band from the severity model
 *   observed_kev  — probability is 1 because CISA lists the CVE as exploited; only the loss is
 *                   modelled. Certain about exploitation, modelled about cost.
 *   heuristic     — the deterministic CVSS/EPSS formula. No historical fit behind it at all.
 */
import React from 'react';
import { Info } from 'lucide-react';
import { formatINR, type ModelReport, type ScoreBasisLabel } from '../utils/riskUtils';

interface Props {
  model: ModelReport;
  /** The aggregate this note describes. Passed in so the note cannot drift from the figure. */
  totalExposureInr: number;
  /** What the figure is called on this screen, so the sentence reads correctly in place. */
  label?: string;
  className?: string;
}

const SEGMENTS: Array<{
  basis: ScoreBasisLabel;
  name: string;
  bar: string;
  text: string;
  claim: string;
}> = [
  {
    basis: 'model',
    name: 'model estimate',
    bar: 'bg-cyan-500',
    text: 'text-cyan-300',
    claim: 'exploitation probability from the fitted ensemble, loss band from the severity model',
  },
  {
    basis: 'observed_kev',
    name: 'observed exploitation',
    bar: 'bg-teal-400',
    text: 'text-teal-300',
    claim: 'probability is 1 because CISA lists the CVE as exploited; only the loss is modelled',
  },
  {
    basis: 'heuristic',
    name: 'deterministic formula',
    bar: 'bg-amber-500',
    text: 'text-amber-300',
    claim: 'the transparent CVSS/EPSS formula, not fitted to historical outcomes',
  },
];

export default function ExposureBasisNote({
  model,
  totalExposureInr,
  label = 'this total',
  className = '',
}: Props) {
  const parts = SEGMENTS.map((s) => ({ ...s, ...model.byBasis[s.basis] }));
  const attributed = parts.reduce((sum, p) => sum + p.exposureInr, 0);
  const present = parts.filter((p) => p.findings > 0);

  // Percentages are of what was attributed, not of the figure passed in, and the two are then
  // compared. If they ever diverge the note says so rather than printing shares that do not
  // describe the number beside them.
  const share = (v: number) => (attributed > 0 ? (v / attributed) * 100 : 0);
  const drift = Math.abs(attributed - totalExposureInr);
  const consistent = totalExposureInr === 0 ? attributed === 0 : drift / Math.max(1, totalExposureInr) < 0.005;

  if (present.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 space-y-2 ${className}`}>
      <div className="flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-px" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {present.length === 1 ? (
            <>
              All of {label} —{' '}
              <span className="font-mono text-slate-200">{formatINR(attributed, true)}</span> across{' '}
              {present[0].findings} finding{present[0].findings === 1 ? '' : 's'} — is{' '}
              <span className={`font-semibold ${present[0].text}`}>{present[0].name}</span>:{' '}
              {present[0].claim}.
            </>
          ) : (
            <>
              <span className="font-mono text-slate-200">{formatINR(attributed, true)}</span> of{' '}
              {label} is a sum across {present.length} different methods, so it is not one kind of
              number:{' '}
              {present.map((p, i) => (
                <React.Fragment key={p.basis}>
                  <span className={`font-semibold ${p.text}`}>
                    {share(p.exposureInr).toFixed(0)}% {p.name}
                  </span>
                  {i < present.length - 2 ? ', ' : i === present.length - 2 ? ' and ' : '. '}
                </React.Fragment>
              ))}
              Sort or compare within a method, not across them.
            </>
          )}
        </p>
      </div>

      {/* Money, not counts. The bar is the split a reader is being asked to trust. */}
      <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
        {present.map((p) => (
          <div
            key={p.basis}
            className={p.bar}
            style={{ width: `${share(p.exposureInr)}%` }}
            title={`${p.name}: ${formatINR(p.exposureInr, true)} across ${p.findings} finding${
              p.findings === 1 ? '' : 's'
            } — ${p.claim}`}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-500">
        {present.map((p) => (
          <span key={p.basis}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${p.bar}`} />
            {p.name}: {formatINR(p.exposureInr, true)} · {p.findings} finding
            {p.findings === 1 ? '' : 's'}
          </span>
        ))}
      </div>

      {!consistent && (
        <p className="text-[10px] text-amber-300 font-mono">
          The attributed total ({formatINR(attributed, true)}) does not match the figure shown (
          {formatINR(totalExposureInr, true)}). Treat the split as indicative until that is
          reconciled.
        </p>
      )}
    </div>
  );
}
