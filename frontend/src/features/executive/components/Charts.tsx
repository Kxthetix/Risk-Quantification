"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { useRiskTrend, useRiskDrivers, useFinancialRiskTrend, useLossDistribution } from "../hooks";
import { PERIOD_OPTIONS, RISK_TREND_COLORS, FINANCIAL_RISK_COLORS, DRIVER_COLORS } from "../constants";
import { CardSkeleton } from "./shared";

// ─── Risk Trend Chart ─────────────────────────────────────────────────────────

export function RiskTrendChart() {
  const [periodDays, setPeriodDays] = useState(30);
  const { data, isLoading, error } = useRiskTrend(periodDays);

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ChartError message="Failed to load risk trend" />;
  if (!data) return null;

  const chartData = data.points.map((p) => ({
    date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    cyber: p.cyber_risk,
    financial: p.financial_risk,
    operational: p.operational_risk,
    compliance: p.compliance_risk,
  }));

  const summary = data.points.length >= 2
    ? `Cyber risk ${
        data.points[data.points.length - 1].cyber_risk >
        data.points[0].cyber_risk
          ? "increased"
          : "decreased"
      } from ${data.points[0].cyber_risk.toFixed(1)} to ${data.points[
        data.points.length - 1
      ].cyber_risk.toFixed(1)} during the selected period.`
    : "";

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-white">Risk Trend</h3>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriodDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                periodDays === opt.value
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only">{summary}</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend />
          <Line type="monotone" dataKey="cyber" name="Cyber Risk" stroke={RISK_TREND_COLORS.cyber_risk} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="financial" name="Financial Risk" stroke={RISK_TREND_COLORS.financial_risk} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="operational" name="Operational Risk" stroke={RISK_TREND_COLORS.operational_risk} strokeWidth={2} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="compliance" name="Compliance Risk" stroke={RISK_TREND_COLORS.compliance_risk} strokeWidth={2} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Risk Driver Chart ─────────────────────────────────────────────────────────

export function RiskDriverChart() {
  const { data, isLoading, error } = useRiskDrivers(30);

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ChartError message="Failed to load risk drivers" />;
  if (!data) return null;

  const chartData = data.drivers.map((d, i) => ({
    name: d.driver,
    value: d.contribution,
    fill: DRIVER_COLORS[i % DRIVER_COLORS.length],
  }));

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
      <h3 className="mb-4 font-semibold text-white">Risk Drivers</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <XAxis type="number" domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} width={75} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, "Contribution"]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Financial Risk Trend Chart ───────────────────────────────────────────────

export function FinancialRiskTrendChart() {
  const [periodDays, setPeriodDays] = useState(30);
  const { data, isLoading, error } = useFinancialRiskTrend(periodDays);

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ChartError message="Failed to load financial risk trend" />;
  if (!data) return null;

  const fmt = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  const chartData = data.points.map((p) => ({
    date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    potential: p.potential_loss,
    expected: p.expected_loss,
    reduction: p.risk_reduction,
  }));

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-white">Financial Risk Trend</h3>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.slice(0, 4).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriodDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                periodDays === opt.value
                  ? "bg-orange-600 text-white"
                  : "text-gray-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={fmt} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
            formatter={(v: number) => [fmt(v)]}
          />
          <Legend />
          <Line type="monotone" dataKey="potential" name="Potential Loss" stroke={FINANCIAL_RISK_COLORS.potential_loss} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expected" name="Expected Loss" stroke={FINANCIAL_RISK_COLORS.expected_loss} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="reduction" name="Risk Reduction" stroke={FINANCIAL_RISK_COLORS.risk_reduction} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Loss Distribution Chart ──────────────────────────────────────────────────

export function LossDistributionChart() {
  const { data, isLoading, error } = useLossDistribution();

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ChartError message="Failed to load loss distribution" />;
  if (!data) return null;

  const fmt = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  const histogram = data.histogram_buckets.map((b, i) => ({
    range: `${fmt(Number(b.range_start))}`,
    frequency: b.frequency,
    fill: i < 3 ? "#22c55e" : i < 6 ? "#eab308" : "#ef4444",
  }));

  const p50 = data.percentiles.find((p) => p.percentile === "P50");
  const p90 = data.percentiles.find((p) => p.percentile === "P90");
  const p95 = data.percentiles.find((p) => p.percentile === "P95");
  const p99 = data.percentiles.find((p) => p.percentile === "P99");

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
      <h3 className="mb-1 font-semibold text-white">Loss Distribution</h3>
      <p className="mb-4 text-xs text-gray-400">Monte Carlo percentile results — not generated in browser</p>
      <div className="mb-4 grid grid-cols-4 gap-3">
        {[p50, p90, p95, p99].map((p) => (
          p && (
            <div key={p.percentile} className="rounded-lg bg-slate-900/60 p-3 text-center">
              <div className="text-xs font-bold text-indigo-400">{p.percentile}</div>
              <div className="mt-1 text-sm font-semibold text-white">{fmt(p.value)}</div>
              <div className="text-xs text-gray-500">{(p.probability * 100).toFixed(0)}%</div>
            </div>
          )
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={histogram} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <XAxis dataKey="range" stroke="#6b7280" tick={{ fontSize: 10 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
            formatter={(v: number) => [v, "Frequency"]}
          />
          <Bar dataKey="frequency" radius={[2, 2, 0, 0]}>
            {histogram.map((entry, index) => (
              <Cell key={index} fill={entry.fill} opacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="sr-only">
        Loss distribution shows probability of financial loss. P50 is {fmt(p50?.value ?? 0)},
        P90 is {fmt(p90?.value ?? 0)}, P99 is {fmt(p99?.value ?? 0)}.
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-72 animate-pulse rounded-xl border border-white/10 bg-slate-800/50 p-5">
      <div className="mb-4 h-4 w-40 rounded bg-slate-700" />
      <div className="h-52 rounded-lg bg-slate-700/50" />
    </div>
  );
}

function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-5">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}
