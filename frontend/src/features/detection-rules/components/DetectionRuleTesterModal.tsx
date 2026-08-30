"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { useTestDetectionRule } from "../hooks";

interface DetectionRuleTesterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DetectionRuleTesterModal({ open, onOpenChange }: DetectionRuleTesterModalProps) {
  const [sampleEvent, setSampleEvent] = useState(`{
  "event_type": "SUSPICIOUS_EXEC",
  "source_ip": "185.220.101.5",
  "process_name": "powershell.exe",
  "command_line": "powershell.exe -enc JAB3AGMAPQBOAGUAdwAtAE8AYgBqAGUAYwB0..."
}`);

  const testMutation = useTestDetectionRule();

  const handleTest = async () => {
    try {
      const parsedPayload = JSON.parse(sampleEvent);
      await testMutation.mutateAsync({
        sample_event_payload: parsedPayload,
      });
    } catch {
      // JSON parse error handled gracefully
    }
  };

  const result = testMutation.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Detection Rule Sandbox Tester
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Execute detection evaluation logic against custom sample JSON security events in real time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Sample Event Payload (JSON)</Label>
            <Textarea
              value={sampleEvent}
              onChange={(e) => setSampleEvent(e.target.value)}
              rows={7}
              className="bg-slate-950 border-slate-700 text-slate-100 font-mono text-xs resize-none"
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={testMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            {testMutation.isPending ? "Evaluating Rule Engine..." : "Execute Simulation Test"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg border text-xs space-y-2 ${
                result.matched
                  ? "bg-red-950/30 border-red-800 text-red-300"
                  : "bg-emerald-950/30 border-emerald-800 text-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  {result.matched ? <CheckCircle2 className="w-4 h-4 text-red-400" /> : <XCircle className="w-4 h-4 text-emerald-400" />}
                  {result.matched ? "RULE TRIGGER MATCHED" : "NO TRIGGER / PASS"}
                </span>
                <span className="font-mono text-[11px] text-slate-400">Time: {result.execution_time_ms} ms</span>
              </div>

              {result.matched_conditions.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-300">Matched Conditions:</span>
                  {result.matched_conditions.map((cond, idx) => (
                    <p key={idx} className="text-[11px] text-slate-200">
                      • {cond}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
