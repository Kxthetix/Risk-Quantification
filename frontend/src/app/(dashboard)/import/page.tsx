import React from "react";
import Link from "next/link";
import { Upload, History } from "lucide-react";
import { ImportWizard } from "@/features/import";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Upload className="w-6 h-6 text-indigo-400" />
            File Ingestion Wizard (CSV & Excel)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload asset inventory, vulnerability scans, business services, or controls directly into the platform.
          </p>
        </div>

        <Link
          href="/import/history"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
        >
          <History className="w-4 h-4" /> Import History
        </Link>
      </div>

      <ImportWizard />
    </div>
  );
}
