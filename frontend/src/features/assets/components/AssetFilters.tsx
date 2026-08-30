"use client";

import React, { useState, useEffect } from "react";
import {
  ASSET_TYPE_OPTIONS,
  ASSET_CRITICALITY_OPTIONS,
  ASSET_ENVIRONMENT_OPTIONS,
  ASSET_STATUS_OPTIONS,
} from "../constants";
import { AssetType, AssetCriticality, AssetEnvironment, AssetStatus } from "@/types/asset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter, RefreshCcw } from "lucide-react";

export interface AssetFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType?: AssetType;
  onTypeChange: (type?: AssetType) => void;
  selectedCriticality?: AssetCriticality;
  onCriticalityChange: (crit?: AssetCriticality) => void;
  selectedEnvironment?: AssetEnvironment;
  onEnvironmentChange: (env?: AssetEnvironment) => void;
  selectedStatus?: AssetStatus;
  onStatusChange: (status?: AssetStatus) => void;
  internetExposed?: boolean;
  onInternetExposedChange: (val?: boolean) => void;
  onReset: () => void;
}

export function AssetFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCriticality,
  onCriticalityChange,
  selectedEnvironment,
  onEnvironmentChange,
  selectedStatus,
  onStatusChange,
  internetExposed,
  onInternetExposedChange,
  onReset,
}: AssetFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounced search trigger (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  const hasActiveFilters =
    !!localSearch ||
    !!selectedType ||
    !!selectedCriticality ||
    !!selectedEnvironment ||
    !!selectedStatus ||
    internetExposed !== undefined;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-3.5 shadow-xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets by name, hostname, IP address, domain, or owner..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-8 text-xs h-8 bg-background"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Dropdown Filters Toolbar */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Asset Type */}
          <select
            value={selectedType || ""}
            onChange={(e) => onTypeChange((e.target.value as AssetType) || undefined)}
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by asset type"
          >
            <option value="">All Types</option>
            {ASSET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Criticality */}
          <select
            value={selectedCriticality || ""}
            onChange={(e) =>
              onCriticalityChange((e.target.value as AssetCriticality) || undefined)
            }
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by criticality"
          >
            <option value="">All Criticality</option>
            {ASSET_CRITICALITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Environment */}
          <select
            value={selectedEnvironment || ""}
            onChange={(e) =>
              onEnvironmentChange((e.target.value as AssetEnvironment) || undefined)
            }
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by environment"
          >
            <option value="">All Environments</option>
            {ASSET_ENVIRONMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus || ""}
            onChange={(e) => onStatusChange((e.target.value as AssetStatus) || undefined)}
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {ASSET_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Internet Exposed Toggle */}
          <button
            type="button"
            onClick={() => onInternetExposedChange(internetExposed ? undefined : true)}
            className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              internetExposed
                ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "border-input bg-background text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <span>Internet-Facing</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalSearch("");
                onReset();
              }}
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RefreshCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
