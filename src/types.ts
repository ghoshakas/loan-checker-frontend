// TypeScript mirror of the backend JSON contracts
// (app/schemas.py for screening, app/api_schemas.py for accounts & panels).

export type DecisionType = "APPROVE" | "REJECT" | "REQUIRES_REVIEW" | "INCOMPLETE";

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

export type FieldSource = "structured" | "document" | "extracted" | "derived" | "missing";

export interface Facts {
  monthly_income?: number | null;
  estimated_new_emi?: number | null;
  dti_ratio?: number | null;
  loan_to_value?: number | null;
  field_sources: Record<string, FieldSource>;
  extraction_notes: string[];
  documents_uploaded: string[];
  document_mismatches: string[];
  [key: string]: unknown;
}

export interface Reason {
  rule_id: string;
  description: string;
  passed: boolean;
  detail: string;
}

export interface DocumentFinding {
  filename: string;
  status: "analyzed" | "skipped" | "failed";
  document_type?: string | null;
  name_on_document?: string | null;
  extracted: Record<string, number | string>;
  observations: string[];
}

export interface RiskInsights {
  risk_level: "low" | "medium" | "high";
  summary: string;
  strengths: string[];
  concerns: string[];
  follow_up_questions: string[];
}

export interface Decision {
  decision: DecisionType;
  reasons: Reason[];
  missing_information: string[];
  policy_rules_used: string[];
  explanation: string;
  facts_used: Facts;
  documents: DocumentFinding[];
  insights?: RiskInsights | null;
}

// ---------------------------------------------------------------- accounts --
export type Role = "applicant" | "admin";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ------------------------------------------------------------ applications --
export type AppStatus = "pending_review" | "info_requested" | "approved" | "rejected";
export type FinalDecision = "approved" | "rejected" | "info_requested";

export type DocType = "id_proof" | "income_proof" | "bank_statement" | "other";

/** A file chosen in the browser, tagged with the upload slot it was put in. */
export interface SlotFile {
  file: File;
  type: DocType;
}

export interface StoredDocument {
  id: number;
  filename: string;
  mime_type: string;
  size_bytes: number;
  declared_type?: DocType | null;
  uploaded_at: string;
}

export interface ApplicantApplication {
  id: number;
  status: AppStatus;
  created_at: string;
  updated_at: string;
  application: LoanApplication;
  documents: StoredDocument[];
  final_decision?: "approved" | "rejected" | null;
  applicant_message?: string | null;
  decided_at?: string | null;
  /** True while the AI screening runs in the background (can take minutes). */
  screening_in_progress?: boolean;
}

export interface AppEvent {
  action: string;
  detail?: string | null;
  actor_name?: string | null;
  created_at: string;
}

export interface AdminApplication extends ApplicantApplication {
  applicant: User;
  screening?: Decision | null;
  recommendation?: DecisionType | null;
  risk_level?: RiskInsights["risk_level"] | null;
  screened_at?: string | null;
  decision_note?: string | null;
  decided_by?: string | null;
  events: AppEvent[];
}

export interface AdminApplicationSummary {
  id: number;
  applicant_name: string;
  applicant_email: string;
  requested_amount?: number | null;
  loan_purpose?: string | null;
  status: AppStatus;
  recommendation?: DecisionType | null;
  risk_level?: RiskInsights["risk_level"] | null;
  document_count: number;
  created_at: string;
  screening_in_progress?: boolean;
}

export interface Stats {
  total: number;
  by_status: Record<AppStatus, number>;
  by_recommendation: Partial<Record<DecisionType, number>>;
}
