import { useCallback, useEffect, useState } from "react";
import { addDocuments, myApplications, openDocument, submitApplication } from "../api";
import type { ApplicantApplication, LoanApplication, SlotFile, User } from "../types";
import ApplicationForm from "./ApplicationForm";
import { StatusBadge } from "./Badges";
import DocumentSlots, { DOC_TYPE_LABEL, MAX_FILES } from "./DocumentSlots";

const blank = (user: User): LoanApplication => ({
  applicant_name: user.full_name,
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
});

const fmtDate = (s: string) => new Date(s).toLocaleString();
const inr = (n?: number | null) => (n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`);

const STATUS_HELP: Record<ApplicantApplication["status"], string> = {
  pending_review: "A loan officer is reviewing your application.",
  info_requested: "The loan officer needs more information — see the message below and upload what's requested.",
  approved: "Your application has been approved.",
  rejected: "Your application was not approved.",
};

function ApplicationCard({ app, onUpdated }: { app: ApplicantApplication; onUpdated: () => void }) {
  const [files, setFiles] = useState<SlotFile[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = app.status === "pending_review" || app.status === "info_requested";
  const remaining = MAX_FILES - app.documents.length;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await addDocuments(app.id, files, note);
      setFiles([]);
      setNote("");
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="row-between">
        <div>
          <strong>Application #{app.id}</strong>{" "}
          <span className="muted">
            · {app.application.loan_purpose || "loan"} · {inr(app.application.requested_amount)} · submitted{" "}
            {fmtDate(app.created_at)}
          </span>
        </div>
        <StatusBadge value={app.status} />
      </div>
      <p className="muted">{STATUS_HELP[app.status]}</p>

      {app.applicant_message && (
        <div className={`message ${app.status}`}>
          <strong>Message from the loan officer:</strong> {app.applicant_message}
        </div>
      )}

      {app.documents.length > 0 && (
        <>
          <h4>Your documents</h4>
          <ul className="file-list">
            {app.documents.map((d) => (
              <li key={d.id}>
                <button type="button" className="link" onClick={() => openDocument(d.id).catch((e) => setError(String(e)))}>
                  {d.filename}
                </button>
                <span className="muted small">{DOC_TYPE_LABEL[d.declared_type ?? ""] ?? "Document"} · {fmtDate(d.uploaded_at)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {open && remaining > 0 && (
        <details open={app.status === "info_requested"}>
          <summary>Add documents or a note</summary>
          <DocumentSlots docs={files} setDocs={setFiles} existing={app.documents} />
          <label>
            Note to the loan officer (optional)
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button type="button" disabled={busy || (!files.length && !note.trim())} onClick={send}>
            {busy ? "Uploading & analysing…" : "Send update"}
          </button>
        </details>
      )}
    </div>
  );
}

export default function ApplicantPanel({ user }: { user: User }) {
  const [apps, setApps] = useState<ApplicantApplication[] | null>(null);
  const [view, setView] = useState<"list" | "new">("list");
  const [form, setForm] = useState<LoanApplication>(blank(user));
  const [files, setFiles] = useState<SlotFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    myApplications()
      .then((a) => {
        setApps(a);
        if (a.length === 0) setView("new");
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(load, [load]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await submitApplication(form, files);
      setForm(blank(user));
      setFiles([]);
      setView("list");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <button className={view === "list" ? "tab active" : "tab"} onClick={() => setView("list")}>
          My applications {apps ? `(${apps.length})` : ""}
        </button>
        <button className={view === "new" ? "tab active" : "tab"} onClick={() => setView("new")}>
          New application
        </button>
      </div>

      {error && <div className="card error">{error}</div>}

      {view === "new" ? (
        <div className="narrow">
          <ApplicationForm
            app={form}
            setApp={setForm}
            onSubmit={submit}
            loading={busy}
            title="Apply for a loan"
            submitLabel={busy ? "Submitting…" : "Submit application"}
            docs={files}
            setDocs={setFiles}
          />
          {busy && <p className="muted">Uploading and analysing your documents — this can take a little while.</p>}
        </div>
      ) : apps === null ? (
        <div className="card placeholder">Loading…</div>
      ) : apps.length === 0 ? (
        <div className="card placeholder">You have no applications yet.</div>
      ) : (
        apps.map((a) => <ApplicationCard key={a.id} app={a} onUpdated={load} />)
      )}
    </div>
  );
}
