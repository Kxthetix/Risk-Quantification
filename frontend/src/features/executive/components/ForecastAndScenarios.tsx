"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForecast, useRunScenario } from "../hooks";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { PERIOD_OPTIONS } from "../constants";
import { ScenarioCreateSchema, type ScenarioCreateFormData } from "../schemas";
import { CardSkeleton } from "./shared";
import { Play, AlertCircle, Loader2 } from "lucide-react";

const SCENARIO_COLORS = {
  historical: "#6366f1",
  baseline: "#6b7280",
  optimistic: "#22c55e",
  pessimistic: "#ef4444",
  upper: "#6366f1",
  lower: "#6366f1",
};

// ─── Forecast Chart ───────────────────────────────────────────────────────────

export function ForecastChart() {
  const [periodDays, setPeriodDays] = useState(90);
  const { data, isLoading, error } = useForecast(periodDays);

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ChartError message="Failed to load forecast" />;
  if (!data) return null;

  const allPoints = [
    ...data.historical.map((p) => ({
      date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      historical: p.projected_risk,
      isProjection: false,
    })),
    ...data.projected.map((p) => ({
      date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      projected: p.projected_risk,
      upper: p.confidence_upper,
      lower: p.confidence_lower,
      isProjection: true,
    })),
  ];

  const dividerDate = allPoints.find((p) => p.isProjection)?.date;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Risk Forecast</h3>
          <p className="text-xs text-yellow-400 mt-0.5">
            ⚠ Projections are estimates — not guaranteed outcomes
          </p>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.slice(1).map((opt) => (
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
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={allPoints} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} interval={Math.floor(allPoints.length / 8)} />
          <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
          />
          <Legend />
          {dividerDate && (
            <ReferenceLine
              x={dividerDate}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 2"
              label={{ value: "Today", position: "insideTopLeft", fontSize: 10, fill: "#9ca3af" }}
            />
          )}
          <Line type="monotone" dataKey="historical" name="Historical" stroke={SCENARIO_COLORS.historical} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="projected" name="Projected" stroke={SCENARIO_COLORS.baseline} strokeWidth={2} dot={false} strokeDasharray="6 3" />
          <Line type="monotone" dataKey="upper" name="Upper Bound" stroke={SCENARIO_COLORS.upper} strokeWidth={1} dot={false} strokeDasharray="2 4" opacity={0.4} />
          <Line type="monotone" dataKey="lower" name="Lower Bound" stroke={SCENARIO_COLORS.lower} strokeWidth={1} dot={false} strokeDasharray="2 4" opacity={0.4} />
        </LineChart>
      </ResponsiveContainer>

      {/* Scenario comparison */}
      {data.scenarios.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {data.scenarios.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-white/10 bg-slate-900/60 p-3"
            >
              <p className="text-xs font-medium text-gray-400">{s.label}</p>
              <p className="mt-1 text-lg font-bold text-white">{s.projected_risk.toFixed(1)}</p>
              <p className="text-xs text-green-400">
                ↓ {s.risk_reduction_pct.toFixed(1)}% reduction
              </p>
              <p className="text-xs text-gray-500">
                Investment: ₹{(s.investment / 100_000).toFixed(1)}L
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── What-If Scenario Panel ───────────────────────────────────────────────────

export function WhatIfScenarioPanel() {
  const [result, setResult] = useState<import("../types").ScenarioResult | null>(null);
  const { mutateAsync, isPending, error } = useRunScenario();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ScenarioCreateFormData>({
    resolver: zodResolver(ScenarioCreateSchema),
    defaultValues: {
      scenario_type: "remediation",
      parameters: { reduction_factor: 0.2, cost: 50000 },
    },
  });

  const onSubmit = async (data: ScenarioCreateFormData) => {
    const res = await mutateAsync(data);
    setResult(res);
  };

  const fmt = (v?: number) =>
    !v ? "—" : v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(1)} Cr` : `₹${(v / 100_000).toFixed(1)} L`;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-white">What-If Scenario Analysis</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Backend performs all calculations. Results are estimates only.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="text-xs text-gray-400">Scenario Name</label>
          <input
            {...register("name")}
            className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            placeholder="e.g. Patch critical vulns"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-400">Scenario Type</label>
          <select
            {...register("scenario_type")}
            className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="remediation">Remediation</option>
            <option value="control">Security Control</option>
            <option value="investment">Investment</option>
            <option value="asset_change">Asset Change</option>
            <option value="risk_treatment">Risk Treatment</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Risk Reduction Factor (0-1)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              {...register("parameters.reduction_factor", { valueAsNumber: true })}
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Investment Cost (₹)</label>
            <input
              type="number"
              step="10000"
              {...register("parameters.cost", { valueAsNumber: true })}
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Running Scenario…</>
          ) : (
            <><Play className="h-4 w-4" /> Run Scenario</>
          )}
        </button>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Failed to run scenario. Please try again.
          </div>
        )}
      </form>

      {/* Results */}
      {result && result.status === "completed" && result.current_state && result.projected_state && (
        <div className="mt-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
          <h4 className="mb-3 text-sm font-semibold text-indigo-300">Scenario Results</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Current State</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Score</span>
                  <span className="text-white font-medium">{result.current_state.risk_score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Financial Exposure</span>
                  <span className="text-orange-400">{fmt(result.current_state.financial_exposure)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Loss</span>
                  <span className="text-red-400">{fmt(result.current_state.expected_loss)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-green-500 uppercase">Projected State</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Score</span>
                  <span className="text-green-400 font-medium">{result.projected_state.risk_score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Financial Exposure</span>
                  <span className="text-green-400">{fmt(result.projected_state.financial_exposure)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Reduction</span>
                  <span className="text-green-400 font-bold">
                    {result.projected_state.risk_reduction_pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          {result.projected_state.roi && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2">
              <span className="text-xs text-gray-400">Estimated ROI:</span>
              <span className="text-sm font-bold text-green-400">
                {result.projected_state.roi.toFixed(1)}x
              </span>
              <span className="text-xs text-gray-500">(backend calculation — estimate only)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-xl border border-white/10 bg-slate-800/50 p-5">
      <div className="mb-4 h-4 w-40 rounded bg-slate-700" />
      <div className="h-60 rounded-lg bg-slate-700/50" />
    </div>
  );
}

function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-80 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-5">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}
