"use client";

import React, { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Play,
  FileText,
  Sliders,
  Check,
} from "lucide-react";
import { useUploadFileImport, useExecuteImport } from "../hooks";
import type { FileImportPreview, FileImportItem } from "../types";

export function ImportWizard({ onComplete }: { onComplete?: () => void }) {
  const uploadMutation = useUploadFileImport();
  const executeMutation = useExecuteImport();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [filename, setFilename] = useState("asset_inventory_export.csv");
  const [importType, setImportType] = useState("ASSETS");
  const [csvText, setCsvText] = useState(
    "hostname,ip_address,asset_type,environment,criticality,os\nprod-api-gw-01,10.0.1.10,SERVER,PRODUCTION,CRITICAL,Ubuntu 22.04 LTS\nstage-auth-01,10.0.2.15,DATABASE,STAGING,HIGH,Debian 12\ncorp-analyst-laptop-09,10.0.4.88,WORKSTATION,PRODUCTION,LOW,macOS Sonoma"
  );

  const [preview, setPreview] = useState<FileImportPreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FileImportItem | null>(null);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate(
      {
        filename,
        file_type: "CSV",
        import_type: importType,
        raw_csv_text: csvText,
      },
      {
        onSuccess: (data) => {
          setPreview(data);
          setColumnMapping(data.suggested_mappings || {});
          setStep(2);
        },
      }
    );
  };

  const handleExecute = () => {
    if (!preview) return;
    executeMutation.mutate(
      {
        importId: preview.import_id,
        payload: { column_mapping: columnMapping, skip_invalid_rows: true },
      },
      {
        onSuccess: (res) => {
          setResult(res);
          setStep(4);
          if (onComplete) onComplete();
        },
      }
    );
  };

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6 max-w-3xl">
      {/* Wizard Step Indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        {[
          { num: 1, label: "1. Upload File" },
          { num: 2, label: "2. Validate & Preview" },
          { num: 3, label: "3. Map Columns" },
          { num: 4, label: "4. Ingest Summary" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num
                  ? "bg-indigo-600 text-white"
                  : step > s.num
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </span>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                step === s.num ? "text-slate-100" : "text-slate-500"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">File Name</label>
              <input
                type="text"
                required
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Entity Type</label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              >
                <option value="ASSETS">Assets & Endpoints</option>
                <option value="VULNERABILITIES">Vulnerabilities & Findings</option>
                <option value="BUSINESS_SERVICES">Business Services</option>
                <option value="CONTROLS">Security Controls</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              CSV Data Content (Paste or load export)
            </label>
            <textarea
              rows={6}
              required
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50"
            >
              {uploadMutation.isPending ? "Parsing..." : "Preview & Validate"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Validate & Preview */}
      {step === 2 && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Parsed {preview.total_rows} rows. All {preview.valid_rows_count} records valid for canonical ingestion.
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800">
                <tr>
                  {preview.detected_columns.map((col) => (
                    <th key={col} className="px-3 py-2 font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {preview.preview_rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    {preview.detected_columns.map((col) => (
                      <td key={col} className="px-3 py-2 font-mono text-[11px] text-slate-300">
                        {String(row[col] || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Confirm Schema & Map Columns <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Map Columns */}
      {step === 3 && preview && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Confirm how detected file columns match canonical fields in the risk platform database.
          </p>

          <div className="space-y-2.5">
            {preview.detected_columns.map((col) => (
              <div
                key={col}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-850/60 border border-slate-800"
              >
                <span className="font-mono text-xs text-indigo-300 font-semibold">{col}</span>
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <select
                    value={columnMapping[col] || "ignore"}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [col]: e.target.value })}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    <option value="name">Asset Name / Hostname</option>
                    <option value="ip_address">IP Address</option>
                    <option value="operating_system">Operating System</option>
                    <option value="asset_type">Asset Type</option>
                    <option value="environment">Environment</option>
                    <option value="criticality">Criticality Level</option>
                    <option value="cve_id">CVE ID</option>
                    <option value="ignore">(Ignore Column)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleExecute}
              disabled={executeMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {executeMutation.isPending ? "Executing Import..." : "Execute Ingestion"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-100">Ingestion Batch Completed</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            File <span className="font-mono text-indigo-400">{result.filename}</span> was successfully ingested and correlated with internal security asset trees.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
            <div className="p-3 bg-slate-850/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Total Rows</span>
              <span className="text-base font-bold text-slate-100 font-mono mt-0.5 block">
                {result.total_rows}
              </span>
            </div>
            <div className="p-3 bg-slate-850/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Valid Ingested</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                {result.valid_rows}
              </span>
            </div>
            <div className="p-3 bg-slate-850/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Duplicates Correlated</span>
              <span className="text-base font-bold text-sky-400 font-mono mt-0.5 block">
                {result.duplicate_rows}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                setStep(1);
                setPreview(null);
                setResult(null);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Upload Another Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
