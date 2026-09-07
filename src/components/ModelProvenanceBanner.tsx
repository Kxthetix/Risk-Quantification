/**
 * The banner that states, on every screen that shows a rupee figure, where that figure came
 * from. It is deliberately not dismissible and deliberately near the top.
 *
 * "Every screen" was aspirational when this was written: it rendered on the Overview tab only, so
 * a reader who opened the registry, the optimiser, the what-if tab or the compliance register from
 * the nav saw the figures with no statement of origin at all. It is now on all five.
 *
 * Four states, each with a different colour and a different claim:
 *   trained + real data     — figures are model estimates; parity and coverage are shown
 *   trained + FIXTURE data  — red; nothing on the page may be reported anywhere
 *   rejected                — amber; a model was found and refused, with the reasons listed
 *   absent                  — slate; the deterministic formula is in use, which is expected
 *
 * Coverage matters as much as state: a verified model that could only score three of eighteen
 * findings has not quantified the portfolio, and a banner that said only "model loaded" would
 * let a reader believe otherwise.
 *
 * This reports coverage in FINDINGS. `ExposureBasisNote` reports the same split in MONEY, which is
 * a different number and the one that describes an aggregate total. Both belong on a page that
 * prints an aggregate; neither substitutes for the other.
 */
import React, { useState } from 'react';
import type { ModelReport } from '../utils/riskUtils';
import { USD_INR_ASSUMPTION } from '../model/engine';
import { DEFAULT_ORG_PROFILE, type OrgProfile } from '../model/features';
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  FileSearch,
  FlaskConical,
  ShieldX,
  Sigma,
} from 'lucide-react';

interface Props {
  model: ModelReport;
  className?: string;
}

type Palette = {
  border: string;
  bg: string;
  accent: string;
  icon: React.ReactNode;
  heading: string;
};

function paletteFor(model: ModelReport): Palette {
  if (model.status.state === 'trained' && !model.status.dataIsReal) {
    return {
      border: 'border-red-500/50',
      bg: 'bg-red-950/40',
      accent: 'text-red-300',
      icon: <FlaskConical className="w-4 h-4" />,
      heading: 'Model built from FIXTURES — not real data',
    };
  }
  if (model.status.state === 'trained') {
    return {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/25',
      accent: 'text-emerald-300',
      icon: <BadgeCheck className="w-4 h-4" />,
      heading: 'Trained model loaded and verified',
    };
  }
  if (model.status.state === 'rejected') {
    return {
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/30',
      accent: 'text-amber-300',
      icon: <ShieldX className="w-4 h-4" />,
      heading: 'Model file found but rejected',
    };
  }
  return {
    border: 'border-slate-700',
    bg: 'bg-slate-900/70',
    accent: 'text-slate-300',
    icon: <CircleSlash className="w-4 h-4" />,
    heading: 'No trained model present — deterministic formula in use',
  };
}

