"use client";

import React from "react";
import {
  DetectionRulesTable,
  useDetectionRules,
} from "@/features/detection-rules";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { DETECTION_RULES_KEYS } from "@/features/detection-rules";

export default function DetectionRulesPage() {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading, isRefetching } = useDetectionRules();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: DETECTION_RULES_KEYS.all });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/80 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              SOC Detection Rules & Behavioral Logic
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative detection rule signatures, MITRE ATT&CK correlation logic, and real-time sandbox testing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh Rules
          </Button>
        </div>
      </div>

      {/* Rules Table */}
      <DetectionRulesTable rules={rules} isLoading={isLoading} />
    </div>
  );
}
