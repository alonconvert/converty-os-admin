"use client";

import { useState, useMemo } from "react";
import { mockSystemLogs, systemStats, canaryDeployment } from "@/lib/mock-data";
import Link from "next/link";

const serviceImpacts: Record<string, string> = {
  "Railway Backend": "Core infrastructure",
  "Supabase DB": "All data storage",
  "Green API (WhatsApp)": "Client messaging",
  "Claude API": "All AI agents",
  "Telegram Bot": "Operator alerts",
  "Google Ads API": "Campaign data",
  "Meta Marketing API": "Facebook campaigns",
  "Voicenter": "Call routing",
};

const statusOrder: Record<string, number> = {
  offline: 0,
  unconfigured: 1,
  degraded: 2,
  healthy: 3,
  parked: 4,
};

const rawServices = [
  { name: "Railway Backend", status: "healthy", latency: "42ms", uptime: systemStats.uptime },
  { name: "Supabase DB", status: "healthy", latency: "18ms", uptime: "99.9%" },
  { name: "Green API (WhatsApp)", status: "healthy", latency: "120ms", uptime: "98.1%" },
  { name: "Claude API", status: "healthy", latency: "890ms", uptime: "99.7%" },
  { name: "Telegram Bot", status: "healthy", latency: "55ms", uptime: "100%" },
  { name: "Google Ads API", status: "healthy", latency: "340ms", uptime: "99.5%" },
  { name: "Meta Marketing API", status: "healthy", latency: "280ms", uptime: "99.3%" },
  { name: "Voicenter", status: "parked", latency: "—", uptime: "Phase 2" },
];

