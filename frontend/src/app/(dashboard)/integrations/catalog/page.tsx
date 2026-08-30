import React from "react";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { IntegrationCatalog } from "@/features/integrations";

export default function IntegrationsCatalogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/integrations"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            Integrations Catalog
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse all backend-supported security connectors, discovery agents, and automated data pipelines.
          </p>
        </div>
      </div>

      <IntegrationCatalog />
    </div>
  );
}
