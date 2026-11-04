import { useEffect, useState } from "react";
import ApplicationForm from "./components/ApplicationForm";
import DecisionResult from "./components/DecisionResult";
import { EXAMPLES } from "./examples";
import { health, screen } from "./api";
import type { Decision, LoanApplication } from "./types";

const EMPTY: LoanApplication = {
  applicant_name: "",
  age: null,
  requested_amount: null,
  loan_purpose: "",
  annual_income: null,
  employment_status: null,
  employment_years: null,
  existing_monthly_debt: null,
  credit_score: null,
  collateral_value: null,
  documents_provided: [],
  free_text: "",
};

export default function App() {
  const [app, setApp] = useState<LoanApplication>(EXAMPLES[0].app);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llm, setLlm] = useState<boolean | null>(null);

  useEffect(() => {
    health()
      .then((h) => setLlm(h.llm_available))
      .catch(() => setLlm(null));
  }, []);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setDecision(await screen(app));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header>
        <h1>AI Loan Application Screening Assistant</h1>
        <p className="sub">
          Facts are validated by code · the decision is made by a deterministic
          rule engine · the LLM only extracts facts and explains.
        </p>
        <div className="llm-status">
          LLM extraction/explanation:{" "}
          {llm === null ? "unknown" : llm ? "enabled" : "disabled (no API key — deterministic fallback)"}
        </div>
      </header>

      <div className="toolbar">
        {EXAMPLES.map((ex) => (
          <button key={ex.label} className="ghost" onClick={() => { setApp(ex.app); setDecision(null); }}>
            {ex.label}
          </button>
        ))}
        <button className="ghost" onClick={() => { setApp(EMPTY); setDecision(null); }}>
          Clear
        </button>
      </div>

      <div className="columns">
        <ApplicationForm app={app} setApp={setApp} onSubmit={run} loading={loading} />
        <div>
          {error && <div className="card error">{error}</div>}
          {decision ? (
            <DecisionResult decision={decision} />
          ) : (
            <div className="card placeholder">Submit an application to see the recommendation.</div>
          )}
        </div>
      </div>
    </div>
  );
}