export default function ModelProvenanceBanner({ model, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const p = paletteFor(model);
  // `model.scored` counts every finding carrying a model-derived figure, which includes the KEV
  // findings whose probability is 1 by observation rather than by prediction. Reporting that as
  // "model-scored" — and driving the coverage bar off it — credits the model with findings it was
  // never asked to predict. The split is what the reader needs, so the split is what is shown.
  const predicted = model.byBasis.model.findings;
  const observed = model.byBasis.observed_kev.findings;
  const fallback = model.byBasis.heuristic.findings;
  const pct = model.total > 0 ? Math.round((predicted / model.total) * 100) : 0;

  return (
    <div className={`rounded-xl border ${p.border} ${p.bg} ${className}`}>
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className={`mt-0.5 flex-shrink-0 ${p.accent}`}>{p.icon}</span>
            <div className="min-w-0 space-y-1">
              <h3 className={`text-sm font-bold ${p.accent}`}>{p.heading}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{model.status.message}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md border border-slate-700 bg-slate-900/80 text-[11px] text-slate-300 hover:text-white hover:border-slate-500 transition"
            aria-expanded={open}
          >
            <span>{open ? 'Hide' : 'Provenance'}</span>
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Coverage is stated whatever the state, because it changes what the page means. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono pt-0.5">
          <span className="text-slate-400">
            Model-predicted:{' '}
            <span className={predicted > 0 ? 'text-cyan-300 font-bold' : 'text-slate-500 font-bold'}>
              {predicted}/{model.total}
            </span>{' '}
            findings ({pct}%)
          </span>
          {observed > 0 && (
            <span className="text-slate-400">
              <span className="text-teal-300 font-bold">{observed}</span> observed in CISA KEV, probability 1 not predicted
            </span>
          )}
          {fallback > 0 && (
            <span className="text-amber-400/90">
              {fallback} scored by the deterministic formula
            </span>
          )}
          {model.status.generatedAt && (
            <span className="text-slate-500">model built {model.status.generatedAt.slice(0, 19).replace('T', ' ')}</span>
          )}
        </div>

        <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {open && <ProvenanceDetail model={model} />}
    </div>
  );
}

/**
 * Whether the profile in use is the platform default rather than one an operator supplied. Worth
 * distinguishing: the default puts two of the severity model's inputs in their "unknown" columns,
 * and a reader deserves to know that the comparison set is the broadest one available.
 */
function isDefaultOrg(org: OrgProfile): boolean {
  return (
    org.employeeBand === DEFAULT_ORG_PROFILE.employeeBand &&
    org.naics2 === DEFAULT_ORG_PROFILE.naics2
  );
}

function ProvenanceDetail({ model }: { model: ModelReport }) {
  const parity = model.parity;
  const worst = parity ? Math.max(...Object.values(parity.maxDelta)) : null;

  return (
    <div className="border-t border-slate-800 p-4 space-y-3 text-[11px]">
      {model.status.detail.length > 0 && (
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-300 uppercase tracking-wide text-[10px]">
            {/*
              Three headings, because the lines underneath are three different kinds of statement.
              In the `absent` state they are fetch diagnostics — what the request for the artefact
              actually returned — and filing those under "Model card" invites the reader to take them
              for properties of a model that was never loaded. That mistake is the same one the SPA
              catch-all rewrite already caused once (see src/model/http.ts).
            */}
            {model.status.state === 'rejected'
              ? 'Why it was rejected'
              : model.status.state === 'absent'
                ? 'What the request for the model returned'
                : 'Model card'}
          </h4>
          <ul className="space-y-0.5 font-mono text-slate-400">
            {model.status.detail.map((line, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-slate-600">·</span>
                <span className={model.status.state === 'rejected' ? 'text-amber-300' : ''}>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {parity && (
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-300 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
            <Sigma className="w-3 h-3" />
            Browser/training parity
          </h4>
          <p className="text-slate-400 leading-relaxed font-sans">
            This build re-derived {parity.rows} held-out rows the training run recorded.{' '}
            {parity.passed ? (
              <span className="text-emerald-300">
                All six outputs matched to within {parity.tolerance.toExponential(0)} (worst
                difference {worst !== null ? worst.toExponential(2) : 'n/a'}), so the arithmetic
                running in front of you is the arithmetic the reported metrics were computed
                from.
              </span>
            ) : (
              <span className="text-amber-300">
                The check failed, which is why the model is not being used.
              </span>
            )}
          </p>
        </div>
      )}

      {/*
        Where the CVSS vectors came from. This is upstream of everything else on the panel: a
        finding with no vector cannot reach the exploitation model at all, so a scan that was
        never enriched explains most of a low model-predicted count on its own. Saying "no
        enrichment statement" is the point — vectors from an unstated source would still score.
      */}
      <div className="space-y-1">
        <h4 className="font-semibold text-slate-300 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
          <FileSearch className="w-3 h-3" />
          Scan enrichment
        </h4>
        {model.enrichment ? (
          <ul className="space-y-0.5 text-slate-400 font-sans leading-relaxed">
            <li>{model.enrichment.source || 'source not stated in the scan file'}</li>
            <li>
              {typeof model.enrichment.nvd_records_matched === 'number' && (
                <>
                  <span className="font-mono text-slate-300">
                    {model.enrichment.nvd_records_matched}
                  </span>{' '}
                  findings matched an NVD record
                  {model.enrichment.epss_snapshot ? '; ' : '. '}
                </>
              )}
              {model.enrichment.epss_snapshot && (
                <>
                  EPSS as of{' '}
                  <span className="font-mono text-slate-300">{model.enrichment.epss_snapshot}</span>.{' '}
                </>
              )}
              {model.enrichment.generated_at && (
                <>Written {model.enrichment.generated_at.slice(0, 19).replace('T', ' ')}.</>
              )}
            </li>
          </ul>
        ) : (
          <p className="text-slate-400 font-sans leading-relaxed">
            The scan file carries no enrichment statement, so any CVSS vector in it is of unstated
            origin and most findings will have none at all. A finding without a vector cannot be
            scored by the exploitation model &mdash; twenty-four of its sixty-six inputs are the
            vector&rsquo;s own fields, and none are recoverable from the base score. Run{' '}
            <span className="font-mono text-slate-300">ml/enrich_scan.py</span> against a populated{' '}
            <span className="font-mono text-slate-300">data/raw/</span> to fill them from NVD.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="font-semibold text-slate-300 uppercase tracking-wide text-[10px]">
          Stated assumptions
        </h4>        <ul className="space-y-0.5 text-slate-400 font-sans leading-relaxed">
          {/*
            An overridden rate must not print the default's as-of date. It did, before the rate was
            editable, and the sentence would have quietly attributed an operator's number to a dated
            platform assumption.
          */}
          <li>
            <span className="font-mono text-slate-300">
              USD/INR {model.usdInr ?? USD_INR_ASSUMPTION.rate}
            </span>{' '}
            {(model.usdInr ?? USD_INR_ASSUMPTION.rate) === USD_INR_ASSUMPTION.rate ? (
              <>
                as of {USD_INR_ASSUMPTION.asOf}. {USD_INR_ASSUMPTION.note}
              </>
            ) : (
              <>
                &mdash; set by the operator, replacing the platform default of{' '}
                {USD_INR_ASSUMPTION.rate} as of {USD_INR_ASSUMPTION.asOf}. Every rupee figure from
                the severity model scales linearly with it.
              </>
            )}{' '}
            The severity model is fitted on incidents recorded in US dollars, so a rate is
            unavoidable.
          </li>
          <li>
            Exploitation probability is over a{' '}
            <span className="font-mono text-slate-300">365-day</span> horizon and answers one
            specific question: will this CVE enter CISA's Known Exploited Vulnerabilities
            catalogue. It is not a probability of breach.
          </li>
          <li>
            Loss figures are per-incident amounts from comparable VERIS incidents, capped at
            the asset value stated in the scan file. Expected annual loss is their product.
          </li>
          {/*
            The feature anchor. A stated date is a one-line reassurance; a substituted one is a
            caveat, because the substitution is directional — today is later than the scan, so every
            CVE looks older than it was. The training-side tool refuses to substitute at all.
          */}
          <li>
            {model.scanDateAnchor.stated === null ? (
              <>
                <span className="text-amber-300 font-semibold">
                  Feature anchor substituted:
                </span>{' '}
                the scan file states no parseable{' '}
                <span className="font-mono text-slate-300">scan_date</span>, so features were
                anchored on <span className="font-mono text-slate-300">{model.scanDateAnchor.used}</span>{' '}
                &mdash; today. Two features read that date: how long each CVE had been public, and the
                incident year the severity model compares against. Today is later than any scan, so
                CVE age here is an upper bound rather than the age at scan time.
              </>
            ) : (
              <>
                Features anchored on{' '}
                <span className="font-mono text-slate-300">{model.scanDateAnchor.used}</span>, the date
                the scan file states &mdash; so CVE age and the severity model&rsquo;s incident year
                carry no post-scan information.
              </>
            )}
          </li>
          {model.org && (
            <li>
              Organisation profile:{' '}
              <span className="font-mono text-slate-300">
                {model.org.sectorLabel} · {model.org.employeeBand} employees
              </span>
              {isDefaultOrg(model.org) ? (
                <>
                  {' '}
                  &mdash; the platform default, not a stated profile. Two severity inputs therefore
                  sit in their &ldquo;unknown&rdquo; columns (industry sector and organisation size),
                  which is a real training category rather than a missing value, but a scan from a
                  named institution would score against a narrower and more defensible comparison
                  set. Set it from <span className="text-slate-300">Assumptions</span> in the header.
                </>
              ) : (
                <>
                  {' '}
                  &mdash; stated by the operator, and it selects which comparable incidents the
                  severity model reasons from. Change it from{' '}
                  <span className="text-slate-300">Assumptions</span> in the header; doing so
                  rescores the scan against the same verified artefact and does not re-verify it.
                </>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
