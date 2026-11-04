import type {
  AdminApplication,
  AdminApplicationSummary,
  ApplicantApplication,
  AppStatus,
  AuthResponse,
  Decision,
  FinalDecision,
  LoanApplication,
  SlotFile,
  Stats,
  User,
} from "./types";

// Dev: always use the relative /api path; the Vite dev server proxies it to
// VITE_BACKEND_URL (see vite.config.ts).
// Production build: call VITE_BACKEND_URL directly (vite.config.ts refuses to
// build without it).
const BASE = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_BACKEND_URL!.replace(/\/+$/, "");

// ------------------------------------------------------------ token storage --
const TOKEN_KEY = "loan-screening-token";
let token: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

export function setToken(value: string | null) {
  token = value;
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: keep the token in memory only */
  }
}

export const hasToken = () => token !== null;

// Called when the server says the session is no longer valid.
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

// ----------------------------------------------------------------- request --
function errorMessage(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) =>
        `${(d.loc ?? []).filter((p) => p !== "body").join(".")}: ${d.msg ?? ""}`)
      .join("; ");
  }
  return `Request failed (${status})`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401 && token) {
    setToken(null);
    onUnauthorized();
  }
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error */
    }
    throw new Error(errorMessage(res.status, body));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

// -------------------------------------------------------------------- misc --
export const health = () => request<{ llm_available: boolean; model: string }>("/health");

/** Stateless screening (admin Sandbox tab). Nothing is stored. */
export const screen = (app: LoanApplication) => request<Decision>("/screen", json(app));

// -------------------------------------------------------------------- auth --
export const register = (email: string, password: string, full_name: string) =>
  request<AuthResponse>("/auth/register", json({ email, password, full_name }));
export const login = (email: string, password: string) =>
  request<AuthResponse>("/auth/login", json({ email, password }));
export const logout = () => request<void>("/auth/logout", { method: "POST" });
export const me = () => request<User>("/auth/me");

// --------------------------------------------------------------- applicant --
/** Each file is sent with its upload slot (`document_types`, same order). */
function appendDocs(form: FormData, docs: SlotFile[]) {
  docs.forEach((d) => {
    form.append("files", d.file, d.file.name);
    form.append("document_types", d.type);
  });
}

export function submitApplication(app: LoanApplication, docs: SlotFile[]) {
  const form = new FormData();
  form.append("application", JSON.stringify(app));
  appendDocs(form, docs);
  return request<ApplicantApplication>("/applications", { method: "POST", body: form });
}

export const myApplications = () => request<ApplicantApplication[]>("/applications");

export function addDocuments(id: number, docs: SlotFile[], note: string) {
  const form = new FormData();
  appendDocs(form, docs);
  if (note.trim()) form.append("note", note.trim());
  return request<ApplicantApplication>(`/applications/${id}/documents`, { method: "POST", body: form });
}

// ------------------------------------------------------------------- admin --
export function adminList(status?: AppStatus | "") {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<AdminApplicationSummary[]>(`/admin/applications${q}`);
}
export const adminGet = (id: number) => request<AdminApplication>(`/admin/applications/${id}`);
export const adminRescreen = (id: number) =>
  request<AdminApplication>(`/admin/applications/${id}/rescreen`, { method: "POST" });
export const adminDecide = (
  id: number,
  decision: FinalDecision,
  note: string,
  message_to_applicant: string,
) => request<AdminApplication>(`/admin/applications/${id}/decision`,
  json({ decision, note: note || null, message_to_applicant: message_to_applicant || null }));
export const adminStats = () => request<Stats>("/admin/stats");

// --------------------------------------------------------------- documents --
/** Fetch a document with the auth header and open it in a new tab. */
export async function openDocument(id: number) {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const win = window.open("", "_blank");
  const res = await fetch(`${BASE}/documents/${id}`, { headers });
  if (!res.ok) {
    win?.close();
    throw new Error(`Could not open document (${res.status})`);
  }
  const url = URL.createObjectURL(await res.blob());
  if (win) win.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
