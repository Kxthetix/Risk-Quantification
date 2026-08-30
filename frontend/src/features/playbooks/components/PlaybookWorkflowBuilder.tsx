"use client";

import React, { useState } from "react";
import { PlaybookStep } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Shield, Play, Save, Workflow } from "lucide-react";
import { SOAR_ACTION_TYPES, PLAYBOOK_CATEGORIES } from "../constants";
import { useCreatePlaybook } from "../hooks";

export function PlaybookWorkflowBuilder() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(PLAYBOOK_CATEGORIES[0]);
  const [steps, setSteps] = useState<PlaybookStep[]>([
    {
      step_id: "s1",
      step_number: 1,
      name: "Block Inbound Malicious IP",
      action_type: "BLOCK_IP",
      target_type: "IP",
      requires_approval: false,
      is_high_risk: false,
      timeout_seconds: 15,
    },
    {
      step_id: "s2",
      step_number: 2,
      name: "Isolate Compromised Server",
      action_type: "ISOLATE_ASSET",
      target_type: "ASSET",
      requires_approval: true,
      is_high_risk: true,
      timeout_seconds: 30,
    },
  ]);

  const createMutation = useCreatePlaybook();

  const handleAddStep = () => {
    const nextNum = steps.length + 1;
    setSteps([
      ...steps,
      {
        step_id: `s${nextNum}`,
        step_number: nextNum,
        name: `Step ${nextNum}: Recalculate Risk`,
        action_type: "RECALCULATE_RISK",
        target_type: "SYSTEM",
        requires_approval: false,
        is_high_risk: false,
        timeout_seconds: 10,
      },
    ]);
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    await createMutation.mutateAsync({
      name,
      description,
      category,
      trigger_type: "MANUAL",
      status: "ENABLED",
      steps,
      required_permissions: ["response:execute"],
    });

    setName("");
    setDescription("");
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <Workflow className="w-5 h-5 text-indigo-400" />
          Interactive Playbook Workflow Designer
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Build modular, multi-action SOAR playbooks with conditional branching and approval barriers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-slate-300">Playbook Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Critical Ransomware Perimeter Isolation"
                required
                className="bg-slate-950 border-slate-700 text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-2 rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-100"
              >
                {PLAYBOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Description *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe playbook triggers, conditions, and containment objectives..."
              required
              className="bg-slate-950 border-slate-700 text-xs h-9"
            />
          </div>

          {/* Workflow Sequence */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Configured Action Steps</span>
              <Button type="button" size="sm" onClick={handleAddStep} variant="outline" className="text-xs h-7 border-slate-700">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Step
              </Button>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={step.step_id}
                  className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                      {step.step_number}
                    </span>
                    <Input
                      value={step.name}
                      onChange={(e) => {
                        const updated = [...steps];
                        updated[idx].name = e.target.value;
                        setSteps(updated);
                      }}
                      className="bg-slate-900 border-slate-800 text-xs h-8 w-60"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <select
                      value={step.action_type}
                      onChange={(e) => {
                        const updated = [...steps];
                        updated[idx].action_type = e.target.value;
                        const actionMeta = SOAR_ACTION_TYPES.find((a) => a.value === e.target.value);
                        if (actionMeta) {
                          updated[idx].is_high_risk = actionMeta.highRisk;
                          updated[idx].requires_approval = actionMeta.highRisk;
                        }
                        setSteps(updated);
                      }}
                      className="h-8 px-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                    >
                      {SOAR_ACTION_TYPES.map((act) => (
                        <option key={act.value} value={act.value}>
                          {act.label}
                        </option>
                      ))}
                    </select>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveStep(idx)}
                      className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 gap-1.5"
            >
              <Save className="w-4 h-4" />
              {createMutation.isPending ? "Saving..." : "Deploy Playbook"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
