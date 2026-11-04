import type { Decision, Facts } from "../types";

const BADGE: Record<string, string> = {
  APPROVE: "badge approve",
  REJECT: "badge reject",
  REQUIRES_REVIEW: "badge review",
  INCOMPLETE: "badge incomplete",
};

const LABEL: Record<string, string> = {
  APPROVE: "Approve",
  REJECT: "Reject",
  REQUIRES_REVIEW: "Requires review",
  INCOMPLETE: "Incomplete",
};

function derived(facts: Facts) {
  const rows: [string, string][] = [];
  if (facts.monthly_income != null) rows.push(["Monthly income", `₹${facts.monthly_income.toLocaleString()}`]);
  if (facts.estimated_new_emi != null) rows.push(["Estimated new EMI", `₹${facts.estimated_new_emi.toLocaleString()}`]);
  if (facts.dti_ratio != null) rows.push(["Debt-to-income", `${(facts.dti_ratio * 100).toFixed(1)}%`]);
  if (facts.loan_to_value != null) rows.push(["Loan-to-value", `${(facts.loan_to_value * 100).toFixed(1)}%`]);
  return rows;
}

export default function DecisionResult({ decision }: { decision: Decision }) {
  const notes = decision.facts_used.extraction_notes ?? [];
  return (
    <div className="card result">
      <div className="result-head">
        <span className={BADGE[decision.decision]}>{LABEL[decision.decision]}</span>
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

      {derived(decision.facts_used).length > 0 && (
        <section>
          <h3>Derived facts (computed by code)</h3>
          <table className="facts">
            <tbody>
              {derived(decision.facts_used).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {notes.length > 0 && (
        <section>
          <h3>Extraction notes</h3>
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
          Rules applied: {decision.policy_rules_used.join(", ") || "none"}. The AI
          wrote this explanation; it did not make the decision.
        </small>
      </section>
    </div>
  );
}
