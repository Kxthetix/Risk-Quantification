"use client";

import React, { useState } from "react";
import { useBusinessServices } from "@/features/business-services/hooks";
import { BusinessServiceTable } from "@/features/business-services/components/BusinessServiceTable";
import { CreateServiceDialog } from "@/features/business-services/components/CreateServiceDialog";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, ShieldCheck, DollarSign } from "lucide-react";

export default function BusinessServicesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: services, isLoading } = useBusinessServices();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Business Services Catalog</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
              {(services || []).length} services
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Map revenue-generating workflows, dependencies, transaction velocity, and financial downtime.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateModalOpen(true)} className="text-xs h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>Register Business Service</span>
        </Button>
      </div>

      {/* Services Table */}
      <BusinessServiceTable services={services || []} isLoading={isLoading} />

      {/* Register Service Dialog */}
      <CreateServiceDialog open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
