"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateThreatScenario } from "@/features/risk-quantification/hooks";
import { ScenarioForm } from "@/features/risk-quantification/components/ScenarioForm";
import { ScenarioCreateFormData } from "@/features/risk-quantification/schemas";
import { ArrowLeft } from "lucide-react";

export default function CreateScenarioPage() {
  const router = useRouter();
  const createMutation = useCreateThreatScenario();

  const handleSubmit = async (data: ScenarioCreateFormData) => {
    await createMutation.mutateAsync({
      name: data.name,
      description: data.description,
      category: data.category,
      business_service_id: data.business_service_id,
      risk_owner: data.risk_owner,
      status: data.status,
      affected_asset_ids: data.affected_asset_ids,
      frequency_method: data.frequency_method,
      annual_rate_of_occurrence: data.annual_rate_of_occurrence,
      frequency_min: data.frequency_min,
      frequency_mode: data.frequency_mode,
      frequency_max: data.frequency_max,
      expected_downtime_hours: data.expected_downtime_hours,
      recovery_cost: data.recovery_cost,
      data_breach_records: data.data_breach_records,
      cost_per_record: data.cost_per_record,
      potential_regulatory_fine: data.potential_regulatory_fine,
      legal_and_consulting_cost: data.legal_and_consulting_cost,
      customer_compensation: data.customer_compensation,
      third_party_penalty: data.third_party_penalty,
      insurance_recovery_limit: data.insurance_recovery_limit,
      insurance_deductible: data.insurance_deductible,
      simulation_count: data.simulation_count,
      random_seed: data.random_seed,
    });
    router.push("/risk-quantification/scenarios");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/risk-quantification/scenarios"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Cyber Risk Scenario</h1>
          <p className="text-xs text-muted-foreground">
            Define incident frequency and financial loss parameters for Monte Carlo simulation.
          </p>
        </div>
      </div>

      <ScenarioForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        onCancel={() => router.push("/risk-quantification/scenarios")}
      />
    </div>
  );
}
