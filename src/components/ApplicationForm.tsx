import type { LoanApplication, SlotFile } from "../types";
import DocumentSlots from "./DocumentSlots";

const DOCS = ["id_proof", "income_proof", "bank_statement"];

interface Props {
  app: LoanApplication;
  setApp: (app: LoanApplication) => void;
  onSubmit: () => void;
  loading: boolean;
  title?: string;
  submitLabel?: string;
  // When provided, the form shows one upload slot per document type instead of
  // the tick boxes (the tick boxes remain only for the stateless Sandbox).
  docs?: SlotFile[];
  setDocs?: (docs: SlotFile[]) => void;
}

export default function ApplicationForm({
  app, setApp, onSubmit, loading,
  title = "Loan application", submitLabel = "Screen application", docs, setDocs,
}: Props) {
  const num = (v: string): number | null => (v === "" ? null : Number(v));
  const set = (patch: Partial<LoanApplication>) => setApp({ ...app, ...patch });

  const toggleDoc = (doc: string) => {
    const have = app.documents_provided.includes(doc);
    set({
      documents_provided: have
        ? app.documents_provided.filter((d) => d !== doc)
        : [...app.documents_provided, doc],
    });
  };

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2>{title}</h2>

      <div className="grid">
        <label>
          Applicant name
          <input
            value={app.applicant_name ?? ""}
            onChange={(e) => set({ applicant_name: e.target.value })}
          />
        </label>
        <label>
          Age
          <input type="number" value={app.age ?? ""} onChange={(e) => set({ age: num(e.target.value) })} />
        </label>
        <label>
          Requested amount (₹)
          <input type="number" value={app.requested_amount ?? ""} onChange={(e) => set({ requested_amount: num(e.target.value) })} />
        </label>
        <label>
          Loan purpose
          <input value={app.loan_purpose ?? ""} onChange={(e) => set({ loan_purpose: e.target.value })} />
        </label>
        <label>
          Annual income (₹)
          <input type="number" value={app.annual_income ?? ""} onChange={(e) => set({ annual_income: num(e.target.value) })} />
        </label>
        <label>
          Employment status
          <select
            value={app.employment_status ?? ""}
            onChange={(e) => set({ employment_status: e.target.value || null })}
          >
            <option value="">—</option>
            <option value="salaried">Salaried</option>
            <option value="government">Government</option>
            <option value="permanent">Permanent</option>
            <option value="self-employed">Self-employed</option>
            <option value="contract">Contract</option>
            <option value="unemployed">Unemployed</option>
          </select>
        </label>
        <label>
          Years employed
          <input type="number" value={app.employment_years ?? ""} onChange={(e) => set({ employment_years: num(e.target.value) })} />
        </label>
        <label>
          Existing monthly debt (₹)
          <input type="number" value={app.existing_monthly_debt ?? ""} onChange={(e) => set({ existing_monthly_debt: num(e.target.value) })} />
        </label>
        <label>
          Credit score
          <input type="number" value={app.credit_score ?? ""} onChange={(e) => set({ credit_score: num(e.target.value) })} />
        </label>
        <label>
          Collateral value (₹, optional)
          <input type="number" value={app.collateral_value ?? ""} onChange={(e) => set({ collateral_value: num(e.target.value) })} />
        </label>
      </div>

      {docs && setDocs ? (
        <DocumentSlots docs={docs} setDocs={setDocs} />
      ) : (
      <fieldset className="docs">
        <legend>Documents on file (simulated — Sandbox only)</legend>
        {DOCS.map((doc) => (
          <label key={doc} className="checkbox">
            <input
              type="checkbox"
              checked={app.documents_provided.includes(doc)}
              onChange={() => toggleDoc(doc)}
            />
            {doc.replace("_", " ")}
          </label>
        ))}
      </fieldset>
      )}

      <label>
        Applicant notes (free text — facts here are extracted by the LLM)
        <textarea
          rows={4}
          value={app.free_text ?? ""}
          onChange={(e) => set({ free_text: e.target.value })}
          placeholder="e.g. I'm 32, salaried for 6 years, want a 15 lakh home loan, credit score 760..."
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Working…" : submitLabel}
      </button>
    </form>
  );
}
