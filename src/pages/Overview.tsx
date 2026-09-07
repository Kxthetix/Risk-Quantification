import React, { useMemo } from 'react';
import KPIGrid from '../components/KPIGrid';
import RiskTrendChart from '../components/RiskTrendChart';
import TopRiskList from '../components/TopRiskList';
import ModelProvenanceBanner from '../components/ModelProvenanceBanner';
import ExposureBasisNote from '../components/ExposureBasisNote';
import DataQualityBanner from '../components/DataQualityBanner';
import { ProcessedScanResult, runKnapsackOptimization } from '../utils/riskUtils';

interface OverviewProps {
  data: ProcessedScanResult;
  onSelectFinding?: (findingId: string) => void;
}

export default function Overview({ data, onSelectFinding }: OverviewProps) {
  // The budget card used to show a flat 70% of the available budget as "utilized", which was an
  // invented number rendered with two decimals of confidence beside four measured ones. What the
  // platform can actually say is how much the recommended portfolio would commit, so it says that
  // and nothing more — the same optimiser the Investment tab runs, on the same inputs.
  const committed = useMemo(() => {
    const budget = data.scanMetadata.security_budget_available_inr;
    if (budget <= 0 || data.candidateInvestments.length === 0) return 0;
    return runKnapsackOptimization(
      budget,
      data.candidateInvestments,
      data.overallOrgRiskScore,
      data.totalFinancialExposureInr
    ).totalCost;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Where every figure below came from. First element on the page, by design. */}
      <ModelProvenanceBanner model={data.model} />

      {/* And what the scan file itself could not supply. Above the KPI cards rather than below
          them: a reader who has already taken in "₹26.6 crore" has formed the impression the
          caveat exists to qualify. Renders nothing when the file was clean. */}
      <DataQualityBanner quality={data.dataQuality} label="the exposure and index figures below" />

      {/* 4 Top KPI Cards */}
      <KPIGrid
        overallRiskScore={data.overallOrgRiskScore}
        totalFinancialExposure={data.totalFinancialExposureInr}
        criticalVulnsCount={data.criticalFindingsCount}
        totalAssetsCount={data.assets.length}
        allocatedBudget={data.scanMetadata.security_budget_available_inr}
        committedBudget={committed}
      />

      {/* The KPI grid's exposure figure and the org risk index derived from it are both sums over
          findings scored two different ways. The banner above says how many findings the model
          predicted, and how many carry an observed KEV probability instead; this says how the money
          divides, which is the question a board actually asks. */}
      <ExposureBasisNote
        model={data.model}
        totalExposureInr={data.totalFinancialExposureInr}
        label="the total expected annual loss above"
      />

      {/* 14-Day Dynamic Trend Chart */}
      <RiskTrendChart trendData={data.trendData} />

      {/* Ranked Top 5 High-Risk Findings */}
      <TopRiskList findings={data.findings} onSelectFinding={onSelectFinding} />
    </div>
  );
}
