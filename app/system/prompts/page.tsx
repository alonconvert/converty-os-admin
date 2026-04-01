"use client";

import { useState } from "react";
import { canaryDeployment } from "@/lib/mock-data";
import Link from "next/link";

const PROMPT_HISTORY = [
  {
    version: "v2.1",
    deployed: "2026-04-01 09:00",
    status: "canary",
    description: "Softer tone for price objections; added escalation hints for T3",
    author: "Claude Opus 4",
    approvalRate: 94,
    qaPassRate: 97,
    editRate: 6,
    rollouts: 3,
    messages: 48,
    changes: ["Reworded price response template", "Added 3 escalation triggers", "Reduced formal phrasing by 20%"],
  },
  {
    version: "v2.0",
    deployed: "2026-03-25 11:30",
    status: "stable",
    description: "Introduced T4 detection heuristics + complaint classifier",
    author: "Claude Opus 4",
    approvalRate: 91,
    qaPassRate: 95,
    editRate: 8,
    rollouts: 34,
    messages: 1240,
    changes: ["T4 sentiment keywords expanded", "Complaint auto-flag added", "QA Phase B integration"],
  },
  {
    version: "v1.9",
    deployed: "2026-03-10 14:00",
    status: "retired",
    description: "Baseline production prompt with confidence scoring",
    author: "Claude Sonnet 4",
    approvalRate: 88,
    qaPassRate: 92,
    editRate: 11,
    rollouts: 34,
    messages: 3820,
    changes: ["Confidence thresholds for T1-T2", "Hebrew RTL formatting fixes", "Heebo font class applied"],
  },
  {
    version: "v1.8",
    deployed: "2026-02-28 09:00",
    status: "retired",
    description: "Initial multi-tier message classification",
    author: "Claude Haiku 4",
    approvalRate: 83,
    qaPassRate: 88,
    editRate: 16,
    rollouts: 34,
    messages: 5100,
    changes: ["Tier classification (T1-T4) introduced", "Operator handoff triggers"],
  },
];

const CANARY_HOURLY = [
  { hour: "09:00", approvalRate: 90, qaPassRate: 96, editRate: 8 },
  { hour: "10:00", approvalRate: 92, qaPassRate: 95, editRate: 7 },
  { hour: "11:00", approvalRate: 93, qaPassRate: 97, editRate: 7 },
  { hour: "12:00", approvalRate: 91, qaPassRate: 98, editRate: 8 },
  { hour: "13:00", approvalRate: 94, qaPassRate: 97, editRate: 6 },
  { hour: "14:00", approvalRate: 95, qaPassRate: 97, editRate: 5 },
  { hour: "15:00", approvalRate: 94, qaPassRate: 98, editRate: 6 },
  { hour: "16:00", approvalRate: 94, qaPassRate: 97, editRate: 6 },
];

type MetricKey = "approvalRate" | "qaPassRate" | "editRate";

function MiniLineChart({ data, field, color, min, max }: {
  data: { hour: string; approvalRate: number; qaPassRate: number; editRate: number }[];
  field: MetricKey;
  color: string;
  min: number;
  max: number;
}) {
  const W = 280, H = 52;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d[field] - min) / (max - min)) * H;
    return `${x},${y}`;
  });
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2} />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((d[field] - min) / (max - min)) * H;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

