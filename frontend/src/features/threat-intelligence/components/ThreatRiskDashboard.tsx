"use client";

import React from "react";
import { ThreatActivity, ThreatGeographyItem, ThreatRisk } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Globe, TrendingUp, DollarSign, Activity, AlertTriangle } from "lucide-react";

interface ThreatRiskDashboardProps {
  risk?: ThreatRisk;
  activity?: ThreatActivity;
  geography?: ThreatGeographyItem[];
  isLoading?: boolean;
}

export function ThreatRiskDashboard({ risk, activity, geography, isLoading }: ThreatRiskDashboardProps) {
  if (isLoading || !risk) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <Card className="h-64 bg-slate-900/50 border-slate-800" />
        <Card className="h-64 bg-slate-900/50 border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Threat Risk Posture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900 border-red-900/40 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-300 uppercase tracking-wider">Threat Exposure Score</p>
                <p className="text-3xl font-extrabold text-red-400 mt-2">{risk.threat_exposure_score.toFixed(1)}/100</p>
                <p className="text-xs text-slate-400 mt-1">Based on {risk.targeted_assets_count} targeted assets</p>
              </div>
              <div className="p-3 bg-red-950/60 rounded-xl border border-red-800 text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border-purple-900/40 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Financial Loss Exposure</p>
                <p className="text-3xl font-extrabold text-purple-400 mt-2">
                  ${(risk.financial_loss_exposure / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-slate-400 mt-1">P90 Tail Risk: ${(risk.p90_loss_exposure / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-3 bg-purple-950/60 rounded-xl border border-purple-800 text-purple-400">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-900/40 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Active Adversary Cartels</p>
                <p className="text-3xl font-extrabold text-indigo-400 mt-2">{risk.active_threat_actors_count}</p>
                <p className="text-xs text-slate-400 mt-1">{risk.active_campaigns_count} active campaigns tracked</p>
              </div>
              <div className="p-3 bg-indigo-950/60 rounded-xl border border-indigo-800 text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline and Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Threat Activity & Anomaly Velocity (Last 30 Days)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Aggregated volume of security events, alerts, and adversary IOC hits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity?.points.map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="font-mono text-slate-400">{new Date(pt.timestamp).toLocaleDateString()}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-300">{pt.events_count.toLocaleString()} Events</span>
                  <span className="text-amber-400 font-semibold">{pt.alerts_count} Alerts</span>
                  <span className="text-red-400 font-bold">{pt.incidents_count} Incidents</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Threat Geography */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Adversary Geographic Origins & Ingress Routes
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Correlated source regions for external reconnaissance, C2 traffic, and DDoS probing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {geography?.map((geo) => (
              <div
                key={geo.source_country_code}
                className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-200">{geo.source_country}</span>
                    <Badge variant="outline" className="text-[10px] border-slate-700 bg-slate-800 text-slate-400">
                      {geo.source_country_code}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{geo.threat_type}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-indigo-300">
                    {geo.event_count.toLocaleString()} Events
                  </span>
                  <div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] mt-0.5 ${
                        geo.risk_level === "CRITICAL"
                          ? "bg-red-950/40 text-red-400 border-red-800"
                          : "bg-amber-950/40 text-amber-400 border-amber-800"
                      }`}
                    >
                      {geo.risk_level}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
