"use client";

import React from "react";
import { useBulkRecalculateRisk } from "../hooks";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Trash2, CheckSquare, Layers } from "lucide-react";

export interface BulkAssetActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onExportSelected?: () => void;
}

export function BulkAssetActions({
  selectedIds,
  onClearSelection,
  onExportSelected,
}: BulkAssetActionsProps) {
  const bulkRiskMutation = useBulkRecalculateRisk();

  if (selectedIds.length === 0) return null;

  const handleBulkRecalculate = () => {
    bulkRiskMutation.mutate({ assetIds: selectedIds });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground pr-2 border-r border-border">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span>{selectedIds.length} Assets Selected</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5"
          onClick={handleBulkRecalculate}
          isLoading={bulkRiskMutation.isPending}
        >
          <RefreshCw className="h-3 w-3" />
          <span>Recalculate Risk</span>
        </Button>

        {onExportSelected && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={onExportSelected}
          >
            <Download className="h-3 w-3" />
            <span>Export</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClearSelection}
        >
          Deselect
        </Button>
      </div>
    </div>
  );
}
