import { useRef, useState } from "react";
import type { DocType, SlotFile, StoredDocument } from "../types";

// Mirrors backend limits in app/document_analyzer.py (the server re-checks).
export const MAX_FILES = 5;
const MAX_FILE_MB = 10;
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp";
const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export const SLOTS: { type: DocType; label: string; hint: string; required: boolean }[] = [
  { type: "id_proof", label: "ID proof", hint: "Aadhaar, PAN, passport, driving licence or voter ID", required: true },
  { type: "income_proof", label: "Income proof", hint: "Recent salary slip, Form 16 or ITR", required: true },
  { type: "bank_statement", label: "Bank statement", hint: "Last 3–6 months", required: true },
  { type: "other", label: "Other supporting documents", hint: "Credit report, collateral papers, etc.", required: false },
];

export const DOC_TYPE_LABEL: Record<string, string> = Object.fromEntries(SLOTS.map((s) => [s.type, s.label]));

const size = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

interface SlotProps {
  slot: (typeof SLOTS)[number];
  files: SlotFile[];
  existing: StoredDocument[];
  canAdd: boolean;
  onAdd: (files: FileList) => void;
  onRemove: (f: SlotFile) => void;
}

function Slot({ slot, files, existing, canAdd, onAdd, onRemove }: SlotProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const done = files.length + existing.length > 0;
  const state = done ? "done" : slot.required ? "missing" : "optional";

  return (
    <div
      className={`slot ${state}${dragging ? " dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (canAdd) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (canAdd) onAdd(e.dataTransfer.files);
      }}
    >
      <div className="slot-head">
        <div>
          <strong>{slot.label}</strong>
          <div className="muted small">{slot.hint}</div>
        </div>
        <span className={`slot-state ${state}`}>
          {done ? "✓ Uploaded" : slot.required ? "Required" : "Optional"}
        </span>
      </div>

      {(existing.length > 0 || files.length > 0) && (
        <ul className="file-list">
          {existing.map((d) => (
            <li key={`e${d.id}`}>
              <span className="file-name">{d.filename}</span>
              <span className="muted small">already submitted</span>
            </li>
          ))}
          {files.map((f, i) => (
            <li key={`${f.file.name}-${i}`}>
              <span className="file-name">{f.file.name}</span>
              <span className="muted small">{size(f.file.size)}</span>
              <button type="button" className="link" onClick={() => onRemove(f)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="ghost slot-btn" disabled={!canAdd} onClick={() => input.current?.click()}>
        {done ? "Add another file" : "Choose file"}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          if (e.target.files) onAdd(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

interface Props {
  docs: SlotFile[];
  setDocs: (docs: SlotFile[]) => void;
  /** Documents already stored on the application (when adding more later). */
  existing?: StoredDocument[];
}

/** One upload area per required document type, plus an optional "other" slot. */
export default function DocumentSlots({ docs, setDocs, existing = [] }: Props) {
  const [warning, setWarning] = useState<string | null>(null);
  const capacity = MAX_FILES - existing.length;

  const add = (type: DocType, list: FileList) => {
    const next = [...docs];
    const problems: string[] = [];
    for (const file of Array.from(list)) {
      if (!ALLOWED.includes(file.type)) problems.push(`${file.name}: use PDF, PNG, JPEG or WEBP`);
      else if (file.size > MAX_FILE_MB * 1024 * 1024) problems.push(`${file.name}: larger than ${MAX_FILE_MB} MB`);
      else if (next.length >= capacity) problems.push(`${file.name}: max ${MAX_FILES} files per application`);
      else if (!next.some((d) => d.file.name === file.name && d.file.size === file.size)) next.push({ file, type });
    }
    setDocs(next);
    setWarning(problems.length ? problems.join(" · ") : null);
  };

  const missing = SLOTS.filter(
    (s) => s.required && !docs.some((d) => d.type === s.type) && !existing.some((d) => d.declared_type === s.type),
  );

  return (
    <fieldset className="slots">
      <legend>Documents</legend>
      <p className="muted small">
        Upload each document in its own box (PDF or photo, up to {MAX_FILE_MB} MB). The AI reads them to verify your
        details — documents that are missing or in the wrong box send the application for manual review.
      </p>
      <div className="slot-grid">
        {SLOTS.map((slot) => (
          <Slot
            key={slot.type}
            slot={slot}
            files={docs.filter((d) => d.type === slot.type)}
            existing={existing.filter((d) => d.declared_type === slot.type)}
            canAdd={docs.length < capacity}
            onAdd={(list) => add(slot.type, list)}
            onRemove={(f) => setDocs(docs.filter((d) => d !== f))}
          />
        ))}
      </div>
      {warning && <div className="warn">{warning}</div>}
      {missing.length > 0 && (
        <div className="muted small">Still needed: {missing.map((s) => s.label).join(", ")}.</div>
      )}
    </fieldset>
  );
}
