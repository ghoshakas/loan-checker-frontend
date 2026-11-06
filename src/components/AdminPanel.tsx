import { useCallback, useEffect, useState } from "react";
import { adminList, adminStats } from "../api";
import type { AdminApplicationSummary, AppStatus, Stats } from "../types";
import { usePoll } from "../usePoll";
import AdminReview from "./AdminReview";
import { RecommendationBadge, RiskBadge, StatusBadge, statusLabel } from "./Badges";
import Sandbox from "./Sandbox";

const inr = (n?: number | null) => (n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`);

export default function AdminPanel() {
  const [tab, setTab] = useState<"queue" | "sandbox">("queue");
  const [filter, setFilter] = useState<AppStatus | "">("pending_review");
  const [rows, setRows] = useState<AdminApplicationSummary[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    adminList(filter).then(setRows).catch((e) => setError(e instanceof Error ? e.message : String(e)));
    adminStats().then(setStats).catch(() => setStats(null));
  }, [filter]);

  useEffect(load, [load]);
  usePoll(selected === null && !!rows?.some((r) => r.screening_in_progress), load);

  if (tab === "queue" && selected !== null) {
    return <AdminReview id={selected} onBack={() => { setSelected(null); load(); }} onChanged={load} />;
  }

  return (
    <div>
      <div className="toolbar">
        <button className={tab === "queue" ? "tab active" : "tab"} onClick={() => setTab("queue")}>
          Review queue
        </button>
        <button className={tab === "sandbox" ? "tab active" : "tab"} onClick={() => setTab("sandbox")}>
          Sandbox (quick screen)
        </button>
      </div>

      {tab === "sandbox" ? (
        <Sandbox />
      ) : (
        <>
          {stats && (
            <div className="stats">
              {(["pending_review", "info_requested", "approved", "rejected"] as AppStatus[]).map((s) => (
                <button key={s} className={`stat${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
                  <span className="stat-num">{stats.by_status[s] ?? 0}</span>
                  <span className="muted">{statusLabel(s)}</span>
                </button>
              ))}
              <button className={`stat${filter === "" ? " active" : ""}`} onClick={() => setFilter("")}>
                <span className="stat-num">{stats.total}</span>
                <span className="muted">All</span>
              </button>
            </div>
          )}

          {error && <div className="card error">{error}</div>}

          <div className="card">
            <div className="row-between">
              <h2 className="inline">{filter ? statusLabel(filter) : "All applications"}</h2>
              <button className="ghost" onClick={load}>Refresh</button>
            </div>
            {rows === null ? (
              <p className="muted">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="muted">No applications here.</p>
            ) : (
              <div className="table-scroll">
                <table className="queue">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Applicant</th>
                      <th>Amount</th>
                      <th>System rec.</th>
                      <th>AI risk</th>
                      <th>Docs</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} onClick={() => setSelected(r.id)} tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && setSelected(r.id)}>
                        <td>{r.id}</td>
                        <td>
                          {r.applicant_name}
                          <div className="muted small">{r.applicant_email}</div>
                        </td>
                        <td>
                          {inr(r.requested_amount)}
                          <div className="muted small">{r.loan_purpose || ""}</div>
                        </td>
                        <td><RecommendationBadge value={r.recommendation} pending={r.screening_in_progress} small /></td>
                        <td><RiskBadge value={r.risk_level} small /></td>
                        <td>{r.document_count}</td>
                        <td><StatusBadge value={r.status} small /></td>
                        <td className="muted small">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
