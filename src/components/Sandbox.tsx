import { useState } from "react";
import { screen } from "../api";
import { EXAMPLES } from "../examples";
import type { Decision, LoanApplication } from "../types";
import ApplicationForm from "./ApplicationForm";
import DecisionResult from "./DecisionResult";

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

/** Stateless screening for trying out the policy — nothing is stored. */
export default function Sandbox() {
  const [app, setApp] = useState<LoanApplication>(EXAMPLES[0].app);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <>
      <p className="muted">Try the screening policy on example data. Nothing here is saved.</p>
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
    </>
  );
}