export default function PromptCanaryDashboard() {
  const [rollbackModal, setRollbackModal] = useState(false);
  const [promoteModal, setPromoteModal] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>("v2.1");

  const canary = canaryDeployment;
  const hoursProgress = ((24 - canary.hoursRemaining) / 24) * 100;

  return (
    <div style={{ padding: "18px 20px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Link href="/system" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none" }}>System</Link>
            <span style={{ fontSize: 11, color: "#d1d5db" }}>›</span>
            <span style={{ fontSize: 11, color: "#374151" }}>Prompt Canary</span>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Prompt Canary Dashboard</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Deploy, monitor, and rollback AI prompt versions</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setRollbackModal(true)}
            style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}
          >
            ↩ Rollback to v2.0
          </button>
          <button
            onClick={() => setPromoteModal(true)}
            disabled={canary.hoursRemaining > 0}
            style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, border: "none", background: canary.hoursRemaining > 0 ? "#e5e7eb" : "#22c55e", color: canary.hoursRemaining > 0 ? "#9ca3af" : "#fff", cursor: canary.hoursRemaining > 0 ? "default" : "pointer", fontWeight: 600 }}
          >
            🚀 Promote to All Clients
          </button>
        </div>
      </div>

      {/* Active canary status */}
      {canary.active && (
        <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>⚗ CANARY ACTIVE</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>{canary.version}</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>·</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{canary.clients.length} clients · {canary.hoursRemaining}h remaining</span>
            </div>
            <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>{Math.round(hoursProgress)}% through 24h window</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, background: "#e9d5ff", borderRadius: 99, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ width: `${hoursProgress}%`, height: "100%", background: "#7c3aed", borderRadius: 99, transition: "width 1s" }} />
          </div>

          {/* Metrics comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Approval Rate", canaryVal: canary.approvalRate, baseline: canary.baselineApprovalRate, better: "higher", unit: "%" },
              { label: "QA Pass Rate", canaryVal: canary.qaPassRate, baseline: canary.baselineQaPassRate, better: "higher", unit: "%" },
              { label: "Edit Rate", canaryVal: canary.editRate, baseline: canary.baselineEditRate, better: "lower", unit: "%" },
            ].map((m) => {
              const improved = m.better === "higher" ? m.canaryVal > m.baseline : m.canaryVal < m.baseline;
              const delta = m.canaryVal - m.baseline;
              return (
                <div key={m.label} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", border: `1px solid ${improved ? "#d1fae5" : "#fde68a"}` }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>{m.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed", fontFamily: "'DM Serif Display', serif" }}>
                      {m.canaryVal}{m.unit}
                    </span>
                    <span style={{ fontSize: 11, color: improved ? "#16a34a" : "#d97706", fontWeight: 600 }}>
                      {delta > 0 ? "+" : ""}{delta}{m.unit} vs baseline
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ flex: 1, height: 3, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${m.baseline}%`, height: "100%", background: "#d1d5db", borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 9, color: "#9ca3af" }}>baseline {m.baseline}{m.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canary clients */}
          <div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6, fontWeight: 600 }}>CANARY CLIENTS</div>
            <div style={{ display: "flex", gap: 6 }}>
              {canary.clients.map((c) => (
                <span key={c} style={{ fontSize: 11, padding: "3px 8px", background: "#ede9fe", color: "#5b21b6", borderRadius: 5, fontFamily: "Heebo, sans-serif" }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hourly trend charts */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px", marginBottom: 12 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 14px" }}>Live Metrics — Today&apos;s Canary Window</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Approval Rate", field: "approvalRate" as MetricKey, color: "#7c3aed", min: 85, max: 100 },
            { label: "QA Pass Rate", field: "qaPassRate" as MetricKey, color: "#0891b2", min: 90, max: 100 },
            { label: "Edit Rate", field: "editRate" as MetricKey, color: "#d97706", min: 0, max: 15 },
          ].map((m) => (
            <div key={m.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{m.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>
                  {CANARY_HOURLY[CANARY_HOURLY.length - 1][m.field]}%
                </span>
              </div>
              <MiniLineChart data={CANARY_HOURLY} field={m.field} color={m.color} min={m.min} max={m.max} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                {CANARY_HOURLY.map((d) => (
                  <span key={d.hour} style={{ fontSize: 8, color: "#d1d5db" }}>{d.hour.slice(0, 2)}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt version history */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Prompt Version History</h2>
        </div>
        {PROMPT_HISTORY.map((v, i) => {
          const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
            canary: { bg: "#faf5ff", color: "#7c3aed", label: "CANARY" },
            stable: { bg: "#f0fdf4", color: "#16a34a", label: "STABLE" },
            retired: { bg: "#f3f4f6", color: "#6b7280", label: "RETIRED" },
          };
          const statusConfig = STATUS_MAP[v.status] ?? STATUS_MAP.retired;
          const expanded = expandedVersion === v.version;
          return (
            <div key={v.version} style={{ borderBottom: i < PROMPT_HISTORY.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div
                onClick={() => setExpandedVersion(expanded ? null : v.version)}
                style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: statusConfig.bg, color: statusConfig.color, flexShrink: 0, marginTop: 1 }}>
                  {statusConfig.label}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{v.version}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{v.deployed}</span>
                    <span style={{ fontSize: 10, color: "#6b7280", background: "#f3f4f6", padding: "1px 5px", borderRadius: 3 }}>{v.author}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{v.description}</p>
                </div>
                <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
                  {[
                    { label: "Approval", value: `${v.approvalRate}%` },
                    { label: "QA Pass", value: `${v.qaPassRate}%` },
                    { label: "Edit", value: `${v.editRate}%` },
                    { label: "Messages", value: v.messages.toLocaleString() },
                  ].map((m) => (
                    <div key={m.label} style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{m.value}</div>
                      <div style={{ fontSize: 9, color: "#9ca3af" }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{expanded ? "▲" : "▼"}</span>
              </div>
              {expanded && (
                <div style={{ padding: "0 16px 14px 16px", borderTop: "1px solid #f9fafb" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginBottom: 6 }}>CHANGES IN THIS VERSION</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {v.changes.map((c, ci) => (
                      <li key={ci} style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>{c}</li>
                    ))}
                  </ul>
                  {v.status === "retired" && (
                    <button style={{ marginTop: 8, fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", cursor: "pointer" }}>
                      Restore this version
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rollback modal */}
      {rollbackModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px", maxWidth: 400, width: "90%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Rollback to v2.0?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
              This will immediately revert all 37 clients from <strong>v2.1 canary</strong> to <strong>v2.0 stable</strong>. Any pending messages will use the v2.0 prompt.
            </p>
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 7, padding: "10px 12px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>⚠ This action is irreversible for this canary window</div>
              <div style={{ fontSize: 11, color: "#dc2626" }}>You can re-deploy v2.1 from prompt settings after rollback.</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setRollbackModal(false)} style={{ flex: 1, fontSize: 12, padding: "8px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#374151" }}>
                Cancel
              </button>
              <button onClick={() => setRollbackModal(false)} style={{ flex: 1, fontSize: 12, padding: "8px", borderRadius: 6, border: "none", background: "#dc2626", cursor: "pointer", color: "#fff", fontWeight: 600 }}>
                Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote modal */}
      {promoteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px", maxWidth: 400, width: "90%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Promote v2.1 to All Clients?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
              v2.1 has completed the 24h canary window with strong metrics. Promote to all 37 clients?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPromoteModal(false)} style={{ flex: 1, fontSize: 12, padding: "8px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#374151" }}>
                Cancel
              </button>
              <button onClick={() => setPromoteModal(false)} style={{ flex: 1, fontSize: 12, padding: "8px", borderRadius: 6, border: "none", background: "#22c55e", cursor: "pointer", color: "#fff", fontWeight: 600 }}>
                Promote to Stable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
