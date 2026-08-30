"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTopRisks } from "@/features/executive/hooks";
import { RiskLevelBadge } from "@/features/executive/components/shared";
import { RiskAcceptanceForm } from "@/features/risk-register/components/RiskAcceptanceForm";
import { RISK_LEVEL_COLORS } from "@/features/executive/constants";
import { ShieldAlert, CircleDollarSign, Plus, User, HelpCircle, Check, X, ShieldAlert as AlertIcon, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RiskRegisterPage() {
  const { data, isLoading, error, refetch } = useTopRisks(50);
  const [selectedRisk, setSelectedRisk] = useState<any | null>(null);
  const [acceptanceRiskId, setAcceptanceRiskId] = useState<string | null>(null);

  const fmt = (v: number) =>
    v >= 10_000_000
      ? `₹${(v / 10_000_000).toFixed(1)} Cr`
      : v >= 100_000
      ? `₹${(v / 100_000).toFixed(1)} L`
      : `₹${(v / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Risk Register"
        description="Comprehensive repository of identified corporate cybersecurity risks, quantitative loss models, and treatment states."
        breadcrumbs={[{ label: "Risk Management" }, { label: "Risk Register" }]}
      />

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
          Failed to load risk register.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center p-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 bg-slate-900/40">
                  <th className="px-4 py-3">ID / Ref</th>
                  <th className="px-4 py-3">Risk Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Financial Exposure</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Treatment Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((risk, i) => (
                  <tr
                    key={risk.risk_id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5 text-gray-300"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400 font-bold">
                      RSK-{1000 + i}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{risk.title}</div>
                      {risk.asset_name && (
                        <div className="text-xs text-gray-400 mt-0.5">{risk.asset_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{risk.category}</td>
                    <td className="px-4 py-3">
                      <RiskLevelBadge level={risk.level} />
                    </td>
                    <td className="px-4 py-3 font-mono text-orange-400 font-medium">
                      {fmt(risk.financial_exposure)}
                    </td>
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
                        <span className="font-mono text-xs">{risk.risk_score.toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-700/50 px-2.5 py-0.5 text-xs text-gray-300">
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedRisk(risk)}
                          className="inline-flex items-center gap-1 rounded bg-slate-700 hover:bg-slate-600 px-2.5 py-1 text-xs text-white transition-colors"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                        <button
                          onClick={() => setAcceptanceRiskId(risk.risk_id)}
                          className="inline-flex items-center gap-1 rounded bg-indigo-600/90 hover:bg-indigo-600 px-2.5 py-1 text-xs text-white transition-colors"
                        >
                          Accept Risk
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risk Details Modal */}
      {selectedRisk && (
        <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
          <DialogContent className="border-white/10 bg-slate-900 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{selectedRisk.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Category</span>
                  <span className="font-medium text-white">{selectedRisk.category}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Risk Level</span>
                  <RiskLevelBadge level={selectedRisk.level} className="mt-1" />
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Likelihood</span>
                  <span className="font-medium text-white">{(selectedRisk.likelihood * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Impact</span>
                  <span className="font-medium text-white">{(selectedRisk.impact * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Financial Exposure</span>
                  <span className="font-bold text-orange-400">{fmt(selectedRisk.financial_exposure)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Risk Score</span>
                  <span className="font-bold text-indigo-400">{selectedRisk.risk_score.toFixed(0)} / 100</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase mb-1">Impacted Assets</span>
                <span className="rounded bg-slate-800 px-2.5 py-1 text-xs text-gray-300">
                  {selectedRisk.asset_name || "Enterprise-wide / Shared"}
                </span>
              </div>
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => {
                    setAcceptanceRiskId(selectedRisk.risk_id);
                    setSelectedRisk(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white w-full"
                >
                  Accept Risk
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Risk Acceptance Form Modal */}
      {acceptanceRiskId && (
        <Dialog open={!!acceptanceRiskId} onOpenChange={() => setAcceptanceRiskId(null)}>
          <DialogContent className="border-white/10 bg-slate-900 text-white max-w-lg">
            <RiskAcceptanceForm
              riskId={acceptanceRiskId}
              onSuccess={() => {
                setTimeout(() => {
                  setAcceptanceRiskId(null);
                  refetch();
                }, 2000);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
