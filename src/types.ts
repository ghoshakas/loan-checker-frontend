// TypeScript mirror of the backend JSON contract (app/schemas.py).

export type DecisionType =
  | "APPROVE"
  | "REJECT"
  | "REQUIRES_REVIEW"
  | "INCOMPLETE";

export interface LoanApplication {
  applicant_name?: string | null;
  age?: number | null;
  requested_amount?: number | null;
  loan_purpose?: string | null;
  annual_income?: number | null;
  employment_status?: string | null;
  employment_years?: number | null;
  existing_monthly_debt?: number | null;
  credit_score?: number | null;
  collateral_value?: number | null;
  documents_provided: string[];
  free_text?: string | null;
}

export interface Facts {
  monthly_income?: number | null;
  estimated_new_emi?: number | null;
  dti_ratio?: number | null;
  loan_to_value?: number | null;
  field_sources: Record<string, string>;
  extraction_notes: string[];
  [key: string]: unknown;
}

export interface Reason {
  rule_id: string;
  description: string;
  passed: boolean;
  detail: string;
}

export interface Decision {
  decision: DecisionType;
  reasons: Reason[];
  missing_information: string[];
  policy_rules_used: string[];
  explanation: string;
  facts_used: Facts;
}
