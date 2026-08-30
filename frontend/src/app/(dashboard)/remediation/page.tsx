"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRemediations, useTopRemediations } from "@/features/remediation/hooks";
import {
  RemediationSummaryCards,
  TopRemediationsCard,
  RemediationTable,
  CreateRemediationModal,
  RemediationSimulationModal,
} from "@/features/remediation/components";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { Plus } from "lucide-react";

export default function RemediationPage() {
  const { data: remData, isLoading } = useRemediations();
  const { data: topData, isLoading: isTopLoading } = useTopRemediations({ limit: 3 });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [simulationRemId, setSimulationRemId] = useState<string | null>(null);

  const remediations = remData?.remediations || [];
  const topItems = topData?.items || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Contextual Remediation Tracker"
        description="Prioritized vulnerability mitigation workflows, multi-factor scoring (CVSS, KEV, Chokepoints, ROSI), empirical verification, and formal risk acceptance."
        breadcrumbs={[{ label: "Security" }, { label: "Remediation" }]}
        actions={
          <Can permission="remediation:create">
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Remediation</span>
            </Button>
          </Can>
        }
      />

      {/* KPI Overview */}
      <RemediationSummaryCards remediations={remediations} isLoading={isLoading} />

      {/* Top Priority Recommendations Banner */}
      <TopRemediationsCard
        items={topItems}
        onSimulate={(id) => setSimulationRemId(id)}
        isLoading={isTopLoading}
      />

      {/* Full Remediation Table */}
      <RemediationTable remediations={remediations} isLoading={isLoading} />

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
    </div>
  );
}
