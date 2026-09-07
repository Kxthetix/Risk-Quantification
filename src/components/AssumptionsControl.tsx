/**
 * The two assumptions an operator can actually set, and the only two that were previously
 * unreachable: the organisation profile the severity model compares against, and the USD/INR rate
 * every rupee figure is denominated by.
 *
 * Both already existed as inputs — `loadRiskEngine({ org, usdInr })` — and nothing ever passed
 * them, so `SECTOR_OPTIONS` and `EMPLOYEE_BANDS` were exported and consumed nowhere, the sector and
 * headcount columns sat permanently in their "unknown" positions, and two comments in `engine.ts`
 * claimed both values were editable in the UI when they were not.
 *
 * It lives in the header rather than on a page because it applies to every page, and because the
 * provenance banner states these values on all five — a control that changes a stated assumption
 * should be next to where the assumption is stated, not on one tab.
 *
 * What it deliberately does NOT do is re-verify anything. `withAssumptions` reuses the same verified
 * artefact; see the contract on `RiskEngine`.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Building2, Check, RotateCcw, Sliders, X } from 'lucide-react';
import { EMPLOYEE_BANDS, SECTOR_OPTIONS, type OrgProfile } from '../model/features';
import { USD_INR_ASSUMPTION } from '../model/engine';
import type { ModelState } from '../model/engine';

interface Props {
  org: OrgProfile;
  usdInr: number;
  /** Whether the values below currently reach a figure, which only a loaded model makes true. */
  modelState: ModelState | null;
  onChange: (next: { org?: OrgProfile; usdInr?: number }) => void;
}

/**
 * VCDB records headcount two ways: eight numeric bands and three coarse ones. Keeping them in
 * separate groups stops `Small` reading as a mistake sitting next to `1001 to 10000`, and makes it
 * visible that `Unknown` is a category the model was trained on rather than a blank.
 */
const NUMERIC_BANDS = EMPLOYEE_BANDS.filter((b) => /\d/.test(b));
const COARSE_BANDS = EMPLOYEE_BANDS.filter((b) => !/\d/.test(b));

