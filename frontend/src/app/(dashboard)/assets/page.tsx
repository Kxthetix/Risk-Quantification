"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useAssets,
  useAssetStatistics,
} from "@/features/assets/hooks";
import { assetsApi } from "@/features/assets/api";
import { Asset, AssetType, AssetCriticality, AssetEnvironment, AssetStatus } from "@/types/asset";
import { AssetSummaryCards } from "@/features/assets/components/AssetSummaryCards";
import { AssetFilters } from "@/features/assets/components/AssetFilters";
import { AssetTable } from "@/features/assets/components/AssetTable";
import { AssetImportModal } from "@/features/assets/components/AssetImportModal";
import { BulkAssetActions } from "@/features/assets/components/BulkAssetActions";
import { ArchiveAssetDialog } from "@/features/assets/components/ArchiveAssetDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/providers/ToastProvider";
import {
  Server,
  Plus,
  Upload,
  Download,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

export default function AssetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State management for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedType, setSelectedType] = useState<AssetType | undefined>(
    (searchParams.get("type") as AssetType) || undefined
  );
  const [selectedCriticality, setSelectedCriticality] = useState<AssetCriticality | undefined>(
    (searchParams.get("criticality") as AssetCriticality) || undefined
  );
  const [selectedEnvironment, setSelectedEnvironment] = useState<AssetEnvironment | undefined>(
    (searchParams.get("environment") as AssetEnvironment) || undefined
  );
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | undefined>(
    (searchParams.get("status") as AssetStatus) || undefined
  );
  const [internetExposed, setInternetExposed] = useState<boolean | undefined>(
    searchParams.get("internet_exposed") === "true" ? true : undefined
  );

  // Multi-selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [assetToArchive, setAssetToArchive] = useState<Asset | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // TanStack Query hooks
  const { data: stats, isLoading: isStatsLoading } = useAssetStatistics();
  const { data: assetList, isLoading: isAssetsLoading, refetch } = useAssets({
    page: currentPage,
    limit: pageSize,
    q: searchQuery || undefined,
    asset_type: selectedType,
    criticality: selectedCriticality,
    environment: selectedEnvironment,
    status: selectedStatus,
    internet_exposed: internetExposed,
  });

  const assets = assetList?.items || [];
  const totalItems = assetList?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map((a) => a.id));
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType(undefined);
    setSelectedCriticality(undefined);
    setSelectedEnvironment(undefined);
    setSelectedStatus(undefined);
    setInternetExposed(undefined);
    setCurrentPage(1);
  };

  // Export CSV
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await assetsApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assets_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export complete",
        description: "Asset inventory exported as CSV.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err?.message || "Failed to download CSV export.",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Asset Inventory</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
              {totalItems} endpoints
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Discover, classify, valuate, and monitor organization technology assets.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            isLoading={isExporting}
            className="text-xs h-8 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="text-xs h-8 gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </Button>

          <Button size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/assets/new">
              <Plus className="h-3.5 w-3.5" />
              <span>Register Asset</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <AssetSummaryCards statistics={stats} isLoading={isStatsLoading} />

      {/* 3. Filters Toolbar */}
      <AssetFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        selectedType={selectedType}
        onTypeChange={(t) => {
          setSelectedType(t);
          setCurrentPage(1);
        }}
        selectedCriticality={selectedCriticality}
        onCriticalityChange={(c) => {
          setSelectedCriticality(c);
          setCurrentPage(1);
        }}
        selectedEnvironment={selectedEnvironment}
        onEnvironmentChange={(e) => {
          setSelectedEnvironment(e);
          setCurrentPage(1);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(s) => {
          setSelectedStatus(s);
          setCurrentPage(1);
        }}
        internetExposed={internetExposed}
        onInternetExposedChange={(ie) => {
          setInternetExposed(ie);
          setCurrentPage(1);
        }}
        onReset={handleResetFilters}
      />

      {/* 4. Asset Data Table */}
      <AssetTable
        assets={assets}
        isLoading={isAssetsLoading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onArchive={(asset) => setAssetToArchive(asset)}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* 5. Floating Bulk Actions */}
      <BulkAssetActions
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onExportSelected={handleExport}
      />

      {/* 6. Modals */}
      <AssetImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />

      <ArchiveAssetDialog
        asset={assetToArchive}
        open={!!assetToArchive}
        onOpenChange={(open) => !open && setAssetToArchive(null)}
      />
    </div>
  );
}
