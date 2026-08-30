"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, ShieldAlert, Server, DollarSign, Clock, CheckCircle2, Shield, Play, MessageSquare, ListTodo, Paperclip, Send } from "lucide-react";
import { useAddIncidentComment, useAddIncidentTask, useExecuteIncidentAction, useIncidentDetail, useUpdateIncident } from "../hooks";
import { INCIDENT_STATUSES } from "../constants";

interface IncidentDetailModalProps {
  incidentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentDetailModal({ incidentId, open, onOpenChange }: IncidentDetailModalProps) {
  const { data: incident, isLoading } = useIncidentDetail(incidentId);

  const [commentText, setCommentText] = useState("");
  const [taskText, setTaskText] = useState("");

  const updateMutation = useUpdateIncident();
  const commentMutation = useAddIncidentComment();
  const taskMutation = useAddIncidentTask();
  const actionMutation = useExecuteIncidentAction();

  const handleStatusChange = async (newStatus: string) => {
    await updateMutation.mutateAsync({
      incidentId,
      payload: { status: newStatus },
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await commentMutation.mutateAsync({
      incidentId,
      payload: { comment: commentText.trim() },
    });
    setCommentText("");
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    await taskMutation.mutateAsync({
      incidentId,
      payload: { task: taskText.trim(), priority: "HIGH" },
    });
    setTaskText("");
  };

  const handleExecuteAction = async (actionType: string, target: string) => {
    await actionMutation.mutateAsync({
      incidentId,
      payload: {
        action_type: actionType,
        target,
        reason: "Incident Containment Response Execution",
      },
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading || !incident ? (
          <div className="py-16 text-center text-slate-500">Loading Incident War Room...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-indigo-400 font-bold">{incident.incident_number}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      incident.severity === "CRITICAL"
                        ? "bg-red-950/50 text-red-400 border-red-800"
                        : "bg-amber-950/50 text-amber-400 border-amber-800"
                    }`}
                  >
                    {incident.severity} Severity
                  </Badge>
                  <Badge variant="outline" className="border-purple-800 bg-purple-950/50 text-purple-300 text-xs">
                    {incident.status}
                  </Badge>
                </div>

                {/* Lifecycle status selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Lifecycle Stage:</span>
                  <select
                    value={incident.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="h-8 px-2 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none"
                  >
                    {INCIDENT_STATUSES.filter((s) => s.value !== "ALL").map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <DialogTitle className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                {incident.title}
              </DialogTitle>
              <DialogDescription className="text-slate-400">{incident.description}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="bg-slate-950 border border-slate-800 flex-wrap">
                <TabsTrigger value="overview" className="text-xs">
                  Overview & Assets
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">
                  Timeline ({incident.timeline.length})
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">
                  SOAR Actions ({incident.response_actions.length})
                </TabsTrigger>
                <TabsTrigger value="evidence" className="text-xs">
                  Evidence & Tasks ({incident.evidence_items.length + incident.tasks.length})
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs">
                  Investigation Log ({incident.comments.length})
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview */}
              <TabsContent value="overview" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Incident Commander</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{incident.owner || "Unassigned"}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Business Service</span>
                    <p className="text-sm font-semibold text-indigo-300 mt-0.5">
                      {incident.business_service_name || "Digital Banking Core"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Adversary Profile</span>
                    <p className="text-sm font-semibold text-purple-400 mt-0.5">{incident.threat_actor || "APT29 (Cozy Bear)"}</p>
                  </div>
                </div>

                {/* Financial Impact Breakdown */}
                <div className="p-4 bg-gradient-to-r from-red-950/30 via-slate-950 to-slate-950 border border-red-900/40 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-red-300 font-medium">Aggregated Financial Loss Exposure</span>
                    <p className="text-2xl font-bold text-red-400 mt-0.5">
                      ${(incident.financial_exposure / 1000000).toFixed(1)}M USD
                    </p>
                    <span className="text-xs text-slate-400">
                      Downtime: ${(incident.downtime_exposure / 1000000).toFixed(1)}M · Recovery: $
                      {(incident.recovery_cost / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <DollarSign className="w-10 h-10 text-red-500/40" />
                </div>

                {/* Affected Assets */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Compromised & Impacted Assets</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {incident.affected_assets.map((asset) => (
                      <div
                        key={asset.asset_id}
                        className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Server className="w-4 h-4 text-indigo-400" />
                          <div>
                            <span className="text-xs font-semibold text-slate-200">{asset.name}</span>
                            <p className="text-[11px] text-slate-500 font-mono">{asset.ip || "Internal"}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-xs">
                          {asset.criticality || "CRITICAL"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Timeline */}
              <TabsContent value="timeline" className="space-y-3 pt-3">
                {incident.timeline.map((evt, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-indigo-300">{evt.action}</span>
                      <span className="text-slate-400 font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{evt.description}</p>
                    <span className="text-[11px] text-slate-400 mt-1 block">Responder: {evt.actor}</span>
                  </div>
                ))}
              </TabsContent>

              {/* Tab 3: SOAR Response Actions */}
              <TabsContent value="actions" className="space-y-3 pt-3">
                {incident.response_actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-200">{act.action_type}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            act.status === "EXECUTED"
                              ? "bg-emerald-950/50 text-emerald-400 border-emerald-800"
                              : "bg-amber-950/50 text-amber-400 border-amber-800"
                          }`}
                        >
                          {act.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">Target: {act.target}</p>
                    </div>

                    {act.status !== "EXECUTED" ? (
                      <Button
                        size="sm"
                        onClick={() => handleExecuteAction(act.action_type, act.target)}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Execute Action
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Enforced
                      </span>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* Tab 4: Evidence & Tasks */}
              <TabsContent value="evidence" className="space-y-4 pt-3">
                {/* Tasks */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-indigo-400" />
                    Response Tasks
                  </span>
                  <form onSubmit={handleAddTask} className="flex gap-2">
                    <Input
                      value={taskText}
                      onChange={(e) => setTaskText(e.target.value)}
                      placeholder="Add investigation or remediation task..."
                      className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-200"
                    />
                    <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                      Add Task
                    </Button>
                  </form>

                  <div className="space-y-1.5 pt-1">
                    {incident.tasks.map((tsk) => (
                      <div
                        key={tsk.id}
                        className="p-2.5 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200">{tsk.task}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{tsk.owner}</span>
                          <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                            {tsk.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Artifacts */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-amber-400" />
                    Attached Evidence Artifacts
                  </span>
                  <div className="space-y-1.5">
                    {incident.evidence_items.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2.5 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-200">{ev.title}</span>
                          <p className="text-slate-400 font-mono text-[11px] mt-0.5">{ev.file_name}</p>
                        </div>
                        <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-400">
                          {ev.verification_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 5: Comments */}
              <TabsContent value="comments" className="space-y-4 pt-3">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Post investigation note or forensic update..."
                    className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-200"
                  />
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1">
                    <Send className="w-3.5 h-3.5" />
                    Post
                  </Button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {incident.comments.map((cmt) => (
                    <div key={cmt.id} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-indigo-300">{cmt.author}</span>
                        <span className="text-slate-400 font-mono">{new Date(cmt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{cmt.comment}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
