import React from 'react';
import { EnrichedFinding, formatINR } from '../utils/riskUtils';
import MetricBadge from './MetricBadge';
import { ArrowRight, Flame } from 'lucide-react';

interface TopRiskListProps {
  findings: EnrichedFinding[];
  onSelectFinding?: (findingId: string) => void;
}

export default function TopRiskList({ findings, onSelectFinding }: TopRiskListProps) {
  const top5 = findings.slice(0, 5);

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Top 5 High-Exposure Risk Threats
            </h3>
            <p className="text-xs text-slate-400">
              Ranked by AI Severity Score &amp; Financial Value-at-Risk
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Live Telemetry
        </span>
      </div>

      <div className="space-y-3">
        {top5.map((item, idx) => (
          <div
            key={item.finding_id}
            onClick={() => onSelectFinding?.(item.finding_id)}
            className="group relative flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg bg-slate-800/50 hover:bg-slate-800/90 border border-slate-700/60 hover:border-slate-600 transition duration-150 cursor-pointer gap-3"
          >
            {/* Rank + Asset Details */}
            <div className="flex items-start md:items-center gap-3">
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs ${
                  idx === 0
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                    : idx === 1
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                #{idx + 1}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                    {item.asset.asset_name}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
                    {item.asset.asset_type}
                  </span>
                  {item.actively_exploited && (
                    <span className="text-[10px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-bold">
                      Exploited in Wild
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                  <span className="text-cyan-400 font-semibold">{item.cve_id}</span>
                  <span className="text-slate-600">•</span>
                  <span>CVSS {item.cvss_score.toFixed(1)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400">EPSS {(item.epss_score * 100).toFixed(0)}%</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{item.vulnerability_name}</span>
                </div>
              </div>
            </div>

            {/* Scores and Losses */}
            <div className="flex items-center justify-between md:justify-end gap-5 pl-10 md:pl-0 border-t md:border-t-0 border-slate-700/40 pt-2 md:pt-0">
              <div className="text-left md:text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Expected Loss</div>
                <div className="text-sm font-bold text-emerald-300 font-mono">
                  {formatINR(item.expected_loss_inr, true)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">AI Risk</div>
                  <span className={`text-base font-extrabold font-mono ${item.tier.color}`}>
                    {item.computed_risk_score}
                  </span>
                </div>

                <div className="p-1.5 rounded-md bg-slate-800 text-slate-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
