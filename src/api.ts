import type { Decision, LoanApplication } from "./types";

// Dev: always use the relative /api path; the Vite dev server proxies it to
// VITE_BACKEND_URL (see vite.config.ts).
// Production build: call VITE_BACKEND_URL directly (vite.config.ts refuses to
// build without it).
const BASE = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_BACKEND_URL!.replace(/\/+$/, "");

export async function screen(app: LoanApplication): Promise<Decision> {
  const res = await fetch(`${BASE}/screen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(app),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function health(): Promise<{ llm_available: boolean; model: string }> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}
