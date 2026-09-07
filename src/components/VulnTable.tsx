import React, { useState, useMemo } from 'react';
import {
  EnrichedFinding,
  formatINR,
  CRITICALITY_WEIGHTS,
  computeFindingRiskScore,
  heuristicExploitFactor,
  riskTierBoundaryLabel
} from '../utils/riskUtils';
import MetricBadge from './MetricBadge';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Brain,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertOctagon,
  ArrowUpDown,
  Filter,
  Flame
} from 'lucide-react';

interface VulnTableProps {
  findings: EnrichedFinding[];
  initialExpandedId?: string | null;
}

type SortField = 'computed_risk_score' | 'expected_loss_inr' | 'cvss_score' | 'epss_score';
type SortOrder = 'desc' | 'asc';

export default function VulnTable({ findings, initialExpandedId }: VulnTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCriticality, setSelectedCriticality] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('computed_risk_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(initialExpandedId || null);

  // Filter and sort
  const filteredFindings = useMemo(() => {
    return findings
      .filter((item) => {
        const matchesSearch =
          item.asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.vulnerability_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.asset.asset_type === selectedCategory;
        const matchesCriticality = selectedCriticality === 'All' || item.asset.business_criticality === selectedCriticality;
        return matchesSearch && matchesCategory && matchesCriticality;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'computed_risk_score') diff = a.computed_risk_score - b.computed_risk_score;
        if (sortField === 'expected_loss_inr') diff = a.expected_loss_inr - b.expected_loss_inr;
        if (sortField === 'cvss_score') diff = a.cvss_score - b.cvss_score;
        if (sortField === 'epss_score') diff = a.epss_score - b.epss_score;
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [findings, searchTerm, selectedCategory, selectedCriticality, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const categories = ['All', 'Database', 'Identity', 'Network', 'Application', 'Infrastructure'];
  const criticalities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search asset, CVE ID (e.g. CVE-2024-3400), or vulnerability..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-300">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400">
            <span className="font-semibold text-slate-300">Criticality:</span>
            <select
              value={selectedCriticality}
              onChange={(e) => setSelectedCriticality(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              {criticalities.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono ml-auto">
            Showing {filteredFindings.length} of {findings.length} findings
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Asset &amp; Category</th>
              <th className="py-3 px-4">Vulnerability (CVE)</th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition"
                onClick={() => toggleSort('cvss_score')}
              >
                <div className="flex items-center gap-1">
                  CVSS
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition"
                onClick={() => toggleSort('epss_score')}
              >
                <div className="flex items-center gap-1">
                  EPSS (Exploit)
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Criticality</th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition"
                onClick={() => toggleSort('computed_risk_score')}
              >
                <div className="flex items-center gap-1">
                  AI Risk Score
                  <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition text-right"
                onClick={() => toggleSort('expected_loss_inr')}
              >
                <div className="flex items-center justify-end gap-1">
                  Expected Loss (₹)
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Explain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredFindings.map((item) => {
              const isExpanded = expandedRowId === item.finding_id;
              return (
                <React.Fragment key={item.finding_id}>
                  <tr
                    onClick={() => toggleRow(item.finding_id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isExpanded
                        ? 'bg-slate-800/80 border-l-2 border-cyan-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Asset Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">{item.asset.asset_name}</div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                          {item.asset.asset_type}
                        </span>
                        <span>Val: {formatINR(item.asset.estimated_asset_value_inr, true)}</span>
                      </div>
                    </td>

                    {/* CVE */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-cyan-400 font-semibold text-xs flex items-center gap-1.5">
                        <span>{item.cve_id}</span>
                        {item.actively_exploited && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-sans font-bold">
                            <Flame className="w-2.5 h-2.5" /> Exploited
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5" title={item.vulnerability_name}>
                        {item.vulnerability_name}
                      </div>
                    </td>

                    {/* CVSS */}
                    <td className="py-3.5 px-3 font-mono text-xs">
                      <span
                        className={`font-bold ${
                          item.cvss_score >= 9.0
                            ? 'text-red-400'
                            : item.cvss_score >= 7.0
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {item.cvss_score.toFixed(1)}
                      </span>
                    </td>

                    {/* EPSS */}
                    <td className="py-3.5 px-3 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            item.epss_score >= 0.7
                              ? 'text-red-400'
                              : item.epss_score >= 0.4
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {(item.epss_score * 100).toFixed(0)}%
                        </span>
                        {item.epss_score >= 0.7 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        )}
                      </div>
                    </td>

                    {/* Criticality */}
                    <td className="py-3.5 px-3">
                      <MetricBadge
                        label={item.asset.business_criticality}
                        variant={
                          item.asset.business_criticality === 'Critical'
                            ? 'critical'
                            : item.asset.business_criticality === 'High'
                            ? 'high'
                            : item.asset.business_criticality === 'Medium'
                            ? 'medium'
                            : 'low'
                        }
                        size="sm"
                      />
                    </td>

                    {/* AI Risk Score */}
                    <td className="py-3.5 px-3 font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-extrabold ${item.tier.color}`}>
                          {item.computed_risk_score}
                        </span>
                        <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              item.computed_risk_score >= 75
                                ? 'bg-red-500'
                                : item.computed_risk_score >= 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.computed_risk_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Expected Financial Loss */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-300 text-sm">
                      {formatINR(item.expected_loss_inr, true)}
                    </td>

                    {/* Toggle Icon */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(item.finding_id);
                        }}
                        className={`p-1 rounded-md transition ${
                          isExpanded ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDABLE EXPLAINABLE AI PANEL */}
                  {isExpanded && (
                    <tr className="bg-slate-950/90 border-b border-slate-800">
                      <td colSpan={8} className="p-5">
                        <div className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-5 shadow-2xl space-y-4">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                <Brain className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>Explainable Risk Reasoning</span>
                                  {item.score_basis === 'model' && (
                                    <span className="text-[11px] font-mono font-normal bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                                      trained model
                                    </span>
                                  )}
                                  {item.score_basis === 'observed_kev' && (
                                    <span className="text-[11px] font-mono font-normal bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded">
                                      observed exploitation
                                    </span>
                                  )}
                                  {item.score_basis === 'heuristic' && (
                                    <span className="text-[11px] font-mono font-normal bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                                      deterministic formula
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-slate-400">
                                  {item.score_basis === 'heuristic'
                                    ? `Derived from the ${item.cve_id} fields in this scan file by a stated formula — not fitted to historical outcomes.`
                                    : `Derived from the ${item.cve_id} record by models fitted on CISA KEV outcomes and VERIS incident losses.`}
                                </p>
                              </div>
                            </div>

                            <div className="text-right font-mono text-xs">
                              <span className="text-slate-400">Calculated EAL:</span>{' '}
                              <span className="font-bold text-emerald-300 text-sm">
                                {formatINR(item.expected_loss_inr)}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Plain-English Explanation String */}
                          <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/30 text-xs flex items-start gap-3">
                            <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <strong className="text-red-300 font-semibold uppercase tracking-wide">
                                Plain-English Explanation:
                              </strong>
                              <p className="text-slate-200 leading-relaxed font-sans text-sm">
                                {item.ai_explanation}
                              </p>
                            </div>
                          </div>

                          {/* Description and Math Trace */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                              <h5 className="font-semibold text-cyan-300 flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Scanner Vulnerability Description
                              </h5>
                              <p className="text-slate-300 leading-relaxed">
                                {item.description}
                              </p>
                              <div className="pt-2 text-[11px] text-slate-400 font-mono">
                                Data Sensitivity: <span className="text-amber-300">{item.asset.data_sensitivity}</span>
                              </div>
                            </div>

                            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2 font-mono">
                              <h5 className="font-semibold text-amber-300 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                {item.model_score ? 'Computation Trace (Trained Model)' : 'Computation Trace (Fallback Formula)'}
                              </h5>

                              {item.model_score ? (
                                <div className="space-y-1 text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800">
                                  <div>
                                    <span className="text-slate-500">1. Vulnerability class:</span>{' '}
                                    <span className="text-white">
                                      {item.model_score.vulnClass.key ?? 'unmatched'}
                                    </span>{' '}
                                    <span className="text-slate-500">
                                      (via {item.model_score.vulnClass.method}
                                      {item.model_score.vulnClass.matched ? `: ${item.model_score.vulnClass.matched}` : ''})
                                    </span>
                                  </div>
                                  {item.model_score.probabilityBasis === 'observed_kev' ? (
                                    <div>
                                      <span className="text-slate-500">2. P(exploit ≤ 365d):</span>{' '}
                                      <span className="text-red-300 font-bold">100%</span>{' '}
                                      <span className="text-slate-500">— observed in CISA KEV, not predicted</span>
                                    </div>
                                  ) : (
                                    <>
                                      <div>
                                        <span className="text-slate-500">2. Ensemble raw score:</span>{' '}
                                        <span className="text-white">
                                          {item.model_score.rawScore?.toFixed(4) ?? '—'}
                                        </span>
                                        <span className="text-slate-500">
                                          {' '}→ sigmoid {((item.model_score.uncalibratedProbability ?? 0) * 100).toFixed(2)}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">3. Isotonic calibration:</span>{' '}
                                        <span className="text-cyan-300 font-bold">
                                          {(item.model_score.exploitProbability * 100).toFixed(2)}%
                                        </span>{' '}
                                        <span className="text-slate-500">P(enters KEV ≤ 365d)</span>
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <span className="text-slate-500">4. Loss band (VERIS, 80%):</span>{' '}
                                    <span className="text-white">
                                      {formatINR(item.model_score.lossInr.p10, true)} – {formatINR(item.model_score.lossInr.p90, true)}
                                    </span>
                                    {item.model_score.lossCappedAtAssetValue && (
                                      <span className="text-amber-400"> (capped at asset value)</span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">5. Feature completeness:</span>{' '}
                                    <span className="text-white">
                                      {(item.model_score.exploitProvenance.completeness * 100).toFixed(0)}% exploitation,{' '}
                                      {(item.model_score.severityProvenance.completeness * 100).toFixed(0)}% severity
                                    </span>
                                    {item.model_score.exploitProvenance.unobserved.length > 0 && (
                                      <span className="text-slate-500">
                                        {' '}({item.model_score.exploitProvenance.unobserved.length} column
                                        {item.model_score.exploitProvenance.unobserved.length === 1 ? '' : 's'} unobserved)
                                      </span>
                                    )}
                                  </div>
                                  <div className="border-t border-slate-800 pt-1 text-emerald-300">
                                    <span>EAL = P(exploit) × loss = {formatINR(item.expected_loss_inr)}</span>
                                    <br />
                                    <span className="text-slate-400">
                                      Risk index {item.computed_risk_score}/100 ={' '}
                                      {riskTierBoundaryLabel(item.computed_risk_score)} of asset value per year
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1 text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800">
                                  <div className="text-amber-400/90 font-sans pb-1">
                                    No trained-model figure for this finding — the deterministic formula was used.
                                  </div>
                                  <div>
                                    <span className="text-slate-500">1. Norm CVSS:</span>{' '}
                                    <span className="text-white">{(item.cvss_score / 10).toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">2. Exploit EPSS Factor:</span>{' '}
                                    <span className="text-white">
                                      {heuristicExploitFactor(item.epss_score, item.actively_exploited).toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">3. Crit. Weight:</span>{' '}
                                    <span className="text-white">
                                      {CRITICALITY_WEIGHTS[item.asset.business_criticality]}x ({item.asset.business_criticality})
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">4. Formula score:</span>{' '}
                                    <span className="text-white">
                                      {computeFindingRiskScore(
                                        item.cvss_score,
                                        item.epss_score,
                                        item.actively_exploited,
                                        item.asset.business_criticality
                                      )}
                                      /100
                                    </span>
                                  </div>
                                  <div className="border-t border-slate-800 pt-1 text-emerald-300">
                                    <span>EAL = Score × Asset Value × Likelihood</span>
                                    <br />
                                    <span className="font-bold">= {formatINR(item.expected_loss_inr)}</span>
                                    <br />
                                    <span className="text-slate-400">
                                      Risk index {item.computed_risk_score}/100 ={' '}
                                      {riskTierBoundaryLabel(item.computed_risk_score)} of asset value per year
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
