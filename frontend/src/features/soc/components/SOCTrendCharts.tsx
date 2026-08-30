"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useSOCTrends } from "../hooks";

export function SOCTrendCharts() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading } = useSOCTrends(period);
  const trends = data?.trends || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Incident Volume & Resolution Trend */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Incident Volume & Resolution Velocity
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Active incident rate versus successfully contained and resolved threats.
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {["7d", "30d", "90d"].map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "outline"}
                onClick={() => setPeriod(p)}
                className={`text-xs h-7 px-2.5 ${
                  period === p ? "bg-indigo-600 text-white" : "border-slate-800 bg-slate-950 text-slate-400"
                }`}
              >
                {p}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading trend telemetry...</div>
          ) : (
            <div className="space-y-3">
              {trends.map((pt, idx) => (
                <div key={idx} className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{pt.date}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Avg MTTR: <span className="font-mono text-indigo-300">{pt.avg_resolution_time_min}m</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-red-800 bg-red-950/40 text-red-300 text-[10px]">
                      {pt.critical_count} Critical
                    </Badge>
                    <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-300 text-[10px]">
                      {pt.resolved_count} Resolved
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Exposure Reduction Trend */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Financial Loss Exposure & Risk Reduction
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Quantified financial risk mitigated through automated SOAR playbook containment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading financial trends...</div>
          ) : (
            <div className="space-y-3">
              {trends.map((pt, idx) => (
                <div key={idx} className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{pt.date}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Potential Exposure: <span className="font-mono text-red-400">${(pt.potential_loss / 1000000).toFixed(2)}M</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-400 font-bold block">
                      +${(pt.risk_reduced / 1000000).toFixed(2)}M Saved
                    </span>
                    <span className="text-[10px] text-slate-500">Actual: ${(pt.actual_loss / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
