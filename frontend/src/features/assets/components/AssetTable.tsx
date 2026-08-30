"use client";

import React from "react";
import Link from "next/link";
import { Asset } from "@/types/asset";
import { formatCurrency } from "@/lib/utils/currency";
import { formatScore, formatNumber } from "@/lib/utils/number";
import { formatDateTime } from "@/lib/utils/date";
import { useOrganization } from "@/providers/OrganizationProvider";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Server,
  Database,
  Globe,
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2,
  GitFork,
  Bug,
  Shield,
  Layers,
  ArrowUpDown,
} from "lucide-react";

export interface AssetTableProps {
  assets: Asset[];
  isLoading?: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onArchive: (asset: Asset) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function AssetTable({
  assets,
  isLoading = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onArchive,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: AssetTableProps) {
  const { currency } = useOrganization();

  const isAllSelected = assets.length > 0 && selectedIds.length === assets.length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DATABASE":
        return <Database className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
      case "WEB_APPLICATION":
      case "API":
        return <Globe className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      default:
        return <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-xs text-muted-foreground animate-pulse">
        Loading organization asset inventory...
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Server className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-foreground">No assets found</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          There are no technology assets matching your filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-3 w-8">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-border"
                  aria-label="Select all assets"
                />
              </th>
              <th className="py-3 px-3">Asset / Identifier</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Criticality</th>
              <th className="py-3 px-3 text-center">Risk Score</th>
              <th className="py-3 px-3 text-right">Exposure</th>
              <th className="py-3 px-3">Environment</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Owner</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {assets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id);

              return (
                <tr
                  key={asset.id}
                  className={`hover:bg-muted/30 transition-colors group ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(asset.id)}
                      className="rounded border-border"
                      aria-label={`Select ${asset.name}`}
                    />
                  </td>

                  {/* Asset Name & Sub-identifiers */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        {getTypeIcon(asset.asset_type)}
                        <span className="truncate max-w-[200px] sm:max-w-[240px]">
                          {asset.name}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        {asset.ip_address && <span>{asset.ip_address}</span>}
                        {asset.hostname && (
                          <span className="truncate max-w-[140px] text-muted-foreground/80">
                            • {asset.hostname}
                          </span>
                        )}
                        {asset.internet_exposed && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1 text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <Globe className="h-2.5 w-2.5" />
                            Edge
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-3 text-muted-foreground font-medium">
                    {asset.asset_type.replace(/_/g, " ")}
                  </td>

                  {/* Criticality */}
                  <td className="py-3 px-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        asset.criticality === "CRITICAL"
                          ? "bg-rose-500/15 text-rose-500"
                          : asset.criticality === "HIGH"
                          ? "bg-orange-500/15 text-orange-500"
                          : asset.criticality === "MEDIUM"
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-emerald-500/15 text-emerald-500"
                      }`}
                    >
                      {asset.criticality}
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {asset.risk_score !== undefined && asset.risk_score !== null ? (
                      <span
                        className={
                          asset.risk_score >= 80
                            ? "text-rose-500"
                            : asset.risk_score >= 60
                            ? "text-orange-500"
                            : "text-emerald-500"
                        }
                      >
                        {formatScore(asset.risk_score)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">Unassessed</span>
                    )}
                  </td>

                  {/* Financial Exposure */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-foreground">
                    {asset.expected_loss
                      ? formatCurrency(asset.expected_loss, { currency, compact: true })
                      : "—"}
                  </td>

                  {/* Environment */}
                  <td className="py-3 px-3">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                      {asset.environment}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        asset.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>

                  {/* Owner */}
                  <td className="py-3 px-3 text-muted-foreground truncate max-w-[120px]">
                    {asset.owner || "Unassigned"}
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-3 px-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 text-xs">
                        <DropdownMenuItem asChild className="cursor-pointer gap-2">
                          <Link href={`/assets/${asset.id}`}>
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                            <span>View Details</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer gap-2">
                          <Link href={`/assets/${asset.id}/edit`}>
                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Edit Asset</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onArchive(asset)}
                          className="cursor-pointer gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Archive Asset</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        <div>
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{" "}
          {Math.min(currentPage * pageSize, totalItems)} of {formatNumber(totalItems)} assets
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-7 px-2.5 text-xs"
          >
            Previous
          </Button>
          <span className="text-[11px] font-mono px-2">
            Page {currentPage} of {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-7 px-2.5 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
