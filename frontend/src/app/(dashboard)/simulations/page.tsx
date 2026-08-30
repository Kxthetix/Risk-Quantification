"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Cpu, ExternalLink, CheckCircle2 } from "lucide-react";

export default function SimulationsHistoryPage() {
  const { currency } = useOrganization();

  const simulationRuns = [
    {
      id: "sim-job-001",
      scenario_name: "Double-Extortion Ransomware on Core Payment Gateways",
      status: "COMPLETED",
      iterations: 50000,
      eal: 18000000,
      p95: 54000000,
      model_version: "2.4.1",
      completed_at: new Date().toISOString(),
    },
    {
      id: "sim-job-002",
      scenario_name: "Cloud IAM Privilege Escalation & Data Exfiltration",
      status: "COMPLETED",
      iterations: 50000,
      eal: 12000000,
      p95: 36000000,
      model_version: "2.4.1",
      completed_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    },
    {
      id: "sim-job-003",
      scenario_name: "Customer PII Database Exfiltration Breach",
      status: "COMPLETED",
      iterations: 100000,
      eal: 9600000,
      p95: 32000000,
      model_version: "2.4.1",
      completed_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/risk-quantification"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Monte Carlo Simulation Runs</h1>
            <p className="text-xs text-muted-foreground">
              Audit ledger of executed numerical simulations, model versions, and convergence records.
            </p>
          </div>
        </div>

        <Button size="sm" asChild className="text-xs h-8 gap-1.5">
          <Link href="/risk-quantification">
            <Play className="h-3.5 w-3.5" />
            <span>Launch New Simulation</span>
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Simulation ID &amp; Target Model</th>
                <th className="py-2.5 px-3 text-center">Iterations</th>
                <th className="py-2.5 px-3 text-right">Expected Loss (EAL)</th>
                <th className="py-2.5 px-3 text-right">P95 Loss</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 font-mono">Model Version</th>
                <th className="py-2.5 px-4 text-right">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {simulationRuns.map((sim) => (
                <tr key={sim.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-foreground">
                    <div className="space-y-0.5">
                      <Link
                        href={`/simulations/${sim.id}`}
                        className="font-mono text-primary hover:underline font-bold"
                      >
                        {sim.id}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">{sim.scenario_name}</div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center font-mono">
                    {sim.iterations.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(sim.eal, { currency, compact: true })}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-500">
                    {formatCurrency(sim.p95, { currency, compact: true })}
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="rounded bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 text-[10px] font-bold">
                      {sim.status}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                    v{sim.model_version}
                  </td>

                  <td className="py-2.5 px-4 text-right font-mono text-[11px] text-muted-foreground">
                    {formatDateTime(sim.completed_at)}
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
