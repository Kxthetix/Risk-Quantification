export interface InvestmentScenario {
  id: string;
  organization_id: string;
  name: string;
  budget_limit: number;
  expected_risk_reduction: number;
  expected_financial_savings: number;
  roi_percentage: number;
  selected_control_ids: string[];
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  created_at: string;
}
