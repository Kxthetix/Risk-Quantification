import React from 'react';
import VulnTable from '../components/VulnTable';
import ModelProvenanceBanner from '../components/ModelProvenanceBanner';
import ExposureBasisNote from '../components/ExposureBasisNote';
import DataQualityBanner from '../components/DataQualityBanner';
import { DataQualityReport, EnrichedFinding, ModelReport } from '../utils/riskUtils';
import { ShieldAlert } from 'lucide-react';

interface RiskQuantificationProps {
  findings: EnrichedFinding[];
  model: ModelReport;
  totalExposureInr: number;
  /** Passed explicitly rather than taken from the result object, because this page takes the
   *  findings it renders rather than the whole scan — but a per-finding table is where a ₹0 loss
   *  from an unpriced asset is most visible and least explicable without the reason. */
  dataQuality: DataQualityReport;
  expandedFindingId?: string | null;
}

/**
 * The header used to make two claims that were true of one scoring path and asserted of both.
 *
 * It said every finding is quantified "using CVSS, EPSS exploit likelihood, and business
 * criticality" — those are the deterministic formula's three inputs. The model does not use
 * business criticality at all; it uses the CVSS v3.1 sub-vectors rather than the base score, the
 * vulnerability class from the crosswalk, the asset kind and the organisation profile. And the
 * badge read `EAL = Risk × Asset Value × Likelihood`, which is the formula's shape, not the
 * model's: there, expected annual loss is P(KEV entry within 365 days) × the modelled loss band,
 * capped at the asset value, and the risk index is a restatement of that loss rather than an
 * input to it.
 *
 * So the header now describes whichever paths actually produced the rows below, and names them.
 */
export default function RiskQuantification({
  findings,
  model,
  totalExposureInr,
  dataQuality,
  expandedFindingId,
}: RiskQuantificationProps) {
  const modelled = model.byBasis.model.findings + model.byBasis.observed_kev.findings;
  const formulaic = model.byBasis.heuristic.findings;
  const mixed = modelled > 0 && formulaic > 0;

  return (
    <div className="space-y-6">
      {/* The same non-dismissible statement of origin the Overview carries. A reader who lands
          straight on this tab from the nav was previously shown the registry with no caveat. */}
      <ModelProvenanceBanner model={model} />
      <DataQualityBanner quality={dataQuality} label="the per-finding loss figures below" />

      {/* Title & Context Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Scan Findings &amp; Risk Quantification Registry
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Every scanner finding is mapped to its parent asset and quantified into an expected
              annual loss in rupees, then restated as a 0&ndash;100 index of that loss against the
              asset&apos;s stated value.{' '}
              {mixed ? (
                <>
                  {modelled} finding{modelled === 1 ? '' : 's'} below{' '}
                  {modelled === 1 ? 'was' : 'were'} quantified by the trained model and{' '}
                  {formulaic} by the deterministic formula. The two use different inputs, so the
                  column headings mean slightly different things row to row &mdash; expand any row
                  to see which.
                </>
              ) : modelled > 0 ? (
                <>
                  All {modelled} finding{modelled === 1 ? '' : 's'} below{' '}
                  {modelled === 1 ? 'was' : 'were'} quantified by the trained model: CVSS v3.1
                  sub-vectors, EPSS history, the NVD reference profile, the crosswalk vulnerability
                  class, asset kind and organisation profile.
                </>
              ) : (
                <>
                  All {formulaic} finding{formulaic === 1 ? '' : 's'} below{' '}
                  {formulaic === 1 ? 'was' : 'were'} quantified by the deterministic formula, from
                  the CVSS base score, EPSS, confirmed exploitation and business criticality. No
                  figure in this table is a model estimate.
                </>
              )}
            </p>
          </div>

          {/* One badge per path in use, and only for paths in use. A single formula printed over a
              mixed table is a claim about rows it does not describe. */}
          <div className="flex flex-col gap-1.5 self-start flex-shrink-0">
            {modelled > 0 && (
              <span
                className="text-[11px] bg-cyan-950/50 border border-cyan-500/30 px-3 py-1 rounded-lg text-cyan-300 font-mono"
                title="Model path: expected annual loss is the exploitation probability times the modelled loss band, capped at the asset value."
              >
                model: EAL = P(exploit | 365d) × min(loss, asset value)
              </span>
            )}
            {formulaic > 0 && (
              <span
                className="text-[11px] bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg text-amber-300 font-mono"
                title="Deterministic path: the risk index scales the asset value, and the likelihood factor is EPSS x 0.3 plus 0.18 if the CVE is in KEV, otherwise 0.08."
              >
                formula: EAL = index × asset value × likelihood
              </span>
            )}
          </div>
        </div>
      </div>

      {/* The registry's own total, split the way the money actually splits. */}
      <ExposureBasisNote
        model={model}
        totalExposureInr={totalExposureInr}
        label="the expected annual loss across this registry"
      />

      {/* Main Table with Expandable Explainable AI Panel */}
      <VulnTable findings={findings} initialExpandedId={expandedFindingId} />
    </div>
  );
}
