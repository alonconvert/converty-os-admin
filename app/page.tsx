"use client";

import { useState, useRef, useEffect } from "react";
import {
  systemStats,
  mockConversations,
  mockLeads,
  mockSystemLogs,
  mockClients,
  agencyHealthScore,
  canaryDeployment,
  overnightSummary,
  autoApprovalQueue,
} from "@/lib/mock-data";
import ApprovalQueue from "@/components/ApprovalQueue";
import MorningBriefing from "@/components/MorningBriefing";

// ── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#9B51E0", height = 28 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Portfolio heat map ───────────────────────────────────────────────────────
function PortfolioHeatMap() {
  const activeClients = mockClients;
  const total = systemStats.totalClients;
  const allDots = Array.from({ length: total }, (_, i) => {
    const real = activeClients[i];
    if (real) return { score: real.trustScore, budget: real.monthlyBudget, name: real.name, id: real.id, real: true };
    const score = 40 + Math.floor(((i * 17) % 60));
    return { score, budget: 3000 + ((i * 2300) % 18000), name: `Client ${i + 1}`, id: null, real: false };
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
      {allDots.map((dot, i) => {
        const size = Math.max(9, Math.min(19, 9 + Math.round((dot.budget / 22000) * 10)));
        const color = dot.score >= 75 ? "#10B981" : dot.score >= 40 ? "#F59E0B" : "#EF4444";
        return (
          <a
            key={i}
            href={dot.real ? `/clients` : undefined}
            title={`${dot.name} — Trust: ${dot.score}`}
            style={{
              display: "inline-block",
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: 0.7,
              cursor: dot.real ? "pointer" : "default",
              transition: "opacity 0.12s, transform 0.12s",
              textDecoration: "none",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7";
              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
            }}
          />
        );
      })}
    </div>
  );
}

function churnCount(tier: string) {
  return mockClients.filter((c) => c.churnTier === tier).length;
}

const atRiskClients = mockClients.filter(
  (c) => c.churnTier === "orange" || c.churnTier === "red"
);

const overnightItemHighlights: Record<string, string[]> = {
  "Trust changes": overnightSummary.highlights.filter((h) => h.toLowerCase().includes("trust")),
  "Campaign acts": overnightSummary.highlights.filter((h) =>
    h.toLowerCase().includes("campaign") || h.toLowerCase().includes("lead batch") ||
    h.toLowerCase().includes("meta") || h.toLowerCase().includes("google")
  ),
  "Leads arrived": overnightSummary.highlights.filter((h) => h.toLowerCase().includes("lead")),
  "Auto-approved": overnightSummary.highlights.filter((h) =>
    h.toLowerCase().includes("auto-approved") || h.toLowerCase().includes("messages")
  ),
};

// ── Shared card style ────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
  overflow: "hidden",
};

