import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendPoint, formatINR, TREND_IS_ILLUSTRATIVE, riskTrendDomain } from '../utils/riskUtils';
import { Calendar, ShieldCheck } from 'lucide-react';

interface RiskTrendChartProps {
  trendData: TrendPoint[];
}

export default function RiskTrendChart({ trendData }: RiskTrendChartProps) {
  const [metricMode, setMetricMode] = useState<'both' | 'score' | 'financial'>('both');
  // The axis window is computed in riskUtils, not here: it encodes the risk index's 0..100
  // log-scale range, and no harness in this project can execute JSX, so arithmetic that lives in
  // a component is arithmetic nothing checks. It replaced a hard-coded [30, 100] that clipped any
  // well-secured portfolio off the bottom of the chart.
  const domain = riskTrendDomain(trendData);
  // Whether the axis is a calendar at all. `iso` is null on every point when the scan file stated
  // no parseable date, and in that case the chart shows day offsets rather than invented days.
  const dated = trendData.length > 0 && trendData[trendData.length - 1].iso !== null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TrendPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5 mb-2 text-xs font-semibold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {/*
              The year comes from the point's own ISO date. It was a literal `(2026)`, which
              mislabels any scan from another year and is wrong even in 2026 whenever the 14-day
              window crosses a new year — a scan dated 05 Jan 2026 starts on 23 Dec 2025.
            */}
            <span>
              {data.iso ? `Timeline: ${data.date} (${data.iso.slice(0, 4)})` : `Timeline: ${data.day}`}
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between gap-4 text-cyan-300">
              <span>Risk Score:</span>
              <span className="font-bold">{data.riskScore} / 100</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-emerald-300">
              <span>Financial Exposure:</span>
              <span className="font-bold">{formatINR(data.financialExposure, true)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <h3 className="text-base font-semibold text-white">
              14-Day Risk &amp; Exposure Trajectory
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-wide bg-amber-500/15 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
              illustrative
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {TREND_IS_ILLUSTRATIVE}
          </p>
        </div>

        {/* Metric Switcher buttons */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 self-start sm:self-auto text-xs">
          <button
            onClick={() => setMetricMode('both')}
            className={`px-3 py-1 rounded font-medium transition ${
              metricMode === 'both' ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Combined
          </button>
          <button
            onClick={() => setMetricMode('score')}
            className={`px-3 py-1 rounded font-medium transition ${
              metricMode === 'score' ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Risk Score
          </button>
          <button
            onClick={() => setMetricMode('financial')}
            className={`px-3 py-1 rounded font-medium transition ${
              metricMode === 'financial' ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Financial Loss (₹)
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorExposure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            
            {/* Primary Left Y Axis for Risk Score — window derived from the data, see riskDomain */}
            <YAxis
              yAxisId="left"
              domain={domain}
              allowDataOverflow={false}
              stroke="#64748b"
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(v) => `${v}`}
            />

            {/* Secondary Right Y Axis for Financial Exposure */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => formatINR(v, true)}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              height={30}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
            />

            {(metricMode === 'both' || metricMode === 'score') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="riskScore"
                name="Risk Score (0-100)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRisk)"
              />
            )}

            {(metricMode === 'both' || metricMode === 'financial') && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="financialExposure"
                name="Financial Exposure (₹)"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorExposure)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <strong className="text-slate-200">Final point only:</strong> the last day is the risk index and exposure computed from this scan.
        </span>
        <span className="font-mono text-[11px] text-slate-500">
          {/*
            Two different statements, and the difference matters: an undated scan gets day offsets
            because there is nothing to date them against, not because the dates were omitted for
            brevity. The axis used to print a hard-coded calendar in exactly this case.
          */}
          {dated
            ? `Preceding 13 days: interpolated shape, not history · axis anchored on the scan date (${trendData[trendData.length - 1].iso})`
            : 'Preceding 13 days: interpolated shape, not history · the scan states no date, so the axis is day offsets'}
        </span>
        <span className="font-mono text-[11px] text-slate-500">
          Index axis {domain[0]}–{domain[1]} of 0–100
        </span>
      </div>
    </div>
  );
}
