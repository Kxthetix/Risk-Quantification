"use client";

import React from "react";
import { Asset } from "@/types/asset";
import { useDeleteAsset } from "../hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

export interface ArchiveAssetDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveAssetDialog({
  asset,
  open,
  onOpenChange,
}: ArchiveAssetDialogProps) {
  const deleteMutation = useDeleteAsset();

  if (!asset) return null;

  const handleConfirm = async () => {
    await deleteMutation.mutateAsync(asset.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-sm font-semibold">
              Archive Asset &amp; Unbind Telemetry
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Are you sure you want to archive <strong>{asset.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs space-y-1.5 text-muted-foreground">
          <p>
            The asset endpoint will be removed from active vulnerability syncs and threat scenario tracking.
          </p>
          <p className="text-[11px]">
            Historical risk snapshots and audit logs will be permanently retained in the ledger.
          </p>
        </div>

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            isLoading={deleteMutation.isPending}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Confirm Archive</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
