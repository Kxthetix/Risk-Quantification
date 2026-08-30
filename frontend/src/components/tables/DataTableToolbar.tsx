import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface DataTableToolbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Filter records...",
  filters,
  actions,
  onResetFilters,
  hasActiveFilters = false,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3">
      <div className="flex flex-1 flex-wrap items-center gap-2 w-full sm:w-auto">
        {onSearchChange && (
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        )}

        {filters}

        {hasActiveFilters && onResetFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters} className="h-8 px-2 text-xs">
            Reset
            <X className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 w-full sm:w-auto justify-end">{actions}</div>}
    </div>
  );
}
