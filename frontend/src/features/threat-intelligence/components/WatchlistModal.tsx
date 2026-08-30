"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWatchlist } from "../hooks";

interface WatchlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WatchlistModal({ open, onOpenChange }: WatchlistModalProps) {
  const [name, setName] = useState("");
  const [itemType, setItemType] = useState("IP");
  const [indicatorsText, setIndicatorsText] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useCreateWatchlist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const indicators = indicatorsText
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean);

    await createMutation.mutateAsync({
      name,
      item_type: itemType,
      indicators,
      description: description || undefined,
    });

    onOpenChange(false);
    setName("");
    setIndicatorsText("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Create Threat Watchlist</DialogTitle>
          <DialogDescription className="text-slate-400">
            Define a high-priority indicator list to trigger instant SOC notifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Watchlist Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ingress Gateway Suspicious Subnets"
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Target Type</Label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="IP">IP Addresses</option>
              <option value="DOMAIN">Domains & Hostnames</option>
              <option value="HASH">SHA-256 Hashes</option>
              <option value="THREAT_ACTOR">Threat Actor Names</option>
              <option value="TECHNIQUE">MITRE ATT&CK Techniques</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Monitored Indicators (one per line)</Label>
            <Textarea
              value={indicatorsText}
              onChange={(e) => setIndicatorsText(e.target.value)}
              placeholder={"185.220.101.5\n45.154.255.88\n194.26.29.12"}
              rows={4}
              className="bg-slate-950 border-slate-700 text-slate-100 font-mono text-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or remediation mandate."
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
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
              {createMutation.isPending ? "Creating..." : "Save Watchlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
