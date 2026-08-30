"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { assetsApi } from "@/features/assets/api";
import { ImportResult } from "@/features/assets/types";
import { useQueryClient } from "@tanstack/react-query";
import { ASSET_QUERY_KEYS } from "@/features/assets/hooks";
import { useToast } from "@/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Server,
} from "lucide-react";

export default function AssetImportPage() {
  const router = useRouter();
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
        description: err?.message || "Failed to validate CSV format.",
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/assets"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Bulk CSV Asset Import</h1>
          <p className="text-xs text-muted-foreground">
            Ingest large volumes of network endpoints, servers, and cloud resources.
          </p>
        </div>
      </div>

      {importCompleted ? (
        <Card className="border-emerald-500/30 bg-card text-center p-8 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Import Complete</h3>
            <p className="text-xs text-muted-foreground">
              Successfully registered {importCompleted.successful} assets in catalog.
            </p>
          </div>
          <Button onClick={() => router.push("/assets")} size="sm">
            View Asset Inventory
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary">
                <FileSpreadsheet className="h-4 w-4" />
                <CardTitle className="text-sm font-semibold">1. Select CSV File</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Upload a structured comma-delimited file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/10 p-8 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  {file ? file.name : "Drag & drop or choose CSV file"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports UTF-8 formatted CSV files"}
                </p>
                <label className="mt-3">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild className="cursor-pointer text-xs h-7">
                    <span>Browse Computer</span>
                  </Button>
                </label>
              </div>

              {file && !validationResult && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleValidate}
                    isLoading={isValidating}
                  >
                    Validate File (Dry Run)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Dry-run Preview */}
          {validationResult && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">2. Validation Summary &amp; Preview</CardTitle>
                <CardDescription className="text-xs">
                  Review the syntax and schema verification before committing to database.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground block">Total Records</span>
                    <strong className="text-lg font-mono text-foreground">
                      {validationResult.total_rows}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <span className="text-[10px] text-emerald-500 block">Ready to Ingest</span>
                    <strong className="text-lg font-mono text-emerald-500">
                      {validationResult.successful}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                    <span className="text-[10px] text-rose-500 block">Row Errors</span>
                    <strong className="text-lg font-mono text-rose-500">
                      {validationResult.failed}
                    </strong>
                  </div>
                </div>

                {validationResult.errors.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs">
                    <div className="font-semibold text-rose-500">Validation Failures:</div>
                    {validationResult.errors.map((err, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>
                          Row {err.row}: {err.field ? `[${err.field}] ` : ""}
                          {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setValidationResult(null)}>
                    Re-upload
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    isLoading={isImporting}
                    disabled={validationResult.successful === 0}
                  >
                    Commit Import ({validationResult.successful} Assets)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
