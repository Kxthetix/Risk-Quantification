"use client";

import { useReportHistory } from "../index";
import { Download, FileText, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export function ReportHistoryTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch, isFetching } = useReportHistory(page);

  if (isLoading) return <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-400" />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
        <p className="text-red-400">Failed to load report history.</p>
      </div>
    );
  }

  const handleDownload = (id: string, format: string) => {
    // API endpoint triggers downloading
    window.open(`/api/v1/reports/${id}/download`, "_blank");
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">Generated Reports</h3>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md p-1.5 hover:bg-slate-700/50 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!data?.items?.length ? (
        <div className="p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-500 mb-2" />
          <p className="text-gray-400">No reports generated yet.</p>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Report Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5 text-gray-300"
                  >
                    <td className="px-4 py-3 font-medium text-white">{item.report_name}</td>
                    <td className="px-4 py-3 capitalize">{item.report_type.replace("_", " ")}</td>
                    <td className="px-4 py-3 uppercase text-xs">{item.format}</td>
                    <td className="px-4 py-3">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "COMPLETED"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : item.status === "FAILED"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === "COMPLETED" && (
                        <button
                          onClick={() => handleDownload(item.id, item.format)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Download className="h-3 w-3" /> Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.total > data.page_size && (
            <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs">
              <span className="text-gray-400">
                Showing {Math.min(data.total, (page - 1) * data.page_size + 1)} -{" "}
                {Math.min(data.total, page * data.page_size)} of {data.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * data.page_size >= data.total}
                  className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
