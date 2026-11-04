import { useEffect, useState } from "react";
import { hasToken, health, logout, me, setToken, setUnauthorizedHandler } from "./api";
import AdminPanel from "./components/AdminPanel";
import ApplicantPanel from "./components/ApplicantPanel";
import AuthPage from "./components/AuthPage";
import type { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(hasToken());
  const [llm, setLlm] = useState<boolean | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    health().then((h) => setLlm(h.llm_available)).catch(() => setLlm(null));
    if (hasToken()) {
      me()
        .then(setUser)
        .catch(() => setToken(null))
        .finally(() => setChecking(false));
    }
  }, []);

  const signOut = async () => {
    try {
      await logout();
    } catch {
      /* already invalid */
    }
    setToken(null);
    setUser(null);
  };

  return (
    <div className="page">
      <header className="row-between">
        <div>
          <h1>AI Loan Screening</h1>
          <p className="sub">
            The AI reads documents and notes into facts · a rule engine recommends · the AI suggests · a human
            officer decides.
          </p>
          <div className="llm-status">
            AI document reading &amp; insights:{" "}
            {llm === null ? "unknown" : llm ? "enabled" : "disabled (no API key — rule engine only)"}
          </div>
        </div>
        {user && (
          <div className="user-box">
            <div>
              <strong>{user.full_name}</strong>
              <div className="muted small">{user.role === "admin" ? "Loan officer (admin)" : "Applicant"}</div>
            </div>
            <button className="ghost" onClick={signOut}>Sign out</button>
          </div>
        )}
      </header>

      {checking ? (
        <div className="card placeholder">Loading…</div>
      ) : !user ? (
        <AuthPage
          onAuth={(r) => {
            setToken(r.token);
            setUser(r.user);
          }}
        />
      ) : user.role === "admin" ? (
        <AdminPanel />
      ) : (
        <ApplicantPanel user={user} />
      )}
    </div>
  );
}