const CARD_HEADER: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid var(--card-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export default function Dashboard() {
  const [atRiskOpen, setAtRiskOpen] = useState(false);
  const [expandedOvernightItem, setExpandedOvernightItem] = useState<string | null>(null);
  const [canaryOpen, setCanaryOpen] = useState(false);
  const canaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (canaryRef.current && !canaryRef.current.contains(e.target as Node)) {
        setCanaryOpen(false);
      }
    }
    if (canaryOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [canaryOpen]);

  const pendingConvs = mockConversations.filter(
    (c) => c.status === "pending_approval" || c.status === "needs_human" || c.status === "auto_queued"
  );

  const totalSlots = systemStats.supervisedCap;
  const filledSlots = systemStats.supervisedClients;
  const slotColor =
    filledSlots <= 7 ? "#10B981" : filledSlots <= 9 ? "#F59E0B" : "#EF4444";

  const oldestMinutes = 252;
  const oldestDisplay = "4h 12m";
  const oldestUrgent = oldestMinutes > 240;

  const kpis = [
    {
      label: "Active Clients",
      value: systemStats.activeClients,
      sub: `of ${systemStats.totalClients} · target ${systemStats.clientCapacity}`,
      color: "#9B51E0",
      accent: "#9B51E0",
      sparkData: [32, 33, 33, 34, 34, 35, 35],
    },
    {
      label: "Leads Today",
      value: systemStats.leadsToday,
      sub: "+12% vs yesterday",
      color: "#10B981",
      accent: "#10B981",
      sparkData: [48, 55, 51, 60, 58, 62, 68],
    },
    {
      label: "Pending Queue",
      value: systemStats.pendingApprovals,
      sub: `oldest: ${oldestDisplay}`,
      subColor: oldestUrgent ? "#F59E0B" : undefined,
      color: "#EF4444",
      accent: "#EF4444",
      urgent: true,
      sparkData: null,
      extraBoxShadow: oldestUrgent,
    },
    {
      label: "Auto-Approved",
      value: systemStats.autoApprovedToday,
      sub: "today without you",
      color: "#10B981",
      accent: "#10B981",
      sparkData: [8, 10, 12, 9, 11, 13, 14],
    },
    {
      label: "Monthly Spend",
      value: `₪${(systemStats.monthlySpend / 1000).toFixed(0)}K`,
      sub: `CPL ₪${systemStats.monthlyCpl} / ₪${systemStats.monthlyCplTarget}`,
      color: systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#10B981" : "#F59E0B",
      accent: systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#10B981" : "#F59E0B",
      sparkData: null,
      ltr: true,
    },
    {
      label: "At-Risk Clients",
      value: mockClients.filter((c) => c.churnTier === "orange" || c.churnTier === "red").length,
      sub: `${churnCount("red")} red · ${churnCount("orange")} orange`,
      color: "#EA580C",
      accent: "#EA580C",
      urgent: mockClients.some((c) => c.churnTier === "red"),
      sparkData: null,
      clickable: true,
    },
    {
      label: "Supervised Slots",
      value: `${systemStats.supervisedClients}/${systemStats.supervisedCap}`,
      sub: `${systemStats.supervisedCap - systemStats.supervisedClients} slots free`,
      color: systemStats.supervisedClients >= 10 ? "#EF4444" : "#F59E0B",
      accent: systemStats.supervisedClients >= 10 ? "#EF4444" : "#F59E0B",
      sparkData: null,
      ltr: true,
      gauge: true,
    },
    {
      label: "Agency Health",
      value: agencyHealthScore,
      sub: agencyHealthScore >= 70 ? "Healthy" : agencyHealthScore >= 50 ? "Watch" : "Action needed",
      color: agencyHealthScore >= 70 ? "#10B981" : agencyHealthScore >= 50 ? "#F59E0B" : "#EF4444",
      accent: agencyHealthScore >= 70 ? "#10B981" : agencyHealthScore >= 50 ? "#F59E0B" : "#EF4444",
      sparkData: null,
    },
  ];

  const portfolioTrends = [
    { label: "Autonomous", count: mockClients.filter((c) => c.level === "Autonomous").length, color: "#10B981", bg: "#ECFDF5", trendVal: 2, trendDir: "up" as const },
    { label: "Semi-Auto", count: mockClients.filter((c) => c.level === "SemiAuto").length, color: "#F59E0B", bg: "#FFFBEB", trendVal: 0, trendDir: "neutral" as const },
    { label: "Supervised", count: mockClients.filter((c) => c.level === "Supervised").length, color: "#EF4444", bg: "#FEF2F2", trendVal: -1, trendDir: "down" as const },
  ];

  return (
    <>
      <MorningBriefing />

      {/* ── Hero band ──────────────────────────────────────────────────────── */}
      <div style={{ background: "var(--gradient)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 24px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Hero stats */}
            <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
              {[
                { label: "Pending Queue", value: systemStats.pendingApprovals, sub: `oldest ${oldestDisplay}`, urgent: systemStats.pendingApprovals > 5 },
                { label: "Leads Today", value: systemStats.leadsToday, sub: "+12% vs yesterday", urgent: false },
                { label: "Agency Health", value: `${agencyHealthScore}%`, sub: agencyHealthScore >= 70 ? "All good" : "Needs attention", urgent: agencyHealthScore < 50 },
              ].map((stat, i) => (
                <div key={stat.label} style={{ paddingRight: i < 2 ? 32 : 0, borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div className="num-display" style={{ fontSize: 48, color: stat.urgent ? "#FEF08A" : "#fff", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Right — date + badges */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <div className="num-display" style={{ fontSize: 22, color: "#fff" }}>Apr 1, 2026</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                  Sync: {systemStats.lastSync}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {autoApprovalQueue.length > 0 && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 20,
                      padding: "5px 12px",
                      fontSize: 12,
                      color: "#FEF08A",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FDE047", display: "inline-block" }} className="pill-pulse" />
                    {autoApprovalQueue.length} auto-send in &lt;{Math.max(...autoApprovalQueue.map((a) => a.minutesRemaining))}min
                  </div>
                )}

                {canaryDeployment.active && (
                  <div ref={canaryRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setCanaryOpen((v) => !v)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 20,
                        padding: "5px 12px",
                        fontSize: 12,
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ⚗ CANARY {canaryDeployment.version}
                    </button>
                    {canaryOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          right: 0,
                          zIndex: 50,
                          background: "#fff",
                          border: "1px solid var(--card-border)",
                          borderRadius: 12,
                          padding: "14px 16px",
                          width: 270,
                          boxShadow: "0 8px 32px rgba(107,33,168,0.18)",
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", marginBottom: 8 }}>⚗ Canary {canaryDeployment.version}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{canaryDeployment.hoursRemaining}h remaining</div>
                        <div style={{ fontSize: 11, color: "#374151", marginBottom: 4, fontWeight: 600 }}>Clients:</div>
                        {canaryDeployment.clients.map((c) => (
                          <div key={c} style={{ fontSize: 11, color: "#6b7280", padding: "1px 0" }}>• {c}</div>
                        ))}
                        <div style={{ borderTop: "1px solid var(--card-border)", marginTop: 8, paddingTop: 8 }}>
                          {[
                            { label: "Approval rate", val: canaryDeployment.approvalRate, base: canaryDeployment.baselineApprovalRate, higherIsBetter: true },
                            { label: "QA pass rate", val: canaryDeployment.qaPassRate, base: canaryDeployment.baselineQaPassRate, higherIsBetter: true },
                            { label: "Edit rate", val: canaryDeployment.editRate, base: canaryDeployment.baselineEditRate, higherIsBetter: false },
                          ].map((m) => {
                            const better = m.higherIsBetter ? m.val >= m.base : m.val <= m.base;
                            return (
                              <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                                <span style={{ color: "#6b7280" }}>{m.label}</span>
                                <span style={{ fontWeight: 700, color: better ? "#059669" : "#dc2626" }}>
                                  {m.val}% <span style={{ color: "#9ca3af", fontWeight: 400 }}>/ {m.base}%</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCanaryOpen(false)}
                          style={{
                            marginTop: 10,
                            width: "100%",
                            fontSize: 11,
                            padding: "6px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Rollback to v2.0
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "20px 24px" }}>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10, marginBottom: 20 }}>
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              onClick={(kpi as { clickable?: boolean }).clickable ? () => setAtRiskOpen((v) => !v) : undefined}
              className={(kpi as { extraBoxShadow?: boolean }).extraBoxShadow ? "stale-queue-pulse" : ""}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "14px 14px 12px",
                border: `1px solid ${kpi.urgent ? "rgba(239,68,68,0.3)" : "var(--card-border)"}`,
                boxShadow: kpi.urgent ? "0 0 0 3px rgba(239,68,68,0.06)" : "var(--card-shadow)",
                cursor: (kpi as { clickable?: boolean }).clickable ? "pointer" : "default",
                borderTop: `3px solid ${kpi.accent}`,
                transition: "box-shadow 0.15s, transform 0.1s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--card-shadow-hover)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = kpi.urgent ? "0 0 0 3px rgba(239,68,68,0.06)" : "var(--card-shadow)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div
                className="num-display"
                dir={(kpi as { ltr?: boolean }).ltr ? "ltr" : "auto"}
                style={{ fontSize: 26, color: kpi.color, lineHeight: 1 }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginTop: 5 }}>{kpi.label}</div>
              <div style={{ fontSize: 10, color: (kpi as { subColor?: string }).subColor ?? "var(--text-muted)", marginTop: 2, lineHeight: 1.3 }}>
                {kpi.sub}
              </div>
              {(kpi as { gauge?: boolean }).gauge && (
                <div style={{ display: "flex", gap: 2, marginTop: 7, flexWrap: "wrap" }}>
                  {Array.from({ length: totalSlots }, (_, i) => (
                    <div key={i} style={{ width: 10, height: 5, borderRadius: 3, background: i < filledSlots ? slotColor : "#EDE9FE" }} />
                  ))}
                </div>
              )}
              {kpi.sparkData && (
                <div style={{ marginTop: 8 }}>
                  <Sparkline data={kpi.sparkData} color={kpi.accent} height={22} />
                </div>
              )}
              {(kpi as { clickable?: boolean }).clickable && (
                <div style={{ fontSize: 10, color: "#F59E0B", marginTop: 3, fontWeight: 600 }}>
                  {atRiskOpen ? "▲ collapse" : "▼ expand"}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* At-Risk panel */}
        {atRiskOpen && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid rgba(234,88,12,0.25)",
              marginBottom: 16,
              overflow: "hidden",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(234,88,12,0.15)",
                background: "#FFF7ED",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#9A3412" }}>
                At-Risk Clients ({atRiskClients.length})
              </span>
              <button onClick={() => setAtRiskOpen(false)} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 0 }}>
              {atRiskClients.map((c, i) => {
                const tierColor = c.churnTier === "red" ? "#BE123C" : "#EA580C";
                const tierBg = c.churnTier === "red" ? "#FFF1F2" : "#FFF7ED";
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "12px 16px",
                      borderRight: i % 2 === 0 ? "1px solid var(--card-border)" : "none",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: tierBg, color: tierColor, fontWeight: 700, textTransform: "uppercase" }}>
                        {c.churnTier}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                      Health: <span style={{ fontWeight: 700, color: tierColor }}>{c.healthScore}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#9B51E0", fontWeight: 600, cursor: "pointer" }}>View →</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main 2-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Approval queue */}
            <ApprovalQueue conversations={pendingConvs} />

            {/* Overnight Summary */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Overnight Summary</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>While you were offline</span>
              </div>
              <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
                {[
                  { label: "Leads arrived", value: overnightSummary.leadsReceived, color: "#10B981" },
                  { label: "Auto-approved", value: overnightSummary.messagesAutoApproved, color: "#9B51E0" },
                  { label: "Trust changes", value: overnightSummary.trustChanges, color: "#F59E0B" },
                  { label: "Campaign acts", value: overnightSummary.campaignChanges, color: "#0693E3" },
                ].map((s, i) => {
                  const isExpanded = expandedOvernightItem === s.label;
                  return (
                    <div
                      key={s.label}
                      onClick={() => setExpandedOvernightItem(isExpanded ? null : s.label)}
                      style={{
                        textAlign: "center",
                        cursor: "pointer",
                        padding: "8px 4px",
                        borderRight: i < 3 ? "1px solid var(--card-border)" : "none",
                        borderRadius: 8,
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "var(--brand-bg-soft)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                    >
                      <div className="num-display" style={{ fontSize: 32, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: 9, color: s.color, marginTop: 2, fontWeight: 700 }}>{isExpanded ? "▲" : "▼"}</div>
                    </div>
                  );
                })}
              </div>
              {expandedOvernightItem && (() => {
                const highlights = overnightItemHighlights[expandedOvernightItem] ?? overnightSummary.highlights;
                const displayHighlights = highlights.length > 0 ? highlights : overnightSummary.highlights;
                return (
                  <div style={{ margin: "0 16px 14px", background: "var(--brand-bg-soft)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--card-border)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {expandedOvernightItem} — Detail
                    </div>
                    {displayHighlights.map((h, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#374151", padding: "3px 0", display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ color: "#9B51E0", flexShrink: 0 }}>›</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {overnightSummary.highlights.length > 0 && (
                <div style={{ padding: "0 16px 14px" }}>
                  {overnightSummary.highlights.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        padding: "4px 0",
                        borderTop: i === 0 ? "1px solid var(--card-border)" : "none",
                        display: "flex",
                        gap: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: "#D8CFF0", flexShrink: 0 }}>›</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Portfolio heat map */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  Portfolio{" "}
                  <span style={{ color: "var(--brand)" }}>{systemStats.totalClients}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}> / {systemStats.clientCapacity} target</span>
                </span>
                <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
                  {[
                    { color: "#10B981", label: "Auto" },
                    { color: "#F59E0B", label: "Semi" },
                    { color: "#EF4444", label: "Super" },
                  ].map((l) => (
                    <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--text-muted)", fontWeight: 500 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <PortfolioHeatMap />
              </div>
              <div style={{ display: "flex", borderTop: "1px solid var(--card-border)" }}>
                {portfolioTrends.map((s, i) => (
                  <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRight: i < 2 ? "1px solid var(--card-border)" : "none" }}>
                    <div className="num-display" style={{ fontSize: 24, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 10, color: s.color, marginTop: 2, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 9, marginTop: 2, fontWeight: 700, color: s.trendDir === "up" ? "#10B981" : s.trendDir === "down" ? "#EF4444" : "#9B8CB5" }}>
                      {s.trendDir === "up" ? `+${s.trendVal} ↑` : s.trendDir === "down" ? `${s.trendVal} ↓` : "→"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Churn Risk */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Churn Risk</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {[
                  { tier: "green", label: "Green", color: "#059669", bg: "#ECFDF5", count: churnCount("green"), desc: "Normal" },
                  { tier: "yellow", label: "Yellow", color: "#CA8A04", bg: "#FEFCE8", count: churnCount("yellow"), desc: "Watch" },
                  { tier: "orange", label: "Orange", color: "#EA580C", bg: "#FFF7ED", count: churnCount("orange"), desc: "Alert 48h" },
                  { tier: "red", label: "Red", color: "#BE123C", bg: "#FFF1F2", count: churnCount("red"), desc: "Call now" },
                ].map((t, i) => (
                  <div
                    key={t.tier}
                    style={{
                      padding: "12px",
                      borderRight: i % 2 === 0 ? "1px solid var(--card-border)" : "none",
                      borderBottom: i < 2 ? "1px solid var(--card-border)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.label}</span>
                    </div>
                    <div className="num-display" style={{ fontSize: 26, color: t.color, marginTop: 3 }}>{t.count}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Leads */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Recent Leads</span>
              </div>
              {mockLeads.slice(0, 4).map((lead, i) => (
                <div
                  key={lead.id}
                  style={{
                    padding: "9px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: i < 3 ? "1px solid var(--card-border)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{lead.clientName}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: lead.source === "google" ? "#EFF6FF" : lead.source === "facebook" ? "#F5F3FF" : "#F0FDF4",
                        color: lead.source === "google" ? "#2563EB" : lead.source === "facebook" ? "#7C3AED" : "#16A34A",
                        fontWeight: 700,
                      }}
                    >
                      {lead.source}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: lead.status === "new" ? "#FEF9C3" : lead.status === "contacted" ? "#DCFCE7" : "#F3F4F6",
                        color: lead.status === "new" ? "#854D0E" : lead.status === "contacted" ? "#166534" : "#6B7280",
                        fontWeight: 700,
                      }}
                    >
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Log */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Agent Log</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>₪{systemStats.aiSpendToday.toFixed(2)} today</span>
              </div>
              {mockSystemLogs.slice(0, 6).map((log, i) => {
                const typeColor: Record<string, { bg: string; color: string }> = {
                  alert: { bg: "#FEF2F2", color: "#DC2626" },
                  ai: { bg: "#F5F3FF", color: "#7C3AED" },
                  lead: { bg: "#F0FDF4", color: "#16A34A" },
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
                      borderBottom: i < 5 ? "1px solid var(--card-border)" : "none",
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
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{log.time}</span>
                      {log.cost && <span style={{ fontSize: 10, color: "#7C3AED" }}>{log.cost}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
