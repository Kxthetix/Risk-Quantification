"use client";

import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTopRisks } from "../hooks";
import { RiskLevelBadge, CardSkeleton } from "./shared";
import { RISK_LEVEL_COLORS } from "../constants";
import type { RiskLevel } from "../types";

// ─── Risk Heatmap ─────────────────────────────────────────────────────────────

interface HeatmapCell {
  likelihood: number;
  impact: number;
  count: number;
  level: RiskLevel;
  risks: string[];
}

const LIKELIHOOD_LABELS = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];
const IMPACT_LABELS = ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"];

function getHeatmapLevel(likelihood: number, impact: number): RiskLevel {
  const score = likelihood * impact;
  if (score >= 16) return "Critical";
  if (score >= 9) return "High";
  if (score >= 4) return "Medium";
  if (score >= 2) return "Low";
  return "Minimal";
}

export function RiskHeatmap() {
  const { data, isLoading, error } = useTopRisks(50);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  if (isLoading) return <CardSkeleton className="h-80" />;
  if (error) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <p className="text-sm text-red-400">Failed to load risk heatmap</p>
      </div>
    );
  }

  // Build 5x5 heatmap matrix
  const matrix: HeatmapCell[][] = Array.from({ length: 5 }, (_, impact) =>
    Array.from({ length: 5 }, (_, likelihood) => ({
      likelihood: likelihood + 1,
      impact: impact + 1,
      count: 0,
      level: getHeatmapLevel(likelihood + 1, impact + 1),
      risks: [],
    }))
  );

  if (data?.items) {
    for (const risk of data.items) {
      const lh = Math.max(1, Math.min(5, Math.round(risk.likelihood * 5)));
      const imp = Math.max(1, Math.min(5, Math.round(risk.impact * 5)));
      matrix[imp - 1][lh - 1].count += 1;
      matrix[imp - 1][lh - 1].risks.push(risk.title);
    }
  }

  const levelColorMap: Record<RiskLevel, string> = {
    Critical: "rgba(239,68,68,0.8)",
    High: "rgba(249,115,22,0.7)",
    Medium: "rgba(234,179,8,0.6)",
    Low: "rgba(34,197,94,0.5)",
    Minimal: "rgba(107,114,128,0.3)",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
      <h3 className="mb-4 font-semibold text-white">Risk Heatmap</h3>
      <div className="flex gap-4">
        {/* Y-axis label */}
        <div className="flex items-center">
          <span
            className="text-xs font-medium text-gray-400"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Impact →
          </span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-1">
            {[...matrix].reverse().map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <button
                  key={`${rIdx}-${cIdx}`}
                  aria-label={`${LIKELIHOOD_LABELS[cell.likelihood - 1]} likelihood, ${IMPACT_LABELS[cell.impact - 1]} impact, ${cell.level} risk, ${cell.count} items`}
                  className="relative flex aspect-square items-center justify-center rounded-md text-sm font-bold text-white transition-transform hover:scale-105"
                  style={{ backgroundColor: levelColorMap[cell.level] }}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {cell.count > 0 ? cell.count : ""}
                </button>
              ))
            )}
          </div>
          {/* X-axis labels */}
          <div className="mt-2 grid grid-cols-5 gap-1">
            {LIKELIHOOD_LABELS.map((l) => (
              <span key={l} className="text-center text-xs text-gray-500">
                {l}
              </span>
            ))}
          </div>
          <p className="mt-1 text-center text-xs text-gray-400">Likelihood →</p>
        </div>
      </div>
      {/* Tooltip */}
      {hoveredCell && hoveredCell.count > 0 && (
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-900/80 p-3">
          <div className="flex items-center gap-2 mb-2">
            <RiskLevelBadge level={hoveredCell.level} />
            <span className="text-sm text-gray-300">
              {hoveredCell.count} risk{hoveredCell.count > 1 ? "s" : ""}
            </span>
          </div>
          <ul className="space-y-1">
            {hoveredCell.risks.slice(0, 3).map((r, i) => (
              <li key={i} className="text-xs text-gray-400">• {r}</li>
            ))}
            {hoveredCell.risks.length > 3 && (
              <li className="text-xs text-gray-500">+{hoveredCell.risks.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {(["Critical", "High", "Medium", "Low", "Minimal"] as RiskLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: levelColorMap[level] }}
            />
            <span className="text-xs text-gray-400">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Risks Table ──────────────────────────────────────────────────────────

export function TopRisksTable({ limit = 10 }: { limit?: number }) {
  const { data, isLoading, error } = useTopRisks(limit);

  if (isLoading) return <CardSkeleton className="h-64" />;
  if (error) return <div className="text-sm text-red-400">Failed to load top risks</div>;
  if (!data?.items.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-800/60 p-8 text-center">
        <p className="text-gray-400">No critical risks identified.</p>
      </div>
    );
  }

  const fmt = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">Top Risks</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Likelihood</th>
              <th className="px-4 py-3">Impact</th>
              <th className="px-4 py-3">Financial Exposure</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((risk, i) => (
              <tr
                key={risk.risk_id}
                className="border-b border-white/5 transition-colors hover:bg-white/5"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{risk.title}</div>
                  {risk.asset_name && (
                    <div className="text-xs text-gray-400">{risk.asset_name}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-300">{risk.category}</td>
                <td className="px-4 py-3">
                  <RiskLevelBadge level={risk.level} />
                </td>
                <td className="px-4 py-3 text-gray-300">{(risk.likelihood * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 text-gray-300">{(risk.impact * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 font-mono text-orange-400">{fmt(risk.financial_exposure)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${risk.risk_score}%`,
                          backgroundColor: RISK_LEVEL_COLORS[risk.level],
                        }}
                      />
                    </div>
                    <span className="text-gray-300">{risk.risk_score.toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-700/50 px-2 py-0.5 text-xs text-gray-300">
                    {risk.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
