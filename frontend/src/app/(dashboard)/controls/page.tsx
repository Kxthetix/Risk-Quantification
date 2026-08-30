"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useControls, useSeedDefaultControls } from "@/features/controls/hooks";
import {
  ControlSummaryCards,
  ControlsTable,
  ControlCoverageMatrix,
  ControlFormModal,
} from "@/features/controls/components";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { Plus, Sparkles, ShieldCheck } from "lucide-react";

export default function ControlsPage() {
  const { data: controls = [], isLoading } = useControls();
  const seedDefaultsMutation = useSeedDefaultControls();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Defensive Security Controls"
        description="Active defensive controls inventory, empirical attenuation factors, MITRE ATT&CK coverage, and annual operating costs."
        breadcrumbs={[{ label: "Security" }, { label: "Controls" }]}
        actions={
          <div className="flex items-center gap-2">
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

            <Can permission="controls:manage">
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Defensive Control</span>
              </Button>
            </Can>
          </div>
        }
      />

      {/* KPI Overview */}
      <ControlSummaryCards controls={controls} isLoading={isLoading} />

      {/* MITRE ATT&CK Defense Matrix */}
      <ControlCoverageMatrix controls={controls} />

      {/* Controls Data Table */}
      <ControlsTable controls={controls} isLoading={isLoading} />

      {/* Add Control Modal */}
      <ControlFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
