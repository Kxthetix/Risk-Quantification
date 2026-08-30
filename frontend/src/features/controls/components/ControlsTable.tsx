import React, { useState } from "react";
import { SecurityControl, ControlType } from "../types";
import { CONTROL_TYPES, CONTROL_TYPE_BADGE_COLORS } from "../constants";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Target,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import { useDeleteControl, useSeedDefaultControls } from "../hooks";
import { ControlFormModal } from "./ControlFormModal";
import { ControlEffectivenessModal } from "./ControlEffectivenessModal";

interface ControlsTableProps {
  controls: SecurityControl[];
  isLoading?: boolean;
}

export function ControlsTable({ controls, isLoading }: ControlsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEffectivenessModalOpen, setIsEffectivenessModalOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<SecurityControl | null>(null);

  const deleteMutation = useDeleteControl();
  const seedDefaultsMutation = useSeedDefaultControls();

  const filtered = controls.filter((ctrl) => {
    const matchesSearch =
      ctrl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ctrl.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ctrl.description && ctrl.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "ALL" || ctrl.control_type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleEdit = (ctrl: SecurityControl) => {
    setSelectedControl(ctrl);
    setIsFormModalOpen(true);
  };

  const handleAddEffectiveness = (ctrl: SecurityControl) => {
    setSelectedControl(ctrl);
    setIsEffectivenessModalOpen(true);
  };

  const handleDelete = async (ctrl: SecurityControl) => {
    if (window.confirm(`Are you sure you want to remove ${ctrl.code} - ${ctrl.name}?`)) {
      await deleteMutation.mutateAsync(ctrl.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search controls by code, name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Control Types</option>
              {CONTROL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {controls.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedDefaultsMutation.mutateAsync()}
              isLoading={seedDefaultsMutation.isPending}
              className="gap-1.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Baseline Controls</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setSelectedControl(null);
              setIsFormModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Defensive Control</span>
          </Button>
        </div>
      </div>

      {/* Controls Data Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Control Code &amp; Name</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Effectiveness %</th>
                <th className="px-3 py-3">Asset Coverage %</th>
                <th className="px-3 py-3">Annual Cost (₹)</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading defensive security controls...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No defensive security controls found. Seed baseline controls or click "Add Defensive Control".
                  </td>
                </tr>
              ) : (
                filtered.map((ctrl) => {
                  const badgeClass =
                    CONTROL_TYPE_BADGE_COLORS[ctrl.control_type] || "bg-muted text-muted-foreground";

                  return (
                    <tr key={ctrl.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className="font-mono text-primary font-bold">{ctrl.code}</span>
                            <span>•</span>
                            <span>{ctrl.name}</span>
                          </span>
                          {ctrl.description && (
                            <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {ctrl.description}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                          {ctrl.control_type}
                        </span>
                      </td>

                      <td className="px-3 py-3 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(ctrl.effectiveness_score, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-foreground">
                            {ctrl.effectiveness_score}%
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(ctrl.coverage_percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-foreground">
                            {ctrl.coverage_percentage}%
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono text-foreground">
                        {formatCurrency(ctrl.annual_cost, { currency: "INR", compact: true })}
                      </td>

                      <td className="px-3 py-3">
                        <StatusBadge status={ctrl.is_active ? "ACTIVE" : "INACTIVE"} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Add targeted threat attenuation mapping"
                            onClick={() => handleAddEffectiveness(ctrl)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-400"
                          >
                            <Target className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit Control"
                            onClick={() => handleEdit(ctrl)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Control"
                            onClick={() => handleDelete(ctrl)}
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
      <ControlFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedControl(null);
        }}
        controlToEdit={selectedControl}
      />

      <ControlEffectivenessModal
        isOpen={isEffectivenessModalOpen}
        onClose={() => {
          setIsEffectivenessModalOpen(false);
          setSelectedControl(null);
        }}
        control={selectedControl}
      />
    </div>
  );
}
