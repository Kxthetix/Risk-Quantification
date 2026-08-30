"use client";

import React, { useState } from "react";
import { CasesTable, useCases, useCreateCase } from "@/features/cases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus, RefreshCw } from "lucide-react";

export default function CasesPage() {
  const { data: cases = [], isLoading, refetch, isFetching } = useCases();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lead, setLead] = useState("Marcus Vance");
  const [severity, setSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");

  const createMutation = useCreateCase();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    await createMutation.mutateAsync({
      title,
      description,
      severity,
      lead_investigator: lead,
      incident_ids: ["INC-2026-001"],
      tags: ["APT", "Perimeter Breach"],
    });

    setTitle("");
    setDescription("");
    setShowCreate(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-indigo-400" />
            Consolidated Case Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Group related multi-vector security incidents, campaign indicators, and cross-team remediation evidence into unified investigation cases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9"
          >
            {showCreate ? "Hide Form" : <><Plus className="w-3.5 h-3.5 mr-1.5" /> Create Case</>}
          </Button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-slate-300">Case Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Lateral Movement Campaign"
                required
                className="bg-slate-950 border-slate-700 text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Lead Investigator</Label>
              <Input
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                required
                className="bg-slate-950 border-slate-700 text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-slate-300">Case Narrative & Hypothesis</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe correlated attack telemetry and scope..."
              required
              className="bg-slate-950 border-slate-700 text-xs h-8"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={createMutation.isPending} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8">
              {createMutation.isPending ? "Creating..." : "Initialize Case"}
            </Button>
          </div>
        </form>
      )}

      <CasesTable cases={cases} isLoading={isLoading} />
    </div>
  );
}
