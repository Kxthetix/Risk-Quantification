"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useSendIncidentCommunication } from "../hooks";
import { Send, Mail } from "lucide-react";

interface IncidentCommunicationsModalProps {
  incidentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentCommunicationsModal({ incidentId, open, onOpenChange }: IncidentCommunicationsModalProps) {
  const [commType, setCommType] = useState<"INTERNAL_UPDATE" | "STAKEHOLDER_NOTIFICATION" | "EXECUTIVE_BRIEF" | "EXTERNAL_STATUS">("EXECUTIVE_BRIEF");
  const [subject, setSubject] = useState(`[EXECUTIVE BRIEF] Security Incident Update: ${incidentId}`);
  const [message, setMessage] = useState(
    "Incident has been successfully contained. Affected DMZ gateway was isolated and memory forensic snapshot completed. No customer data exfiltration detected."
  );
  const [recipient, setRecipient] = useState("exec-security-briefings@enterprise.internal");

  const sendMutation = useSendIncidentCommunication();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    await sendMutation.mutateAsync({
      incidentId,
      payload: {
        communication_type: commType,
        subject,
        message,
        recipients: [recipient],
      },
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            Dispatch Incident Communications
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Publish standardized updates to executive leadership, board risk committee, or technical teams.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Communication Tier</Label>
            <select
              value={commType}
              onChange={(e) => setCommType(e.target.value as any)}
              className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none"
            >
              <option value="EXECUTIVE_BRIEF">Executive Briefing (C-Suite & Board)</option>
              <option value="INTERNAL_UPDATE">Internal Technical Team Update</option>
              <option value="STAKEHOLDER_NOTIFICATION">Business Stakeholder Notice</option>
              <option value="EXTERNAL_STATUS">External Regulatory Status</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Subject Line *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Recipient Mailing List / Webhook</Label>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Briefing Content *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            <Button type="submit" disabled={sendMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {sendMutation.isPending ? "Dispatching..." : "Dispatch Notification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
