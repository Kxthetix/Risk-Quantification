import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImportHistoryTable } from "@/features/import";

export default function ImportHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/import"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">File Ingestion History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete audit record of uploaded CSV/Excel files, processed rows, and error reports.
          </p>
        </div>
      </div>

      <ImportHistoryTable />
    </div>
  );
}
