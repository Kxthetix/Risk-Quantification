"use client";

import { ArrowRight, AlertTriangle, TrendingDown, DollarSign, Shield, CheckCircle2 } from "lucide-react";
import { useRecommendations } from "../hooks";
import { RiskLevelBadge, CardSkeleton } from "./shared";

export function RecommendationsPanel({ limit = 5 }: { limit?: number }) {
  const { data, isLoading, error } = useRecommendations(limit, "risk_impact");

  if (isLoading) return <CardSkeleton className="h-64" />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <p className="text-sm text-red-400">Failed to load recommendations</p>
      </div>
    );
  }
  if (!data?.items.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-800/60 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400 mb-2" />
        <p className="text-gray-400">No recommendations available.</p>
      </div>
    );
  }

  const fmt = (v?: number) =>
    !v ? "—" : v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  const PRIORITY_ICONS: Record<string, React.ReactNode> = {
    Critical: <AlertTriangle className="h-4 w-4 text-red-400" />,
    High: <TrendingDown className="h-4 w-4 text-orange-400" />,
    Medium: <Shield className="h-4 w-4 text-yellow-400" />,
    Low: <DollarSign className="h-4 w-4 text-green-400" />,
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">Recommended Actions</h3>
        <a
          href="/executive/recommendations"
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
        >
          View all <ArrowRight className="h-3 w-3" />
        </a>
      </div>
      <div className="divide-y divide-white/5">
        {data.items.map((rec) => (
          <div key={rec.id} className="p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {PRIORITY_ICONS[rec.priority] ?? <Shield className="h-4 w-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                  <RiskLevelBadge level={rec.priority} />
                </div>
                <p className="mt-1 text-xs text-gray-400 line-clamp-2">{rec.reason}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs">
                  <span className="text-gray-500">
                    Risk reduction:{" "}
                    <span className="text-green-400 font-medium">
                      {rec.expected_risk_reduction.toFixed(1)} pts
                    </span>
                  </span>
                  {rec.estimated_cost && (
                    <span className="text-gray-500">
                      Cost:{" "}
                      <span className="text-yellow-400 font-medium">
                        {fmt(rec.estimated_cost)}
                      </span>
                    </span>
                  )}
                  {rec.expected_financial_benefit && (
                    <span className="text-gray-500">
                      Benefit:{" "}
                      <span className="text-green-400 font-medium">
                        {fmt(rec.expected_financial_benefit)}
                      </span>
                    </span>
                  )}
                </div>
                {rec.affected_assets.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {rec.affected_assets.slice(0, 3).map((asset) => (
                      <span
                        key={asset}
                        className="rounded bg-slate-700/60 px-1.5 py-0.5 text-xs text-gray-400"
                      >
                        {asset}
                      </span>
                    ))}
                    {rec.affected_assets.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{rec.affected_assets.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
