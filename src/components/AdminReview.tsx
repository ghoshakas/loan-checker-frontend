import { useEffect, useState } from "react";
import { adminDecide, adminGet, adminRescreen, openDocument } from "../api";
import type { AdminApplication, FinalDecision } from "../types";
import { RecommendationBadge, StatusBadge } from "./Badges";
import DecisionResult from "./DecisionResult";
import { DOC_TYPE_LABEL, SLOTS } from "./DocumentSlots";

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");

const CHOICES: { value: FinalDecision; label: string; cls: string }[] = [
  { value: "approved", label: "Approve", cls: "approve" },
  { value: "rejected", label: "Reject", cls: "reject" },
  { value: "info_requested", label: "Request more info", cls: "info" },
];

/** Would this choice go against the system recommendation? (mirrors backend rule) */
function isOverride(choice: FinalDecision, rec?: string | null) {
  return (choice === "approved" && !!rec && rec !== "APPROVE") || (choice === "rejected" && rec === "APPROVE");
}

export default function AdminReview({ id, onBack, onChanged }: { id: number; onBack: () => void; onChanged: () => void }) {
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [choice, setChoice] = useState<FinalDecision | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"decide" | "rescreen" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGet(id).then(setApp).catch((e) => setError(String(e instanceof Error ? e.message : e)));
  }, [id]);

  if (!app) {
    return <div className="card placeholder">{error ?? "Loading…"}</div>;
  }

  // Approved / rejected is final: no new decision, no re-screening.
  const closed = app.status === "approved" || app.status === "rejected";
  const override = choice ? isOverride(choice, app.recommendation) : false;
  const canSubmit =
    !!choice && (!override || note.trim().length > 0) && (choice !== "info_requested" || message.trim().length > 0);

  const decide = async () => {
    if (!choice) return;
    setBusy("decide");
    setError(null);
    try {
      setApp(await adminDecide(app.id, choice, note, message));
      setChoice(null);
      setNote("");
      setMessage("");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const rescreen = async () => {
    setBusy("rescreen");
    setError(null);
    try {
      setApp(await adminRescreen(app.id));
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const a = app.application;
  return (
    <div>
      <div className="toolbar">
        <button className="ghost" onClick={onBack}>← Back to queue</button>
        {!closed && (
          <button className="ghost" onClick={rescreen} disabled={busy !== null}>
            {busy === "rescreen" ? "Re-running AI analysis…" : "Re-run AI analysis"}
          </button>
        )}
      </div>

      <div className="card">
        <div className="row-between">
          <div>
            <h2 className="inline">Application #{app.id}</h2>{" "}
            <span className="muted">
              {app.applicant.full_name} · {app.applicant.email} · submitted {fmtDate(app.created_at)}
            </span>
          </div>
          <StatusBadge value={app.status} />
        </div>
        {app.decided_by && (
          <p className="muted">
            Last decision by {app.decided_by} on {fmtDate(app.decided_at)}
            {app.decision_note ? ` — “${app.decision_note}”` : ""}
          </p>
        )}
      </div>

      {error && <div className="card error">{error}</div>}

      <div className="columns">
        <div>
          {app.screening ? (
            <DecisionResult decision={app.screening} />
          ) : (
            <div className="card placeholder">Not screened yet — use “Re-run AI analysis”.</div>
          )}
        </div>

        <div>
          {closed ? (
            <div className="card decision-card">
              <h3>Final decision</h3>
              <div>
                <StatusBadge value={app.status} />
              </div>
              <p className="muted">
                Decided by {app.decided_by ?? "—"} on {fmtDate(app.decided_at)}. System recommendation was{" "}
                <RecommendationBadge value={app.recommendation} small />. This application is closed and can't be
                changed.
              </p>
              {app.decision_note && (
                <p>
                  <strong>Internal note:</strong> {app.decision_note}
                </p>
              )}
              {app.applicant_message && (
                <p>
                  <strong>Message sent to applicant:</strong> {app.applicant_message}
                </p>
              )}
            </div>
          ) : (
          <div className="card decision-card">
            <h3>Your decision</h3>
            <p className="muted">
              System recommendation: <RecommendationBadge value={app.recommendation} small />. The final call is yours.
            </p>
            <div className="choice-row">
              {CHOICES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`choice ${c.cls}${choice === c.value ? " selected" : ""}`}
                  onClick={() => setChoice(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {override && (
              <div className="warn">
                This differs from the system recommendation. An internal justification is required and will be
                recorded in the audit trail.
              </div>
            )}
            <label>
              Internal note {override ? "(required)" : "(optional)"}
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <label>
              Message to applicant {choice === "info_requested" ? "(required — what do they need to provide?)" : "(optional)"}
              <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <button type="button" disabled={!canSubmit || busy !== null} onClick={decide}>
              {busy === "decide" ? "Saving…" : "Confirm decision"}
            </button>
          </div>
          )}

          <div className="card">
            <h3>Submitted application</h3>
            <table className="facts">
              <tbody>
                {(
                  [
                    ["Name", a.applicant_name],
                    ["Age", a.age],
                    ["Requested amount", a.requested_amount?.toLocaleString("en-IN")],
                    ["Purpose", a.loan_purpose],
                    ["Annual income", a.annual_income?.toLocaleString("en-IN")],
                    ["Employment", a.employment_status],
                    ["Years employed", a.employment_years],
                    ["Existing monthly debt", a.existing_monthly_debt?.toLocaleString("en-IN")],
                    ["Credit score", a.credit_score],
                    ["Collateral", a.collateral_value?.toLocaleString("en-IN")],
                    ["Documents uploaded", SLOTS.filter((s) => s.required).map((s) =>
                      `${app.documents.some((d) => d.declared_type === s.type) ? "✓" : "✗"} ${s.label}`).join("  ·  ")],
                  ] as [string, unknown][]
                ).map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{v === null || v === undefined || v === "" ? <span className="muted">—</span> : String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {a.free_text && (
              <>
                <h4>Applicant notes</h4>
                <p className="pre">{a.free_text}</p>
              </>
            )}
            <h4>Documents</h4>
            {app.documents.length === 0 ? (
              <p className="muted">None uploaded.</p>
            ) : (
              <ul className="file-list">
                {app.documents.map((d) => (
                  <li key={d.id}>
                    <button type="button" className="link" onClick={() => openDocument(d.id).catch((e) => setError(String(e)))}>
                      {d.filename}
                    </button>
                    <span className="muted small">
                      {DOC_TYPE_LABEL[d.declared_type ?? ""] ?? "Untyped"} · {Math.round(d.size_bytes / 1024)} KB
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3>Audit trail</h3>
            <ul className="timeline">
              {app.events.map((e, i) => (
                <li key={i}>
                  <span className="muted">{fmtDate(e.created_at)}</span>
                  <strong> {e.action.replace(/_/g, " ")}</strong> by {e.actor_name}
                  {e.detail && <div className="muted">{e.detail}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
