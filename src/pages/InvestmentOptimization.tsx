import React from 'react';
import InvestmentOptimizerView from '../components/InvestmentOptimizerView';
import ModelProvenanceBanner from '../components/ModelProvenanceBanner';
import ExposureBasisNote from '../components/ExposureBasisNote';
import DataQualityBanner from '../components/DataQualityBanner';
import { ProcessedScanResult } from '../utils/riskUtils';

interface InvestmentOptimizationProps {
  data: ProcessedScanResult;
}

/**
 * The optimiser recommends how to spend a budget by ranking controls against the exposure they
 * remove, so every recommendation inherits the provenance of the exposure figure it was ranked
 * against. That figure is a sum across two scoring paths. Presenting an allocation without saying
 * so invites a reader to treat "removes ₹1.2 Cr of exposure" as a measurement when part of the
 * baseline is a deterministic formula's output.
 */
export default function InvestmentOptimization({ data }: InvestmentOptimizationProps) {
  return (
    <div className="space-y-6">
      <ModelProvenanceBanner model={data.model} />
      <DataQualityBanner quality={data.dataQuality} label="the optimiser figures below" />

      <ExposureBasisNote
        model={data.model}
        totalExposureInr={data.totalFinancialExposureInr}
        label="the exposure baseline every recommendation below is ranked against"
      />

      <InvestmentOptimizerView
        candidateInvestments={data.candidateInvestments}
        initialBudget={data.scanMetadata.security_budget_available_inr}
        currentOrgRiskScore={data.overallOrgRiskScore}
        totalFinancialExposure={data.totalFinancialExposureInr}
        findings={data.findings}
      />
    </div>
  );
}
