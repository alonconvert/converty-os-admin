"use client";

import { useState, useEffect } from "react";
import {
  systemStats,
  mockConversations,
  mockSystemLogs,
  mockClients,
  overnightSummary,
  autoApprovalQueue,
} from "@/lib/mock-data";
import {
  fetchClients,
  fetchDashboardStats,
  fetchRecentLeads,
  fetchPendingConversations,
  type DbClient,
  type DashboardStats,
} from "@/lib/db";
import ApprovalQueue from "@/components/ApprovalQueue";
import MorningBriefing from "@/components/MorningBriefing";

// ── Shared card style ───────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--card-border)",
  borderRadius: 8,
  boxShadow: "var(--card-shadow)",
  overflow: "hidden",
};

export default function Dashboard() {
  const [activityOpen, setActivityOpen] = useState(false);

  // ── Live data from Supabase ──────────────────────────────────────────────
  const [liveClients, setLiveClients] = useState<DbClient[] | null>(null);
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchClients(),
      fetchDashboardStats(),
      fetchRecentLeads(5),
      fetchPendingConversations(20),
    ]).then(([clients, stats]) => {
      setLiveClients(clients);
      setLiveStats(stats);
      setLiveLoading(false);
    });
  }, []);

  // Use live data when available, fall back to mock
  const leadsToday = liveStats?.leadsToday ?? systemStats.leadsToday;

  // ── Split conversations into crisis vs routine ───────────────────────────
  const allPending = mockConversations.filter(
    (c) => c.status === "pending_approval" || c.status === "needs_human" || c.status === "auto_queued"
  );
  const crisisConvs = allPending.filter(
    (c) => c.tier === "T4" || c.tier === "T3" || c.status === "needs_human"
  );
  const routineConvs = allPending.filter(
    (c) => c.tier !== "T4" && c.tier !== "T3" && c.status !== "needs_human"
  );

  // ── At-risk clients ──────────────────────────────────────────────────────
  const atRiskClients = mockClients.filter(
    (c) => c.churnTier === "orange" || c.churnTier === "red"
  );

  // ── Auto-send count ──────────────────────────────────────────────────────
  const autoSendItems = allPending.filter(
    (c) => c.status === "auto_queued" && c.autoSendMinutes !== null
  );

  return (
    <>
      <MorningBriefing />

      <div style={{ padding: "24px 16px", maxWidth: 900 }}>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1: Morning Briefing Bar
            Compact strip — what happened overnight + today's pulse
            ═══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--card-border)",
            borderRadius: 10,
            padding: "14px 20px",
            marginBottom: 16,
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* Top line: date + key stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                לוח בקרה
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: liveLoading ? "var(--text-muted)" : "#10B981", fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: liveLoading ? "#D1D5DB" : "#22C55E", display: "inline-block" }} className={liveLoading ? "" : "pill-pulse"} />
                {liveLoading ? "מתחבר..." : "נתונים חיים"}
              </div>
            </div>

            {/* Key metrics inline */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <Stat label="לידים היום" value={leadsToday} color="#7C3AED" />
              <Stat label="ממתינים לאישור" value={allPending.length} color="#EF4444" urgent={allPending.length > 0} />
              <Stat label="CPL" value={`₪${systemStats.monthlyCpl}`} color={systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#10B981" : "#F59E0B"} />
              <Stat label="הוצאה" value={`₪${(systemStats.monthlySpend / 1000).toFixed(0)}K`} color="var(--text-secondary)" />
            </div>
          </div>

          {/* Night summary line */}
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>לילה:</span>{" "}
              {overnightSummary.leadsReceived} לידים חדשים · {overnightSummary.messagesAutoApproved} אושרו אוטומטית · {overnightSummary.trustChanges} שינויי אמון
            </div>

            {/* Auto-send warning */}
            {autoSendItems.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: "#92400E",
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} className="pill-pulse" />
                {autoSendItems.length} הודעות נשלחות בקרוב
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2: Needs You Now (crises only)
            Shows only when there are T4/T3/human-takeover items
            ═══════════════════════════════════════════════════════════════════ */}
        {crisisConvs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <ApprovalQueue
              conversations={crisisConvs}
              title="דורש טיפול עכשיו"
              variant="crisis"
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 3: Quick Approvals (routine T1/T2 items)
            Scannable list with batch approve
            ═══════════════════════════════════════════════════════════════════ */}
        {routineConvs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <ApprovalQueue
              conversations={routineConvs}
              title="אישורים מהירים"
              variant="routine"
              showBatchApprove
            />
          </div>
        )}

        {/* Empty state when no approvals */}
        {allPending.length === 0 && (
          <div
            style={{
              ...CARD,
              padding: "32px 20px",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              הכל מטופל — התור ריק
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              כל ההודעות אושרו או נשלחו אוטומטית
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 4: At-Risk Clients (actionable)
            Each row links to client profile
            ═══════════════════════════════════════════════════════════════════ */}
        {atRiskClients.length > 0 && (
          <div
            style={{
              ...CARD,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(234,88,12,0.15)",
                background: "#FFF7ED",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#9A3412" }}>
                  לקוחות בסיכון
                </span>
                <span
                  style={{
                    background: "#EA580C",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 99,
                  }}
                >
                  {atRiskClients.length}
                </span>
              </div>
            </div>

            {atRiskClients.map((c, i) => {
              const isRed = c.churnTier === "red";
              const tierColor = isRed ? "#BE123C" : "#EA580C";
              const tierBg = isRed ? "#FFF1F2" : "#FFF7ED";
              const actionLabel = isRed ? "התקשר עכשיו" : "בדוק היום";

              return (
                <div
                  key={c.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: i < atRiskClients.length - 1 ? "1px solid #F3F4F6" : "none",
                    borderLeft: `3px solid ${tierColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: tierColor,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                        className={isRed ? "pill-pulse" : ""}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {c.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 7px",
                          borderRadius: 20,
                          background: tierBg,
                          color: tierColor,
                          fontWeight: 700,
                        }}
                      >
                        {c.churnTier}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>
                      Trust: <span style={{ fontWeight: 700, color: tierColor }}>{c.trustScore}</span>
                      {" · "}
                      Health: <span style={{ fontWeight: 700, color: tierColor }}>{c.healthScore}</span>
                      {c.renewalDays < 30 && (
                        <>
                          {" · "}
                          <span style={{ color: "#D97706", fontWeight: 600 }}>חידוש בעוד {c.renewalDays} ימים</span>
                        </>
                      )}
                    </div>
                  </div>

                  <a
                    href="/clients"
                    style={{
                      fontSize: 11,
                      padding: "5px 14px",
                      background: isRed ? "#FEF2F2" : "#FFF7ED",
                      color: tierColor,
                      border: `1px solid ${isRed ? "#FECACA" : "#FED7AA"}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {actionLabel} →
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 5: Activity Feed (collapsed by default)
            Agent log — expandable for debugging / confidence
            ═══════════════════════════════════════════════════════════════════ */}
        <div style={CARD}>
          <button
            onClick={() => setActivityOpen((v) => !v)}
            style={{
              width: "100%",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderBottom: activityOpen ? "1px solid #F3F4F6" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                יומן פעילות
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {activityOpen ? "▲" : "▼"}
              </span>
            </div>
            <span dir="ltr" style={{ fontSize: 12, color: "#7C3AED", fontWeight: 600 }}>
              ₪{systemStats.aiSpendToday.toFixed(2)} AI היום
            </span>
          </button>

          {activityOpen && (
            <div>
              {mockSystemLogs.slice(0, 8).map((log, i) => {
                const typeColor: Record<string, { bg: string; color: string }> = {
                  alert: { bg: "#FEF2F2", color: "#DC2626" },
                  ai: { bg: "#F5F3FF", color: "#7C3AED" },
                  lead: { bg: "#ECFDF5", color: "#059669" },
                  campaign: { bg: "#EFF6FF", color: "#2563EB" },
                  system: { bg: "#F3F4F6", color: "#6B7280" },
                };
                const tc = typeColor[log.type] ?? typeColor.system;
                return (
                  <div
                    key={log.id}
                    style={{
                      padding: "8px 16px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      borderBottom: i < 7 ? "1px solid #F9FAFB" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 7px",
                        borderRadius: 20,
                        fontWeight: 700,
                        background: tc.bg,
                        color: tc.color,
                        flexShrink: 0,
                        textTransform: "uppercase",
                        marginTop: 1,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {log.type}
                    </span>
                    <p style={{ fontSize: 11, color: "#374151", flex: 1, margin: 0, lineHeight: 1.4 }}>{log.message}</p>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                      <span dir="ltr" style={{ fontSize: 10, color: "var(--text-muted)" }}>{log.time}</span>
                      {log.cost && <span dir="ltr" style={{ fontSize: 10, color: "#7C3AED" }}>{log.cost}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Inline stat pill for briefing bar ───────────────────────────────────────
function Stat({ label, value, color, urgent }: { label: string; value: string | number; color: string; urgent?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
      <span
        className={urgent ? "pill-pulse" : "num-display"}
        style={{ fontSize: 14, fontWeight: 800, color }}
      >
        {value}
      </span>
    </div>
  );
}
