"use client";

import React from "react";
import { SOCHitMapItem } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid, DollarSign, ShieldAlert } from "lucide-react";
import { useSOCRiskMap } from "../hooks";

export function SOCRiskHeatmap() {
  const { data, isLoading } = useSOCRiskMap();
  const items = data?.items || [];

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <Grid className="w-5 h-5 text-indigo-400" />
          Security Operations Risk Matrix Heatmap
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Multi-dimensional incident concentration by Asset Criticality vs Incident Severity vs Business Financial Loss.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading risk matrix heatmap...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No active risk concentrations.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                  item.risk_score >= 80
                    ? "bg-red-950/40 border-red-800/80 shadow-lg shadow-red-950/20"
                    : item.risk_score >= 60
                    ? "bg-amber-950/40 border-amber-800/80"
                    : "bg-slate-950/80 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      item.incident_severity === "CRITICAL"
                        ? "bg-red-900/50 text-red-300 border-red-700"
                        : "bg-amber-900/50 text-amber-300 border-amber-700"
                    }`}
                  >
                    {item.incident_severity} SEVERITY
                  </Badge>
                  <span className="font-mono text-xs font-bold text-slate-300">
                    Score: {item.risk_score.toFixed(1)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Asset Tier: {item.asset_criticality}</span>
                  <p className="text-sm font-bold text-slate-100 mt-0.5">{item.business_impact} BUSINESS IMPACT</p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{item.incident_count} Incidents</span>
                  <span className="font-mono text-red-400 font-bold">
                    ${(item.financial_exposure / 1000000).toFixed(1)}M USD
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
