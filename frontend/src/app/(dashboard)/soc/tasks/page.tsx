"use client";

import React, { useState } from "react";
import { SOCTasksTable, useCreateSOCTask } from "@/features/soc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListTodo, Plus, RefreshCw } from "lucide-react";

export default function SOCTasksPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [incidentId, setIncidentId] = useState("INC-2026-001");
  const [task, setTask] = useState("");
  const [owner, setOwner] = useState("Marcus Vance");
  const [priority, setPriority] = useState("HIGH");

  const createMutation = useCreateSOCTask();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    await createMutation.mutateAsync({
      incident_id: incidentId,
      task,
      owner,
      priority,
    });

    setTask("");
    setShowCreate(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <ListTodo className="w-7 h-7 text-indigo-400" />
            SOC Incident Response Tasks & SLA Tracking
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operational triage tasks, forensic collection mandates, and SLA compliance tracking for incident commanders.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9"
        >
          {showCreate ? "Hide Form" : <><Plus className="w-3.5 h-3.5 mr-1.5" /> Assign SOC Task</>}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Incident Target</Label>
              <Input
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                required
                className="bg-slate-950 border-slate-700 text-xs h-8"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-slate-300">Task Mandate</Label>
              <Input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. Export packet capture PCAP from DMZ firewall interface"
                required
                className="bg-slate-950 border-slate-700 text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Assignee</Label>
              <Input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
                className="bg-slate-950 border-slate-700 text-xs h-8"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={createMutation.isPending} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8">
              {createMutation.isPending ? "Assigning..." : "Assign Task"}
            </Button>
          </div>
        </form>
      )}

      <SOCTasksTable />
    </div>
  );
}
