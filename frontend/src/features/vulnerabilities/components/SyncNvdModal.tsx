"use client";

import React, { useState } from "react";
import { useTriggerNvdSync, useSyncJobStatus } from "../hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle, Database } from "lucide-react";

export interface SyncNvdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncNvdModal({ open, onOpenChange }: SyncNvdModalProps) {
  const [maxRecords, setMaxRecords] = useState(250);
  const [targetCve, setTargetCve] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const syncMutation = useTriggerNvdSync();
  const { data: jobStatus } = useSyncJobStatus(activeJobId || undefined);

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await syncMutation.mutateAsync({
      maxRecords,
      cveId: targetCve.trim() || undefined,
    });
    setActiveJobId(res.job_id);
  };

  const handleClose = () => {
    setActiveJobId(null);
    setTargetCve("");
    onOpenChange(false);
  };

  const isFinished =
    jobStatus?.status === "COMPLETED" || jobStatus?.status === "FAILED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Database className="h-5 w-5" />
            <DialogTitle className="text-sm font-semibold">
              Synchronize National Vulnerability Database (NVD)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Pull latest CVE telemetry, CVSS v3.1/v4 metrics, and CPE criteria directly from NIST feeds.
          </DialogDescription>
        </DialogHeader>

        {activeJobId ? (
          <div className="space-y-4 py-4 text-xs">
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-foreground">Sync Job Status:</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    jobStatus?.status === "COMPLETED"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : jobStatus?.status === "FAILED"
                      ? "bg-rose-500/15 text-rose-500"
                      : "bg-primary/15 text-primary animate-pulse"
                  }`}
                >
                  {jobStatus?.status || "QUEUED"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-background p-2 border border-border">
                  <span className="text-[9px] text-muted-foreground block">Processed</span>
                  <strong className="text-sm font-mono text-foreground">
                    {jobStatus?.records_processed || 0}
                  </strong>
                </div>
                <div className="rounded bg-background p-2 border border-border">
                  <span className="text-[9px] text-emerald-500 block">Added</span>
                  <strong className="text-sm font-mono text-emerald-500">
                    {jobStatus?.records_added || 0}
                  </strong>
                </div>
                <div className="rounded bg-background p-2 border border-border">
                  <span className="text-[9px] text-amber-500 block">Updated</span>
                  <strong className="text-sm font-mono text-amber-500">
                    {jobStatus?.records_updated || 0}
                  </strong>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button size="sm" onClick={handleClose} disabled={!isFinished} className="w-full">
                {isFinished ? "Done" : "Synchronizing in background..."}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleStartSync} className="space-y-3 py-2 text-xs">
            <FormField label="Batch Size Limit (1 - 2000 Records)">
              <Input
                type="number"
                min={1}
                max={2000}
                value={maxRecords}
                onChange={(e) => setMaxRecords(Number(e.target.value))}
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="Specific CVE ID (Optional Expedited Sync)">
              <Input
                placeholder="e.g. CVE-2024-3094"
                value={targetCve}
                onChange={(e) => setTargetCve(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={syncMutation.isPending}>
                Start Ingestion Job
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
