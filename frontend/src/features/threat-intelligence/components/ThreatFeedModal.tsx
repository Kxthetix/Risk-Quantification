"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { THREAT_FEED_TYPES } from "../constants";
import { useCreateThreatFeed } from "../hooks";

interface ThreatFeedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThreatFeedModal({ open, onOpenChange }: ThreatFeedModalProps) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [feedType, setFeedType] = useState("STIX/TAXII");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [description, setDescription] = useState("");
  const [pollingMinutes, setPollingMinutes] = useState(60);

  const createMutation = useCreateThreatFeed();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !provider) return;

    await createMutation.mutateAsync({
      name,
      provider,
      feed_type: feedType,
      endpoint_url: endpointUrl || undefined,
      description: description || undefined,
      polling_interval_minutes: pollingMinutes,
      enabled: true,
    });

    onOpenChange(false);
    setName("");
    setProvider("");
    setDescription("");
    setEndpointUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Add Threat Intelligence Feed</DialogTitle>
          <DialogDescription className="text-slate-400">
            Connect an external STIX/TAXII, IOC blacklist, or commercial adversary intelligence feed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Feed Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CISA Known Exploited Vulns"
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Provider / Source *</Label>
              <Input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Mandiant, CISA, OTX"
                required
                className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Feed Type</Label>
              <select
                value={feedType}
                onChange={(e) => setFeedType(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {THREAT_FEED_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Endpoint URL / API Hook</Label>
            <Input
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://api.threatintel.example/taxii2/root"
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context regarding the scope of indicators or targets."
              rows={2}
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
            <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {createMutation.isPending ? "Connecting..." : "Add Feed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
