"use client";

import React, { useState } from "react";
import { SOCTask } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTodo, CheckCircle2, Plus, Clock, AlertTriangle } from "lucide-react";
import { useSOCTasks, useUpdateSOCTask } from "../hooks";
import { TASK_SLA_STATUSES } from "../constants";

export function SOCTasksTable() {
  const { data: tasks = [], isLoading } = useSOCTasks();
  const updateMutation = useUpdateSOCTask();

  const handleToggleStatus = async (task: SOCTask) => {
    const nextStatus = task.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    await updateMutation.mutateAsync({
      taskId: task.id,
      payload: { status: nextStatus },
    });
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
        <div>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            Active SOC Incident Response Tasks & SLA Tracking
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Assigned investigation tasks, forensic memory captures, and containment actions with active SLA monitoring.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-950/80">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Incident</TableHead>
                <TableHead className="text-slate-400">Task Description</TableHead>
                <TableHead className="text-slate-400">Owner</TableHead>
                <TableHead className="text-slate-400">Priority</TableHead>
                <TableHead className="text-slate-400">SLA Status</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                    Loading tasks...
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                    No outstanding SOC tasks.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors text-xs">
                    <TableCell>
                      <span className="font-mono text-indigo-400 font-bold">{task.incident_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${task.status === "COMPLETED" ? "line-through text-slate-500" : "text-slate-200"}`}>
                        {task.task}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-300">{task.owner}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          task.priority === "CRITICAL"
                            ? "bg-red-950/50 text-red-400 border-red-800"
                            : "bg-amber-950/50 text-amber-400 border-amber-800"
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          task.sla_status === "ON_TRACK"
                            ? "bg-emerald-950/50 text-emerald-400 border-emerald-800"
                            : "bg-red-950/50 text-red-400 border-red-800"
                        }`}
                      >
                        {task.sla_status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          task.status === "COMPLETED"
                            ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
                            : "border-slate-700 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(task)}
                        disabled={updateMutation.isPending}
                        className="text-xs text-indigo-400 hover:text-indigo-300 h-7"
                      >
                        {task.status === "COMPLETED" ? "Reopen" : "Complete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
