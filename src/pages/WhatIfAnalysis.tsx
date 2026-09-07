import React from 'react';
import WhatIfAnalysisView from '../components/WhatIfAnalysisView';
import ModelProvenanceBanner from '../components/ModelProvenanceBanner';
import ExposureBasisNote from '../components/ExposureBasisNote';
import DataQualityBanner from '../components/DataQualityBanner';
import { ProcessedScanResult } from '../utils/riskUtils';

interface WhatIfAnalysisProps {
  data: ProcessedScanResult;
}

/**
 * Every simulated reduction on this tab is a delta against the baseline exposure, so the baseline's
 * provenance is the ceiling on how much any "after" figure can be trusted. Stated here rather than
 * left to the Overview tab, because a scenario is exactly the kind of output that gets screenshotted
 * away from the page that carried the caveat.
 */
export default function WhatIfAnalysis({ data }: WhatIfAnalysisProps) {
  return (
    <div className="space-y-6">
      <ModelProvenanceBanner model={data.model} />
      <DataQualityBanner quality={data.dataQuality} label="the scenario figures below" />

      <ExposureBasisNote
        model={data.model}
        totalExposureInr={data.totalFinancialExposureInr}
        label="the baseline exposure every scenario below is measured against"
      />

      <WhatIfAnalysisView
        candidateInvestments={data.candidateInvestments}
        baselineRiskScore={data.overallOrgRiskScore}
        baselineExposure={data.totalFinancialExposureInr}
        findings={data.findings}
      />
    </div>
  );
}
