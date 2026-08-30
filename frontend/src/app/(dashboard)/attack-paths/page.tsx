"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useAttackPathSummary,
  useAttackPaths,
  useAttackGraph,
  useMitreTechniques,
  useChokepoints,
} from "@/features/attack-paths/hooks";
import { AttackPathSummaryCards } from "@/features/attack-paths/components/AttackPathSummaryCards";
import { AttackPathGraph } from "@/features/attack-paths/components/AttackPathGraph";
import { SelectedNodePanel } from "@/features/attack-paths/components/SelectedNodePanel";
import { AttackPathTable } from "@/features/attack-paths/components/AttackPathTable";
import { MitreMatrix } from "@/features/attack-paths/components/MitreMatrix";
import { AttackPathRiskHeatmap } from "@/features/attack-paths/components/AttackPathRiskHeatmap";
import { AnalysisPanel } from "@/features/attack-paths/components/AnalysisPanel";
import { MitigationRecommendationsPanel } from "@/features/attack-paths/components/MitigationRecommendationsPanel";
import { Button } from "@/components/ui/button";
import { GraphVisualNode, AttackPath } from "@/features/attack-paths/types";
import {
  Network,
  Plus,
  RefreshCw,
  Download,
  Flame,
  Globe,
  Layers,
  Sparkles,
  GitCompare,
  TrendingUp,
} from "lucide-react";

export default function AttackPathsDashboardPage() {
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useAttackPathSummary();
  const { data: pathsResponse, isLoading: isPathsLoading, refetch: refetchPaths } = useAttackPaths({ limit: 10 });
  const { data: graphData, isLoading: isGraphLoading, refetch: refetchGraph } = useAttackGraph();
  const { data: techniques } = useMitreTechniques();
  const { data: chokepoints } = useChokepoints();

  const [selectedNode, setSelectedNode] = useState<GraphVisualNode | null>(null);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [focusedPath, setFocusedPath] = useState<AttackPath | null>(null);

  const handleRefresh = () => {
    refetchSummary();
    refetchPaths();
    refetchGraph();
  };

  const handleSelectPath = (path: AttackPath) => {
    setFocusedPath(path);
  };

  const focusedNodeIds = focusedPath?.nodes?.map((n) => n.id || (n as any).node_id) || undefined;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              Attack Path Analysis &amp; Lateral Movement Modeling
            </h1>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-400">
              MITRE ATT&amp;CK Matrix
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify and prioritize realistic paths an attacker could use to compromise critical business assets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs h-8 gap-1.5"
            title="Refresh Graph Data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/attack-paths/crown-jewels">
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              <span>Crown Jewels</span>
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/threat-models">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              <span>Threat Models</span>
            </Link>
          </Button>

          <AnalysisPanel onAnalysisCompleted={handleRefresh} />
        </div>
      </div>

      {/* 2. Executive Attack Path Summary Cards */}
      <AttackPathSummaryCards summary={summary} isLoading={isSummaryLoading} />

      {/* 3. Interactive Graph Visualization & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className={selectedNode ? "lg:col-span-3" : "lg:col-span-4"}>
          <AttackPathGraph
            data={graphData}
            isLoading={isGraphLoading}
            focusedPathNodeIds={focusedNodeIds}
            onSelectNode={setSelectedNode}
            selectedNodeId={selectedNode?.id}
            height={520}
          />
        </div>

        {selectedNode && (
          <div className="lg:col-span-1">
            <SelectedNodePanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>

      {/* 4. Top Dangerous Attack Paths Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Top Dangerous Attack Paths
            </h2>
            <p className="text-xs text-muted-foreground">
              Ranked by composite severity, exploitability, and potential financial impact.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="text-xs h-8">
            <Link href="/attack-paths/list">
              <span>View All Paths</span>
            </Link>
          </Button>
        </div>

        <AttackPathTable
          paths={pathsResponse?.paths}
          isLoading={isPathsLoading}
          onSelectPath={handleSelectPath}
        />
      </div>

      {/* 5. MITRE ATT&CK Matrix Traversal */}
      <MitreMatrix
        techniques={techniques}
        selectedTechniqueId={selectedTechniqueId}
        onSelectTechnique={setSelectedTechniqueId}
      />

      {/* 6. Attack Path Risk Heatmap & Residual Risk Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttackPathRiskHeatmap
          paths={pathsResponse?.paths}
          onSelectPath={handleSelectPath}
        />
        <MitigationRecommendationsPanel
          chokepoints={chokepoints}
          baselineLoss={summary?.total_financial_exposure || 48000000}
        />
      </div>
    </div>
  );
}