const services = [...rawServices].sort(
  (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
);

const criticalServices = services.filter(
  (s) => s.status === "offline" || s.status === "unconfigured" || s.status === "degraded"
);

const loopActions = [
  {
    id: "la1",
    icon: "▲",
    msg: 'מרפאת שיניים לוי — ציפויים ואסתטיקה: Target CPA increase queued for operator approval',
    color: "#d97706",
    pending: true,
  },
  {
    id: "la2",
    icon: "✓",
    msg: 'גרינברג נדל"ן — דירות מרכז: Bid -8% on mobile (autonomous, executed)',
    color: "#059669",
    pending: false,
  },
  {
    id: "la3",
    icon: "✓",
    msg: 'ד"ר מירי אופיר — ייעוץ גינקולוגי: Added 6 negative keywords (autonomous, executed)',
    color: "#059669",
    pending: false,
  },
];

const LOG_CLIENTS = ["All Clients", 'גרינברג נדל"ן', "ביטוח ישיר פלוס", "מרפאת שיניים לוי"];
const LOG_TYPES = ["All Types", "AI", "Lead", "Campaign", "Alert", "System"];

export default function System() {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [killConfirmOpen, setKillConfirmOpen] = useState(false);
  const [killInput, setKillInput] = useState("");
  const [killReason, setKillReason] = useState("Testing");
  const [systemStopped, setSystemStopped] = useState(false);
  const [canaryToast, setCanaryToast] = useState<string | null>(null);
  const [approvedLoopActions, setApprovedLoopActions] = useState<string[]>([]);
  const [rejectedLoopActions, setRejectedLoopActions] = useState<string[]>([]);
  const [logClientFilter, setLogClientFilter] = useState("All Clients");
  const [logTypeFilter, setLogTypeFilter] = useState("All Types");
  const [logSearch, setLogSearch] = useState("");
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  function handleKillConfirm() {
    setKillConfirmOpen(false);
    setKillInput("");
    setSystemStopped(true);
  }

  function handleCanaryAction(action: "promote" | "rollback") {
    setCanaryToast(
      action === "promote"
        ? "v2.1 promoted to all clients"
        : "Rolled back to v2.0"
    );
    setTimeout(() => setCanaryToast(null), 3000);
  }

  // Canary Go/No-Go logic
  const canaryMetrics = [
    {
      label: "Approval rate",
      val: canaryDeployment.approvalRate,
      base: canaryDeployment.baselineApprovalRate,
      higherIsBetter: true,
    },
    {
      label: "QA pass rate",
      val: canaryDeployment.qaPassRate,
      base: canaryDeployment.baselineQaPassRate,
      higherIsBetter: true,
    },
    {
      label: "Edit rate",
      val: canaryDeployment.editRate,
      base: canaryDeployment.baselineEditRate,
      higherIsBetter: false,
    },
  ];

  const degradedMetrics = canaryMetrics.filter((m) => {
    const pctDiff = Math.abs(m.val - m.base) / m.base;
    const worse = m.higherIsBetter ? m.val < m.base : m.val > m.base;
    return worse && pctDiff > 0.1;
  });
  const canaryGo = degradedMetrics.length === 0;

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return mockSystemLogs.filter((log) => {
      if (logTypeFilter !== "All Types") {
        const typeMap: Record<string, string> = {
          AI: "ai",
          Lead: "lead",
          Campaign: "campaign",
          Alert: "alert",
          System: "system",
        };
        if (log.type !== typeMap[logTypeFilter]) return false;
      }
      if (logClientFilter !== "All Clients") {
        if (!log.message.includes(logClientFilter)) return false;
      }
      if (logSearch.trim()) {
        if (!log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
      }
      return true;
    });
  }, [logClientFilter, logTypeFilter, logSearch]);

  return (
    <div style={{ padding: "18px 16px", maxWidth: 1440 }}>

      {/* Critical services banner */}
      {criticalServices.length > 0 && !bannerDismissed && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
            ⚠ Critical Services Down:{" "}
            {criticalServices.map((s) => s.name).join(", ")} —{" "}
            {criticalServices.map((s) => serviceImpacts[s.name]).join("; ")} disabled for all clients.
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            style={{
              background: "none",
              border: "none",
              color: "#dc2626",
              fontSize: 14,
              cursor: "pointer",
              fontWeight: 700,
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>System</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Infrastructure, kill switch, logs, prompt versions</p>
        </div>
        <Link
          href="/system/prompts"
          style={{
            fontSize: 12, padding: "6px 12px", borderRadius: 6, background: "#f5f3ff", color: "#7c3aed",
            border: "1px solid #e9d5ff", textDecoration: "none", fontWeight: 600,
          }}
        >
          ⚗ Canary Dashboard →
        </Link>
      </div>

      <div className="responsive-grid-2-sidebar" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
        {/* Kill Switch */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 18px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 14px" }}>Global Kill Switch</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: systemStopped ? "#dc2626" : "#22c55e",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  {systemStopped ? "System Stopped" : "System Active"}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2, marginLeft: 15 }}>
                {systemStopped ? "All AI agents halted" : "All AI agents running normally"}
              </p>
            </div>
            <div style={{ width: 48, height: 26, borderRadius: 13, background: systemStopped ? "#dc2626" : "#22c55e", display: "flex", alignItems: "center", padding: 3, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", marginLeft: systemStopped ? 0 : "auto" }} />
            </div>
          </div>
          <button
            onClick={() => setKillConfirmOpen(true)}
            style={{
              width: "100%", fontSize: 12, padding: "8px", background: "#fef2f2", color: "#dc2626",
              border: "1px solid #fca5a5", borderRadius: 7, cursor: "pointer", fontWeight: 600,
            }}
          >
            ⛔ Emergency Stop All AI
          </button>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, textAlign: "center" }}>
            Telegram: /kill or /resume
          </p>

          {/* Canary deployment */}
          {canaryDeployment.active && (
            <div style={{ marginTop: 14, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 6 }}>
                ⚗ Canary {canaryDeployment.version} — {canaryDeployment.hoursRemaining}h remaining
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                {canaryDeployment.clients.length} clients in canary group
              </div>
              {canaryMetrics.map((m) => {
                const better = m.higherIsBetter ? m.val >= m.base : m.val <= m.base;
                return (
                  <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                    <span style={{ color: "#6b7280" }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: better ? "#059669" : "#dc2626" }}>
                      {m.val}% <span style={{ color: "#9ca3af", fontWeight: 400 }}>(baseline {m.base}%)</span>
                    </span>
                  </div>
                );
              })}

              {/* Go/No-Go decision panel */}
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: canaryGo ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${canaryGo ? "#bbf7d0" : "#fca5a5"}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: canaryGo ? "#059669" : "#dc2626", marginBottom: 4 }}>
                  {canaryGo
                    ? "GO: All metrics within threshold. Ready to promote."
                    : `NO-GO: ${degradedMetrics.map((m) => m.label).join(", ")} degraded.`}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button
                    onClick={() => handleCanaryAction("promote")}
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: "5px 4px",
                      background: "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: 5,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Promote v2.1
                  </button>
                  <button
                    onClick={() => handleCanaryAction("rollback")}
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: "5px 4px",
                      background: "#fff",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
                      borderRadius: 5,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Rollback v2.0
                  </button>
                </div>
              </div>
              {canaryToast && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#059669",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 5,
                    padding: "5px 8px",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  ✓ {canaryToast}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service health */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 18px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Service Health</h2>
          <div className="responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {services.map((svc) => (
              <div
                key={svc.name}
                onMouseEnter={() => setHoveredService(svc.name)}
                onMouseLeave={() => setHoveredService(null)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 12px",
                  background: hoveredService === svc.name ? "#F5F3FF" : "#f9fafb",
                  borderRadius: 7,
                  border: `1px solid ${svc.status === "degraded" ? "#fde68a" : svc.status === "unconfigured" ? "#fca5a5" : svc.status === "offline" ? "#f87171" : "transparent"}`,
                  opacity: svc.status === "parked" ? 0.55 : 1,
                  transition: "background 0.15s ease",
                  cursor: "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0, display: "inline-block", marginTop: 3,
                    background:
                      svc.status === "healthy" ? "#22c55e"
                      : svc.status === "degraded" ? "#f59e0b"
                      : svc.status === "offline" ? "#dc2626"
                      : svc.status === "parked" ? "#9ca3af"
                      : "#d1d5db",
                  }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: svc.status === "parked" ? "#9ca3af" : "#374151" }}>{svc.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>
                      {svc.status === "parked" ? "Parked — Phase 2" : serviceImpacts[svc.name]}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{svc.latency}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{svc.uptime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nightly optimization loop */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Nightly Optimization Loop</h2>
          <span style={{ fontSize: 12, padding: "2px 7px", borderRadius: 3, background: "#f0fdf4", color: "#16a34a", fontWeight: 700 }}>✓ COMPLETED</span>
        </div>
        <div className="responsive-grid-4" style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Last Run", value: "03:00 IST", sub: "Apr 1, 2026" },
            { label: "Next Run", value: "03:00 IST", sub: "Apr 2, 2026" },
            { label: "Campaigns Reviewed", value: "21", sub: "of 21 active" },
            { label: "Actions Taken", value: "3", sub: "1 bid · 2 keywords" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#f9fafb", borderRadius: 7, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 14px 12px", borderTop: "1px solid #f9fafb" }}>
          <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 6, marginTop: 8 }}>LAST LOOP ACTIONS</div>
          {loopActions.map((a) => {
            const isApproved = approvedLoopActions.includes(a.id);
            const isRejected = rejectedLoopActions.includes(a.id);
            return (
              <div
                key={a.id}
                style={{
                  fontSize: 12,
                  color: "#374151",
                  padding: "6px 0",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  borderBottom: "1px solid #f9fafb",
                }}
              >
                <span style={{ color: a.color, flexShrink: 0, fontWeight: 700 }}>{a.icon}</span>
                <span style={{ flex: 1 }}>{a.msg}</span>
                {a.pending && !isApproved && !isRejected && (
                  <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 99,
                        background: "#fffbeb",
                        color: "#d97706",
                        fontWeight: 700,
                        border: "1px solid #fde68a",
                      }}
                    >
                      ⏳ Pending
                    </span>
                    <button
                      onClick={() => setApprovedLoopActions((prev) => [...prev, a.id])}
                      style={{
                        fontSize: 12,
                        padding: "3px 8px",
                        background: "#f0fdf4",
                        color: "#059669",
                        border: "1px solid #bbf7d0",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectedLoopActions((prev) => [...prev, a.id])}
                      style={{
                        fontSize: 12,
                        padding: "3px 8px",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fca5a5",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {a.pending && isApproved && (
                  <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓ Approved</span>
                )}
                {a.pending && isRejected && (
                  <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, flexShrink: 0 }}>✕ Rejected</span>
                )}
                {!a.pending && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 99,
                      background: "#f0fdf4",
                      color: "#059669",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓ Executed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust engine */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Trust Engine — All Clients</h2>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>Click a client for full breakdown</span>
        </div>
        <div className="responsive-grid-4" style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { name: 'מרפאת שיניים לוי', score: 82, level: 'Autonomous', health: 78, healthTier: 'green' },
            { name: 'גרינברג נדל"ן', score: 44, level: 'SemiAuto', health: 65, healthTier: 'yellow' },
            { name: 'ד"ר מירי אופיר', score: 78, level: 'Autonomous', health: 82, healthTier: 'green' },
            { name: 'ביטוח ישיר פלוס', score: 25, level: 'Supervised', health: 22, healthTier: 'red' },
            { name: 'עורך דין כהן', score: 61, level: 'SemiAuto', health: 58, healthTier: 'yellow' },
            { name: 'מוסך אביב', score: 30, level: 'Supervised', health: 42, healthTier: 'orange' },
            { name: 'קרן פיטנס', score: 55, level: 'SemiAuto', health: 34, healthTier: 'orange' },
            { name: 'עיצוב פנים שרה', score: 88, level: 'Autonomous', health: 91, healthTier: 'green' },
          ].map((c) => {
            const trustColor = c.score >= 75 ? "#16a34a" : c.score >= 40 ? "#d97706" : "#dc2626";
            const healthColor = c.healthTier === "green" ? "#059669" : c.healthTier === "yellow" ? "#ca8a04" : c.healthTier === "orange" ? "#ea580c" : "#be123c";
            return (
              <div key={c.name} style={{ border: "1px solid #f3f4f6", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{c.name}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Trust</div>
                    <div style={{ height: 3, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginBottom: 2 }}>
                      <div style={{ width: `${c.score}%`, height: "100%", background: trustColor, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: trustColor }}>{c.score}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Health</div>
                    <div style={{ height: 3, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginBottom: 2 }}>
                      <div style={{ width: `${c.health}%`, height: "100%", background: healthColor, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: healthColor }}>{c.health}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent log */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Agent Log</h2>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>Last sync: {systemStats.lastSync}</span>
        </div>

        {/* Filter bar */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <select
            value={logClientFilter}
            onChange={(e) => setLogClientFilter(e.target.value)}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              color: "#374151",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {LOG_CLIENTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={logTypeFilter}
            onChange={(e) => setLogTypeFilter(e.target.value)}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              color: "#374151",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {LOG_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search logs…"
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              color: "#374151",
              background: "#fff",
              flex: 1,
              minWidth: 160,
              outline: "none",
            }}
          />
          {(logClientFilter !== "All Clients" || logTypeFilter !== "All Types" || logSearch) && (
            <button
              onClick={() => { setLogClientFilter("All Clients"); setLogTypeFilter("All Types"); setLogSearch(""); }}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 5,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                color: "#6b7280",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {filteredLogs.length === 0 && (
          <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
            No logs match filters
          </div>
        )}
        {filteredLogs.map((log, i) => {
          const tc: Record<string, { bg: string; color: string }> = {
            alert: { bg: "#fef2f2", color: "#dc2626" },
            ai: { bg: "#f5f3ff", color: "#7c3aed" },
            lead: { bg: "#f0fdf4", color: "#16a34a" },
            campaign: { bg: "#eff6ff", color: "#2563eb" },
            system: { bg: "#f3f4f6", color: "#6b7280" },
          };
          const c = tc[log.type] ?? tc.system;
          return (
            <div key={log.id} style={{ padding: "8px 14px", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < filteredLogs.length - 1 ? "1px solid #f9fafb" : "none" }}>
              <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, fontWeight: 700, background: c.bg, color: c.color, flexShrink: 0, textTransform: "uppercase", marginTop: 1 }}>
                {log.type}
              </span>
              <p style={{ fontSize: 12, color: "#374151", flex: 1, margin: 0 }}>{log.message}</p>
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{log.time}</span>
                {log.cost && <span style={{ fontSize: 12, color: "#7c3aed" }}>{log.cost}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kill switch confirmation modal */}
      {killConfirmOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px 28px",
              width: 380,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>
              ⛔ Emergency Stop
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
              This will immediately halt all AI agents for all clients. Type <strong>STOP</strong> to confirm.
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, display: "block", marginBottom: 4 }}>
                Confirmation
              </label>
              <input
                type="text"
                value={killInput}
                onChange={(e) => setKillInput(e.target.value)}
                placeholder="Type STOP"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, display: "block", marginBottom: 4 }}>
                Reason
              </label>
              <select
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#374151",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              >
                <option>Testing</option>
                <option>Incident</option>
                <option>Operator unavailable</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setKillConfirmOpen(false); setKillInput(""); }}
                style={{
                  flex: 1,
                  fontSize: 12,
                  padding: "8px",
                  background: "#f9fafb",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleKillConfirm}
                disabled={killInput !== "STOP"}
                style={{
                  flex: 1,
                  fontSize: 12,
                  padding: "8px",
                  background: killInput === "STOP" ? "#dc2626" : "#f3f4f6",
                  color: killInput === "STOP" ? "#fff" : "#9ca3af",
                  border: "none",
                  borderRadius: 7,
                  cursor: killInput === "STOP" ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  transition: "background 0.15s",
                }}
              >
                Confirm Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
