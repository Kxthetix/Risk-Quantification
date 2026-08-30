"use client";

import React, { useState } from "react";
import { NetworkRelationship } from "../types";
import { Asset } from "@/types/asset";
import { useCreateRelationship, useDeleteRelationship } from "../hooks";
import { RELATIONSHIP_TYPE_OPTIONS } from "../constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/forms/FormField";
import { Network, Plus, Trash2, ArrowRight, Server, Shield } from "lucide-react";

export interface AssetRelationshipsProps {
  assetId: string;
  relationships?: NetworkRelationship[];
  availableAssets?: Asset[];
}

export function AssetRelationships({
  assetId,
  relationships = [],
  availableAssets = [],
}: AssetRelationshipsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [destAssetId, setDestAssetId] = useState("");
  const [relType, setRelType] = useState("DEPENDS_ON");
  const [protocol, setProtocol] = useState("TCP");
  const [port, setPort] = useState<number | undefined>(undefined);

  const createMutation = useCreateRelationship();
  const deleteMutation = useDeleteRelationship();

  const assetRelationships = relationships.filter(
    (r) => r.source_asset_id === assetId || r.destination_asset_id === assetId
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destAssetId) return;

    await createMutation.mutateAsync({
      source_asset_id: assetId,
      destination_asset_id: destAssetId,
      relationship_type: relType,
      protocol,
      port,
      direction: "OUTBOUND",
      verified: true,
    });
    setIsAddModalOpen(false);
    setDestAssetId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Network Topology & Service Dependencies
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Directional dependencies, reachability links, and lateral movement paths.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Relationship</span>
        </Button>
      </div>

      {assetRelationships.length === 0 ? (
        <div className="rounded-lg border border-border bg-card/60 p-8 text-center">
          <Network className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <div className="text-xs font-semibold text-foreground">No topology connections mapped</div>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1">
            Map dependencies and reachability to identify potential lateral movement attack vectors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assetRelationships.map((rel) => {
            const isSource = rel.source_asset_id === assetId;
            return (
              <div
                key={rel.id}
                className="rounded-lg border border-border bg-card p-3 flex items-center justify-between hover:border-primary/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{rel.destination_asset_name || "Linked Asset Endpoint"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.2 font-mono font-medium">
                      {rel.relationship_type.replace(/_/g, " ")}
                    </span>
                    {rel.port && <span className="font-mono">Port {rel.port}/{rel.protocol || "TCP"}</span>}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                  onClick={() => deleteMutation.mutate(rel.id)}
                  disabled={deleteMutation.isPending}
                  title="Remove connection"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Connection Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Map Network Connection or Dependency
              </DialogTitle>
              <DialogDescription className="text-xs">
                Create a directional link from this asset to another organizational endpoint.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <FormField label="Target / Connected Asset" required>
                <select
                  value={destAssetId}
                  onChange={(e) => setDestAssetId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="" className="bg-popover text-popover-foreground">
                    Select an asset...
                  </option>
                  {availableAssets
                    .filter((a) => a.id !== assetId)
                    .map((a) => (
                      <option key={a.id} value={a.id} className="bg-popover text-popover-foreground">
                        {a.name} ({a.asset_type})
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Relationship Semantics" required>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {RELATIONSHIP_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Protocol">
                  <Input
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    placeholder="e.g. TCP / HTTPS / GRPC"
                    className="text-xs h-9 font-mono"
                  />
                </FormField>
                <FormField label="Port Number">
                  <Input
                    type="number"
                    value={port || ""}
                    onChange={(e) => setPort(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 443"
                    className="text-xs h-9 font-mono"
                  />
                </FormField>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={createMutation.isPending}>
                Create Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
