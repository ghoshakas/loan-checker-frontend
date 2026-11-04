import type { Decision, DocumentFinding, Facts, FieldSource, RiskInsights } from "../types";
import { RecommendationBadge, RiskBadge } from "./Badges";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const SOURCE_LABEL: Record<FieldSource, string> = {
  structured: "form",
  document: "document · AI",
  extracted: "notes · AI",
  derived: "computed",
  missing: "missing",
};

const FACT_ROWS: [string, string, (v: number | string) => string][] = [
  ["age", "Age", String],
  ["requested_amount", "Requested amount", (v) => inr(Number(v))],
  ["loan_purpose", "Purpose", String],
  ["annual_income", "Annual income", (v) => inr(Number(v))],
  ["monthly_income", "Monthly income", (v) => inr(Number(v))],
  ["employment_status", "Employment", String],
  ["employment_years", "Years employed", String],
  ["existing_monthly_debt", "Existing monthly debt", (v) => inr(Number(v))],
  ["estimated_new_emi", "Estimated new EMI", (v) => inr(Number(v))],
  ["dti_ratio", "Debt-to-income", (v) => `${(Number(v) * 100).toFixed(1)}%`],
  ["credit_score", "Credit score", String],
  ["collateral_value", "Collateral value", (v) => inr(Number(v))],
  ["loan_to_value", "Loan-to-value", (v) => `${(Number(v) * 100).toFixed(1)}%`],
];

function FactsTable({ facts }: { facts: Facts }) {
  const rows = FACT_ROWS.filter(([k]) => facts[k] !== null && facts[k] !== undefined && facts[k] !== "");
  if (!rows.length) return null;
  return (
    <section>
      <h3>Facts used</h3>
      <table className="facts">
        <tbody>
          {rows.map(([k, label, fmt]) => {
            const src = facts.field_sources[k];
            return (
              <tr key={k}>
                <td>{label}</td>
                <td>
                  {fmt(facts[k] as number | string)}
                  {src && <span className={`src src-${src}`}>{SOURCE_LABEL[src]}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const DOC_LABEL: Record<string, string> = {
  id_proof: "ID proof",
  income_proof: "Income proof",
  bank_statement: "Bank statement",
  other: "Other document",
  unreadable: "Unreadable",
};

function DocumentFindings({ docs }: { docs: DocumentFinding[] }) {
  if (!docs.length) return null;
  return (
    <section>
      <h3>Uploaded documents — read by AI <span className="llm-tag">LLM</span></h3>
      <ul className="doc-findings">
        {docs.map((d, i) => (
          <li key={i}>
            <div className="doc-head">
              <span className="file-name">{d.filename}</span>
              <span className="muted">
                {d.status === "analyzed" ? DOC_LABEL[d.document_type ?? ""] ?? d.document_type : d.status}
              </span>
            </div>
            {d.name_on_document && <div className="muted">Name on document: {d.name_on_document}</div>}
            {Object.keys(d.extracted).length > 0 && (
              <div className="kv">
                {Object.entries(d.extracted).map(([k, v]) => (
                  <span key={k}>
                    {k.replace(/_/g, " ")}: <strong>{typeof v === "number" && k !== "age" && k !== "credit_score" ? inr(v) : v}</strong>
                  </span>
                ))}
              </div>
            )}
            {d.observations.map((o, j) => (
              <div key={j} className="warn">⚠ {o}</div>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

function InsightsPanel({ insights }: { insights: RiskInsights }) {
  const list = (title: string, items: string[], cls: string) =>
    items.length > 0 && (
      <div className={`insight-list ${cls}`}>
        <h4>{title}</h4>
        <ul>{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>
    );
  return (
    <section className="ai-panel">
      <h3>
        AI risk insights <span className="llm-tag">LLM</span> <RiskBadge value={insights.risk_level} small />
      </h3>
      <p>{insights.summary}</p>
      <div className="insight-grid">
        {list("Strengths", insights.strengths, "good")}
        {list("Concerns", insights.concerns, "bad")}
      </div>
      {list("Suggested follow-ups", insights.follow_up_questions, "ask")}
      <small>Advisory only — generated after the recommendation and cannot change it. The final decision is yours.</small>
    </section>
  );
}

interface Props {
  decision: Decision;
  title?: string;
}

export default function DecisionResult({ decision, title = "System recommendation" }: Props) {
  const f = decision.facts_used;
  const notes = [...(f.extraction_notes ?? [])];
  return (
    <div className="card result">
      <div className="result-head">
        <h3 className="inline">{title}</h3>
        <RecommendationBadge value={decision.decision} />
      </div>

      {decision.missing_information.length > 0 && (
        <section>
          <h3>Missing information</h3>
          <ul>
            {decision.missing_information.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3>Reasons (deterministic rule engine)</h3>
        <ul className="reasons">
          {decision.reasons.map((r, i) => (
            <li key={i} className={r.passed ? "pass" : "fail"}>
              <span className="rid">{r.rule_id}</span>
              <span className="mark">{r.passed ? "✓" : "✗"}</span>
              <span>{r.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      {decision.insights && <InsightsPanel insights={decision.insights} />}

      <FactsTable facts={f} />
      <DocumentFindings docs={decision.documents ?? []} />

      {notes.length > 0 && (
        <section>
          <h3>Data notes</h3>
          <ul className="notes">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="ai-panel">
        <h3>AI explanation <span className="llm-tag">LLM</span></h3>
        <p>{decision.explanation || "(no explanation generated)"}</p>
        <small>
          Rules applied: {decision.policy_rules_used.join(", ") || "none"}. The AI wrote this
          explanation; it did not make the recommendation.
        </small>
      </section>
    </div>
  );
}
