"use client";

import React, { useState } from "react";
import { assetsApi } from "../api";
import { ImportResult } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { ASSET_QUERY_KEYS } from "../hooks";
import { useToast } from "@/providers/ToastProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Download } from "lucide-react";

export interface AssetImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetImportModal({ open, onOpenChange }: AssetImportModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [importCompleted, setImportCompleted] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setImportCompleted(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setIsValidating(true);
    try {
      const res = await assetsApi.validateImportCsv(file);
      setValidationResult(res);
    } catch (err: any) {
      toast({
        title: "Validation Error",
        description: err?.message || "Failed to validate CSV file format.",
        variant: "error",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      const res = await assetsApi.importCsv(file);
      setImportCompleted(res);
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.all });
      toast({
        title: "Import Successful",
        description: `Imported ${res.successful} assets into inventory.`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err?.message || "Failed to commit imported assets.",
        variant: "error",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationResult(null);
    setImportCompleted(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Upload className="h-5 w-5" />
            <DialogTitle>Bulk Import Assets via CSV</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Upload a CSV containing technology asset records. Required columns:{" "}
            <code className="font-mono text-foreground font-semibold">name, asset_type, criticality, environment</code>.
          </DialogDescription>
        </DialogHeader>

        {importCompleted ? (
          /* Step 3: Success Completion View */
          <div className="space-y-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Asset Import Complete</h4>
              <p className="text-xs text-muted-foreground">
                Successfully processed <strong>{importCompleted.successful}</strong> of{" "}
                <strong>{importCompleted.total_rows}</strong> records.
              </p>
            </div>

            {importCompleted.failed > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
                {importCompleted.failed} records had validation errors and were skipped.
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button size="sm" onClick={handleClose} className="w-full">
                Close & View Inventory
              </Button>
            </DialogFooter>
          </div>
        ) : validationResult ? (
          /* Step 2: Dry-run Validation Results & Confirmation */
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                <span className="text-[10px] text-muted-foreground block">Total Rows</span>
                <strong className="text-base text-foreground font-mono">
                  {validationResult.total_rows}
                </strong>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                <span className="text-[10px] text-emerald-500 block">Valid Rows</span>
                <strong className="text-base text-emerald-500 font-mono">
                  {validationResult.successful}
                </strong>
              </div>
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5">
                <span className="text-[10px] text-rose-500 block">Errors</span>
                <strong className="text-base text-rose-500 font-mono">
                  {validationResult.failed}
                </strong>
              </div>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-lg border border-border bg-muted/30 p-2">
                <div className="font-semibold text-rose-500">Validation Issues Detected:</div>
                {validationResult.errors.slice(0, 5).map((err, i) => (
                  <div key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      Row {err.row}: {err.field ? `[${err.field}] ` : ""}
                      {err.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setValidationResult(null)}>
                Choose Another File
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                isLoading={isImporting}
                disabled={validationResult.successful === 0}
              >
                Commit Import ({validationResult.successful} Assets)
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Step 1: File Upload & Validate Initial */
          <div className="space-y-4 py-2 text-xs">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/10 p-6 text-center hover:bg-muted/20 transition-colors">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  {file ? file.name : "Select a CSV Asset Catalog"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports UTF-8 CSV files up to 10MB"}
                </p>
              </div>
              <label className="mt-3">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild className="cursor-pointer text-xs h-7">
                  <span>Browse CSV File</span>
                </Button>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleValidate}
                disabled={!file}
                isLoading={isValidating}
              >
                Validate & Preview
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
