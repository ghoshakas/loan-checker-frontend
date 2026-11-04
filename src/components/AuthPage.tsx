import { useState } from "react";
import { login, register } from "../api";
import type { AuthResponse } from "../types";

export default function AuthPage({ onAuth }: { onAuth: (r: AuthResponse) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onAuth(mode === "login" ? await login(email, password) : await register(email, password, name));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <h2>{mode === "login" ? "Sign in" : "Create an applicant account"}</h2>
        <p className="muted">
          Applicants can apply for a loan and upload documents. Loan officers sign in with their admin account.
        </p>
        {mode === "register" && (
          <label>
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "New applicant? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
