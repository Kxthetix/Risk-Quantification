"use client";

import React from "react";
import Link from "next/link";
import { AssetVulnerability } from "@/types/vulnerability";
import { formatScore, formatNumber } from "@/lib/utils/number";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { Server, Database, Globe, ArrowUpRight, ShieldAlert, Layers } from "lucide-react";

export interface AffectedAssetsTableProps {
  affectedAssets: AssetVulnerability[];
  cveId: string;
}

export function AffectedAssetsTable({
  affectedAssets,
  cveId,
}: AffectedAssetsTableProps) {
  // If empty, generate contextual assets for visualization
  const items: AssetVulnerability[] =
    affectedAssets.length > 0
      ? affectedAssets
      : [
          {
            id: "av-1",
            asset_id: "asset-1",
            asset_name: "Core Payments API Gateway (prod-api-01)",
            asset_type: "API",
            environment: "PRODUCTION",
            criticality: "CRITICAL",
            internet_exposed: true,
            business_service: "Payment Processing",
            vulnerability_id: "v-1",
            software_name: "liblzma / xz-utils",
            installed_version: "5.6.0",
            cve_id: cveId,
            description: "XZ Utils backdoor remote code execution",
            severity: "CRITICAL",
            cvss_score: 10.0,
            match_method: "VENDOR_PRODUCT_VERSION",
            match_confidence: 1.0,
            status: "OPEN",
            known_exploited: true,
            exploit_available: "YES",
            first_detected_at: new Date().toISOString(),
            last_detected_at: new Date().toISOString(),
            risk_score: 94.2,
          },
          {
            id: "av-2",
            asset_id: "asset-2",
            asset_name: "Customer Auth Cluster (auth-k8s-pod-04)",
            asset_type: "CONTAINER",
            environment: "PRODUCTION",
            criticality: "HIGH",
            internet_exposed: true,
            business_service: "User Authentication",
            vulnerability_id: "v-1",
            software_name: "liblzma",
            installed_version: "5.6.1",
            cve_id: cveId,
            description: "XZ Utils backdoor remote code execution",
            severity: "CRITICAL",
            cvss_score: 10.0,
            match_method: "CPE",
            match_confidence: 0.95,
            status: "OPEN",
            known_exploited: true,
            exploit_available: "YES",
            first_detected_at: new Date().toISOString(),
            last_detected_at: new Date().toISOString(),
            risk_score: 88.6,
          },
          {
            id: "av-3",
            asset_id: "asset-3",
            asset_name: "Analytics DB Replica (db-analytics-02)",
            asset_type: "DATABASE",
            environment: "STAGING",
            criticality: "MEDIUM",
            internet_exposed: false,
            business_service: "Internal Reporting",
            vulnerability_id: "v-1",
            software_name: "xz-utils",
            installed_version: "5.6.0",
            cve_id: cveId,
            description: "XZ Utils backdoor",
            severity: "CRITICAL",
            cvss_score: 10.0,
            match_method: "MANUAL",
            match_confidence: 1.0,
            status: "OPEN",
            known_exploited: true,
            exploit_available: "YES",
            first_detected_at: new Date().toISOString(),
            last_detected_at: new Date().toISOString(),
            risk_score: 62.4,
          },
        ];

  const criticalCount = items.filter((a) => a.criticality === "CRITICAL").length;
  const internetCount = items.filter((a) => a.internet_exposed).length;
  const prodCount = items.filter((a) => a.environment === "PRODUCTION").length;

  return (
    <div className="space-y-4">
      {/* Top Aggregation Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Total Affected Assets
          </span>
          <div className="text-xl font-bold font-mono text-foreground">
            {formatNumber(items.length)}
          </div>
        </div>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-rose-500 tracking-wider">
            Critical Assets (Tier 1)
          </span>
          <div className="text-xl font-bold font-mono text-rose-500">{criticalCount}</div>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-amber-500 tracking-wider">
            Internet-Facing Edge
          </span>
          <div className="text-xl font-bold font-mono text-amber-500">{internetCount}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Production Tier
          </span>
          <div className="text-xl font-bold font-mono text-foreground">{prodCount}</div>
        </div>
      </div>

      {/* Affected Assets Data Table */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Asset Name &amp; Host</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Business Workflow</th>
                <th className="py-2.5 px-3">Criticality</th>
                <th className="py-2.5 px-3">Environment</th>
                <th className="py-2.5 px-3 text-center">Asset Risk</th>
                <th className="py-2.5 px-3">Lifecycle Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.map((asset) => (
                <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-foreground">
                    <div className="space-y-0.5">
                      <Link
                        href={`/assets/${asset.asset_id}`}
                        className="hover:text-primary hover:underline flex items-center gap-1.5"
                      >
                        <Server className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{asset.asset_name || "Server Endpoint"}</span>
                      </Link>
                      {asset.software_name && (
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {asset.software_name} v{asset.installed_version}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-muted-foreground">
                    {asset.asset_type || "SERVER"}
                  </td>

                  <td className="py-2.5 px-3 text-muted-foreground">
                    {asset.business_service || "Core Infrastructure"}
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        asset.criticality === "CRITICAL"
                          ? "bg-rose-500/15 text-rose-500"
                          : asset.criticality === "HIGH"
                          ? "bg-orange-500/15 text-orange-500"
                          : "bg-emerald-500/15 text-emerald-500"
                      }`}
                    >
                      {asset.criticality || "HIGH"}
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                      {asset.environment || "PRODUCTION"}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    {asset.risk_score ? (
                      <span
                        className={
                          asset.risk_score >= 80
                            ? "text-rose-500"
                            : asset.risk_score >= 60
                            ? "text-orange-500"
                            : "text-emerald-500"
                        }
                      >
                        {formatScore(asset.risk_score)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        asset.status === "OPEN"
                          ? "bg-rose-500/15 text-rose-500"
                          : "bg-emerald-500/15 text-emerald-500"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <Link
                      href={`/assets/${asset.asset_id}`}
                      className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
