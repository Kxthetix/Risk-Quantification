"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Bug,
  Shield,
} from "lucide-react";

export default function VulnerabilityImportPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [scannerFormat, setScannerFormat] = useState("GENERIC_CSV");
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [importCompleted, setImportCompleted] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setImportCompleted(null);
    }
  };

  const handleValidate = () => {
    if (!file) return;
    setIsValidating(true);
    setTimeout(() => {
      setValidationResult({
        total_rows: 148,
        valid_rows: 142,
        failed_rows: 6,
        detected_cves: 84,
        matched_assets: 18,
        errors: [
          { row: 14, field: "cve_id", message: "Malformed CVE identifier syntax" },
          { row: 52, field: "severity", message: "Missing qualitative severity rating" },
        ],
      });
      setIsValidating(false);
    }, 800);
  };

  const handleCommit = () => {
    if (!file) return;
    setIsImporting(true);
    setTimeout(() => {
      setImportCompleted({
        imported_count: 142,
        updated_count: 24,
        new_cves: 38,
      });
      setIsImporting(false);
      toast({
        title: "Vulnerability Ingestion Complete",
        description: "Successfully ingested 142 vulnerability findings into threat ledger.",
        variant: "success",
      });
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/vulnerabilities"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Import Vulnerability Findings</h1>
          <p className="text-xs text-muted-foreground">
            Ingest scanner export reports (Nessus, Qualys, OpenVAS, Microsoft Defender, CSV/JSON).
          </p>
        </div>
      </div>

      {importCompleted ? (
        <Card className="border-emerald-500/30 bg-card text-center p-8 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Vulnerabilities Ingested</h3>
            <p className="text-xs text-muted-foreground">
              Processed {importCompleted.imported_count} findings ({importCompleted.new_cves} new CVEs).
            </p>
          </div>
          <Button onClick={() => router.push("/vulnerabilities")} size="sm">
            View Vulnerability Catalog
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary">
                <FileSpreadsheet className="h-4 w-4" />
                <CardTitle className="text-sm font-semibold">1. Scanner Format &amp; File</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Select your source scanner parser and choose an export report.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1.5">
                    Scanner Integration Format
                  </label>
                  <select
                    value={scannerFormat}
                    onChange={(e) => setScannerFormat(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="GENERIC_CSV" className="bg-popover text-popover-foreground">Generic CSV Format (cve, host, severity, cvss)</option>
                    <option value="NESSUS" className="bg-popover text-popover-foreground">Tenable Nessus (.nessus / CSV)</option>
                    <option value="QUALYS" className="bg-popover text-popover-foreground">Qualys VMDR Export (.xml / .csv)</option>
                    <option value="OPENVAS" className="bg-popover text-popover-foreground">Greenbone OpenVAS (.xml)</option>
                    <option value="DEFENDER" className="bg-popover text-popover-foreground">Microsoft Defender for Endpoint (JSON)</option>
                  </select>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/10 p-8 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  {file ? file.name : "Select or drag scanner findings export"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports CSV, XML, or JSON feeds"}
                </p>
                <label className="mt-3">
                  <input type="file" onChange={handleFileChange} className="hidden" />
                  <Button variant="outline" size="sm" asChild className="cursor-pointer text-xs h-7">
                    <span>Browse Computer</span>
                  </Button>
                </label>
              </div>

              {file && !validationResult && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleValidate} isLoading={isValidating}>
                    Validate &amp; Correlate Inventory
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Preview */}
          {validationResult && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">2. Pre-Ingestion Verification Summary</CardTitle>
                <CardDescription className="text-xs">
                  Review matched assets and valid finding definitions before committing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                    <span className="text-[10px] text-muted-foreground block">Total Records</span>
                    <strong className="text-base font-mono text-foreground">
                      {validationResult.total_rows}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                    <span className="text-[10px] text-emerald-500 block">Valid Findings</span>
                    <strong className="text-base font-mono text-emerald-500">
                      {validationResult.valid_rows}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                    <span className="text-[10px] text-muted-foreground block">Matched Assets</span>
                    <strong className="text-base font-mono text-foreground">
                      {validationResult.matched_assets}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5">
                    <span className="text-[10px] text-rose-500 block">Errors</span>
                    <strong className="text-base font-mono text-rose-500">
                      {validationResult.failed_rows}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setValidationResult(null)}>
                    Choose Another File
                  </Button>
                  <Button size="sm" onClick={handleCommit} isLoading={isImporting}>
                    Commit Ingestion ({validationResult.valid_rows} Findings)
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