export default function AssumptionsControl({ org, usdInr, modelState, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [rateDraft, setRateDraft] = useState(String(usdInr));
  const panelRef = useRef<HTMLDivElement>(null);

  // The draft is local so a half-typed "8" does not momentarily reprice the portfolio at ₹8/USD.
  useEffect(() => setRateDraft(String(usdInr)), [usdInr]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const parsedRate = Number(rateDraft);
  const rateValid = Number.isFinite(parsedRate) && parsedRate > 0;
  const rateDirty = rateValid && parsedRate !== usdInr;

  const commitRate = () => {
    if (rateDirty) onChange({ usdInr: parsedRate });
    else setRateDraft(String(usdInr));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Set the organisation profile and exchange rate the model scores against"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-medium transition"
      >
        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden lg:inline font-mono">
          {org.naics2 || org.employeeBand !== 'Unknown'
            ? `${org.sectorLabel.split(' ')[0]} · ${org.employeeBand}`
            : 'Profile unset'}
        </span>
        <span className="font-mono text-slate-500 hidden xl:inline">₹{usdInr}/$</span>
        <span className="lg:hidden">Assumptions</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,26rem)] rounded-xl border border-slate-700 bg-slate-950/98 shadow-2xl backdrop-blur-xl z-50 text-left">
          <div className="flex items-start justify-between gap-3 p-3.5 border-b border-slate-800">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Stated assumptions
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                These are inputs to the model, not display settings. They are printed on both
                exports.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded text-slate-500 hover:text-slate-200"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3.5 space-y-3.5">
            <Field
              id="assumption-sector"
              label="Industry sector"
              note="Two-digit NAICS, as recorded in the incident corpus the severity model is fitted on."
            >
              <select
                id="assumption-sector"
                value={org.naics2}
                onChange={(e) => {
                  const opt = SECTOR_OPTIONS.find((s) => s.naics2 === e.target.value);
                  if (opt) onChange({ org: { ...org, naics2: opt.naics2, sectorLabel: opt.label } });
                }}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s.naics2 || 'other'} value={s.naics2}>
                    {s.label}
                    {s.naics2 ? ` (${s.naics2})` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="assumption-band"
              label="Organisation size"
              note="Headcount band. 'Unknown' is a category the model was trained on, not a blank."
            >
              <select
                id="assumption-band"
                value={org.employeeBand}
                onChange={(e) =>
                  onChange({ org: { ...org, employeeBand: e.target.value as OrgProfile['employeeBand'] } })
                }
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <optgroup label="Reported headcount">
                  {NUMERIC_BANDS.map((b) => (
                    <option key={b} value={b}>
                      {b} employees
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Coarse categories">
                  {COARSE_BANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </optgroup>
              </select>
            </Field>

            <Field
              id="assumption-rate"
              label="USD to INR"
              note={`Platform default ${USD_INR_ASSUMPTION.rate}, stated as of ${USD_INR_ASSUMPTION.asOf}. Not a live rate. Loss figures scale linearly with it.`}
            >
              <div className="flex items-center gap-1.5">
                <input
                  id="assumption-rate"
                  type="number"
                  min="0"
                  step="0.5"
                  value={rateDraft}
                  onChange={(e) => setRateDraft(e.target.value)}
                  onBlur={commitRate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRate();
                  }}
                  className={`w-24 rounded-lg bg-slate-900 border px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none ${
                    rateValid ? 'border-slate-700 focus:border-cyan-500' : 'border-red-500/60'
                  }`}
                />
                <button
                  onClick={commitRate}
                  disabled={!rateDirty}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-[11px] text-slate-300 hover:border-cyan-500/60 hover:text-white disabled:opacity-40 disabled:hover:border-slate-700 transition"
                >
                  <Check className="w-3 h-3" />
                  Apply
                </button>
                {usdInr !== USD_INR_ASSUMPTION.rate && (
                  <button
                    onClick={() => onChange({ usdInr: USD_INR_ASSUMPTION.rate })}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-[11px] text-slate-400 hover:text-white transition"
                    title={`Back to the stated default of ${USD_INR_ASSUMPTION.rate}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Default
                  </button>
                )}
              </div>
              {!rateValid && (
                <p className="text-[10px] text-red-300 pt-1">
                  A rate must be a positive number. This value is ignored until it is.
                </p>
              )}
            </Field>

            <EffectNote modelState={modelState} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  note,
  children,
}: {
  id: string;
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-200">
        {label}
      </label>
      {children}
      <p className="text-[10px] text-slate-500 leading-relaxed">{note}</p>
    </div>
  );
}

/**
 * What changing these actually does, right now, in this deployment.
 *
 * Without a loaded model the answer is uncomfortable and has to be said anyway: the deterministic
 * fallback uses neither value, so nothing on screen moves. Leaving that out would make the panel
 * look like it repriced a portfolio it did not touch. What it does do even then is real — both
 * values are recorded and printed on the PDF and the control register, which is where a filer's
 * assumptions belong.
 */
function EffectNote({ modelState }: { modelState: ModelState | null }) {
  if (modelState === 'trained') {
    return (
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-[10px] text-slate-300 leading-relaxed">
        A model is loaded, so a change here rescores every model-scored finding immediately: the
        profile selects the comparison set, the rate converts it. The artefact is{' '}
        <span className="text-cyan-300">not re-fetched or re-verified</span> — an assumption is not
        new evidence about the model.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5 text-[10px] text-slate-300 leading-relaxed">
      No model is in use, so the deterministic CVSS/EPSS fallback produced every figure on screen and
      it reads neither of these values &mdash; changing them will not move a number here. They are
      still recorded, and both are printed on the PDF board report and the Excel control register, so
      set them to the truth before exporting.
    </div>
  );
}
