import type { AppStatus, DecisionType, RiskInsights } from "../types";

const REC: Record<DecisionType, [string, string]> = {
  APPROVE: ["approve", "Approve"],
  REJECT: ["reject", "Reject"],
  REQUIRES_REVIEW: ["review", "Requires review"],
  INCOMPLETE: ["incomplete", "Incomplete"],
};

export function RecommendationBadge({ value, small }: { value?: DecisionType | null; small?: boolean }) {
  if (!value) return <span className={`badge incomplete${small ? " sm" : ""}`}>Not screened</span>;
  const [cls, label] = REC[value];
  return <span className={`badge ${cls}${small ? " sm" : ""}`}>{label}</span>;
}

const STATUS: Record<AppStatus, [string, string]> = {
  pending_review: ["review", "Under review"],
  info_requested: ["info", "More info needed"],
  approved: ["approve", "Approved"],
  rejected: ["reject", "Rejected"],
};

export function StatusBadge({ value, small }: { value: AppStatus; small?: boolean }) {
  const [cls, label] = STATUS[value];
  return <span className={`badge ${cls}${small ? " sm" : ""}`}>{label}</span>;
}

const RISK: Record<RiskInsights["risk_level"], string> = {
  low: "approve",
  medium: "review",
  high: "reject",
};

export function RiskBadge({ value, small }: { value?: RiskInsights["risk_level"] | null; small?: boolean }) {
  if (!value) return <span className="muted">—</span>;
  return <span className={`badge ${RISK[value]}${small ? " sm" : ""}`}>{value} risk</span>;
}

export const statusLabel = (s: AppStatus) => STATUS[s][1];
