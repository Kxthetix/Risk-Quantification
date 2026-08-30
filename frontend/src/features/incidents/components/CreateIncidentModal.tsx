"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateIncident } from "../hooks";

interface CreateIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateIncidentModal({ open, onOpenChange }: CreateIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("HIGH");
  const [owner, setOwner] = useState("");

  const createMutation = useCreateIncident();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    await createMutation.mutateAsync({
      title,
      description,
      severity,
      owner: owner || undefined,
      affected_asset_ids: [],
    });

    onOpenChange(false);
    setTitle("");
    setDescription("");
    setOwner("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Declare Security Incident</DialogTitle>
          <DialogDescription className="text-slate-400">
            Initialize an incident response war room with timeline tracking, evidence locker, and containment actions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Incident Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unauthenticated Ingress Breach on Gateway"
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Severity</Label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Lead Responder / Commander</Label>
              <Input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Lead SOC Commander"
                className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Executive Summary / Scope Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe initial breach vectors, affected systems, and observable impacts."
              rows={4}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-red-600 hover:bg-red-500 text-white">
              {createMutation.isPending ? "Declaring Incident..." : "Declare Incident"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
