"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Info, ShieldAlert, DollarSign } from "lucide-react";
import { useIncidentRelationshipGraph } from "../hooks";

interface IncidentRelationshipGraphProps {
  incidentId: string;
}

export function IncidentRelationshipGraph({ incidentId }: IncidentRelationshipGraphProps) {
  const { data: graph, isLoading } = useIncidentRelationshipGraph(incidentId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (isLoading || !graph) {
    return <Card className="h-96 bg-slate-900/50 border-slate-800 animate-pulse" />;
  }

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId);

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400" />
          Multi-Layered Incident Relationship Graph
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Connected correlation graph: Threat Actor ➔ IOC ➔ Event ➔ Alert ➔ Incident ➔ Asset ➔ Attack Path ➔ Service ➔ Financial Exposure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Node Pipeline Map */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 overflow-x-auto">
          {graph.nodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <button
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-3 rounded-lg border text-left transition-all min-w-[140px] max-w-[160px] ${
                  selectedNodeId === node.id
                    ? "bg-indigo-950/80 border-indigo-500 shadow-lg ring-2 ring-indigo-500/40"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                }`}
              >
                <Badge
                  variant="outline"
                  className="text-[9px] uppercase tracking-wider mb-1 px-1.5 border-slate-700 bg-slate-950 text-slate-400 block w-fit truncate"
                >
                  {node.node_type.replace("_", " ")}
                </Badge>
                <p className="text-xs font-bold text-slate-100 truncate mt-0.5">{node.label}</p>
                {node.severity && (
                  <span
                    className={`inline-block mt-1 text-[10px] font-semibold ${
                      node.severity === "CRITICAL" ? "text-red-400" : "text-amber-400"
                    }`}
                  >
                    {node.severity}
                  </span>
                )}
              </button>
              {idx < graph.nodes.length - 1 && <span className="text-slate-600 font-bold text-sm hidden md:inline">➔</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div className="p-3.5 bg-slate-950/90 rounded-lg border border-indigo-900/60 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Inspecting Node: {selectedNode.label}
              </span>
              <Badge variant="outline" className="border-indigo-800 bg-indigo-950 text-indigo-300 text-[10px]">
                {selectedNode.node_type}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              {Object.entries(selectedNode.metadata || {}).map(([key, val]) => (
                <div key={key} className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">{key.replace("_", " ")}</span>
                  <p className="text-slate-200 font-medium truncate mt-0.5">{String(val)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
