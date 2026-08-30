import React, { useState } from "react";
import { Remediation, RemediationPriorityLevel, RemediationStatus } from "../types";
import { PRIORITY_BADGE_COLORS, STATUS_BADGE_COLORS, REMEDIATION_TYPES } from "../constants";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Plus,
  Play,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { useCompleteRemediation, useDeleteRemediation } from "../hooks";
import { RemediationSimulationModal } from "./RemediationSimulationModal";
import { VerifyRemediationModal } from "./VerifyRemediationModal";
import { AcceptRiskModal } from "./AcceptRiskModal";
import { CreateRemediationModal } from "./CreateRemediationModal";

interface RemediationTableProps {
  remediations: Remediation[];
  isLoading?: boolean;
}

export function RemediationTable({ remediations, isLoading }: RemediationTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [simulationRemId, setSimulationRemId] = useState<string | null>(null);
  const [verifyRem, setVerifyRem] = useState<Remediation | null>(null);
  const [acceptRiskRem, setAcceptRiskRem] = useState<Remediation | null>(null);

  const completeMutation = useCompleteRemediation();
  const deleteMutation = useDeleteRemediation();

  const filtered = remediations.filter((rem) => {
    const matchesSearch =
      rem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rem.description && rem.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rem.cve_id && rem.cve_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rem.asset_name && rem.asset_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || rem.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || rem.priority_level === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleComplete = async (rem: Remediation) => {
    await completeMutation.mutateAsync(rem.id);
  };

  const handleDelete = async (rem: Remediation) => {
    if (window.confirm(`Delete remediation task: ${rem.title}?`)) {
      await deleteMutation.mutateAsync(rem.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search remediations by CVE, asset, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="VERIFIED">Verified</option>
            <option value="ACCEPTED_RISK">Accepted Risk</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>Create Remediation Action</span>
        </Button>
      </div>

      {/* Remediation Data Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Remediation Action</th>
                <th className="px-3 py-3">Priority Score</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Estimated Cost (₹)</th>
                <th className="px-3 py-3">Loss Reduction (₹)</th>
                <th className="px-3 py-3">ROSI %</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading remediation tasks...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No remediation actions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((rem) => {
                  const priorityClass =
                    PRIORITY_BADGE_COLORS[rem.priority_level] || "bg-muted text-muted-foreground";
                  const statusClass =
                    STATUS_BADGE_COLORS[rem.status] || "bg-muted text-muted-foreground";

                  return (
                    <tr key={rem.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{rem.title}</span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 font-mono">
                            <span>{rem.remediation_type}</span>
                            {rem.cve_id && <span>• {rem.cve_id}</span>}
                            {rem.asset_name && <span>• {rem.asset_name}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${priorityClass}`}>
                          {rem.priority_level} ({rem.priority_score.toFixed(0)})
                        </span>
                      </td>

                      <td className="px-3 py-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass}`}>
                          {rem.status}
                        </span>
                      </td>

                      <td className="px-3 py-3 font-mono text-muted-foreground">
                        {formatCurrency(rem.estimated_cost, { currency: "INR", compact: true })}
                      </td>

                      <td className="px-3 py-3 font-mono font-semibold text-emerald-400">
                        {formatCurrency(rem.expected_loss_reduction || 0, {
                          currency: "INR",
                          compact: true,
                        })}
                      </td>

                      <td className="px-3 py-3 font-mono font-bold text-primary">
                        +{rem.rosi_percentage ? rem.rosi_percentage.toFixed(0) : "0"}%
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Simulate Pre/Post Remediation Delta"
                            onClick={() => setSimulationRemId(rem.id)}
                            className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 gap-1"
                          >
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>Simulate</span>
                          </Button>

                          {rem.status !== "VERIFIED" && rem.status !== "ACCEPTED_RISK" && (
                            <>
                              {rem.status !== "COMPLETED" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Mark Completed"
                                  onClick={() => handleComplete(rem)}
                                  className="h-7 px-2 text-[11px] text-cyan-400 hover:bg-cyan-500/10"
                                >
                                  Complete
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Verify with Empirical Proof"
                                  onClick={() => setVerifyRem(rem)}
                                  className="h-7 px-2 text-[11px] text-emerald-400 hover:bg-emerald-500/10 font-bold"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Verify
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                title="Formally Accept Risk"
                                onClick={() => setAcceptRiskRem(rem)}
                                className="h-7 px-2 text-[11px] text-amber-400 hover:bg-amber-500/10"
                              >
                                Accept Risk
                              </Button>
                            </>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Remediation"
                            onClick={() => handleDelete(rem)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateRemediationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <RemediationSimulationModal
        isOpen={Boolean(simulationRemId)}
        onClose={() => setSimulationRemId(null)}
        remediationId={simulationRemId}
      />

      <VerifyRemediationModal
        isOpen={Boolean(verifyRem)}
        onClose={() => setVerifyRem(null)}
        remediation={verifyRem}
      />

      <AcceptRiskModal
        isOpen={Boolean(acceptRiskRem)}
        onClose={() => setAcceptRiskRem(null)}
        remediation={acceptRiskRem}
      />
    </div>
  );
}
