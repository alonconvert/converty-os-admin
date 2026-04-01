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
function Sparkline({ data, color = "#FF3A00", height = 28 }: { data: number[]; color?: string; height?: number }) {
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
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
      {allDots.map((dot, i) => {
        const size = Math.max(8, Math.min(18, 8 + Math.round((dot.budget / 22000) * 10)));
        const color =
          dot.score >= 75 ? "#16a34a"
          : dot.score >= 40 ? "#d97706"
          : "#dc2626";
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
              opacity: 0.75,
              cursor: dot.real ? "pointer" : "default",
              transition: "opacity 0.12s, transform 0.12s",
              textDecoration: "none",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.75";
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
  border: "2px solid var(--border)",
  borderRadius: 0,
  overflow: "hidden",
};

const CARD_HEADER: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #E8E5DC",
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
    filledSlots <= 7 ? "#16a34a" : filledSlots <= 9 ? "#d97706" : "#dc2626";

  const oldestMinutes = 252;
  const oldestDisplay = "4h 12m";
  const oldestUrgent = oldestMinutes > 240;

  const kpis = [
    {
      label: "Active Clients",
      value: systemStats.activeClients,
      sub: `of ${systemStats.totalClients} · target ${systemStats.clientCapacity}`,
      color: "#1A1712",
      accent: "#4F46E5",
      trend: "+2 this month",
      trendUp: true,
      sparkData: [32, 33, 33, 34, 34, 35, 35],
    },
    {
      label: "Leads Today",
      value: systemStats.leadsToday,
      sub: "+12% vs yesterday",
      color: "#1A1712",
      accent: "#059669",
      trend: "+12%",
      trendUp: true,
      sparkData: [48, 55, 51, 60, 58, 62, 68],
    },
    {
      label: "Pending Queue",
      value: systemStats.pendingApprovals,
      sub: `oldest: ${oldestDisplay}`,
      subColor: oldestUrgent ? "#d97706" : undefined,
      color: "#dc2626",
      accent: "#dc2626",
      urgent: true,
      trend: null,
      trendUp: null,
      sparkData: null,
      extraBoxShadow: oldestUrgent ? "0 0 0 2px rgba(251,146,60,0.4)" : undefined,
    },
    {
      label: "Auto-Approved",
      value: systemStats.autoApprovedToday,
      sub: "today without you",
      color: "#1A1712",
      accent: "#059669",
      trend: null,
      trendUp: null,
      sparkData: [8, 10, 12, 9, 11, 13, 14],
    },
    {
      label: "Monthly Spend",
      value: `₪${(systemStats.monthlySpend / 1000).toFixed(0)}K`,
      sub: `CPL ₪${systemStats.monthlyCpl} / ₪${systemStats.monthlyCplTarget}`,
      color: systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#059669" : "#d97706",
      accent: systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#059669" : "#d97706",
      trend: null,
      trendUp: null,
      sparkData: null,
      ltr: true,
    },
    {
      label: "At-Risk Clients",
      value: mockClients.filter((c) => c.churnTier === "orange" || c.churnTier === "red").length,
      sub: `${churnCount("red")} red · ${churnCount("orange")} orange`,
      color: "#ea580c",
      accent: "#ea580c",
      urgent: mockClients.some((c) => c.churnTier === "red"),
      trend: null,
      trendUp: null,
      sparkData: null,
      clickable: true,
    },
    {
      label: "Supervised Slots",
      value: `${systemStats.supervisedClients}/${systemStats.supervisedCap}`,
      sub: `${systemStats.supervisedCap - systemStats.supervisedClients} slots free`,
      color: systemStats.supervisedClients >= 10 ? "#dc2626" : "#d97706",
      accent: systemStats.supervisedClients >= 10 ? "#dc2626" : "#d97706",
      trend: null,
      trendUp: null,
      sparkData: null,
      ltr: true,
      gauge: true,
    },
    {
      label: "Agency Health",
      value: agencyHealthScore,
      sub: agencyHealthScore >= 70 ? "Healthy" : agencyHealthScore >= 50 ? "Watch" : "Action needed",
      color: agencyHealthScore >= 70 ? "#059669" : agencyHealthScore >= 50 ? "#d97706" : "#dc2626",
      accent: agencyHealthScore >= 70 ? "#059669" : agencyHealthScore >= 50 ? "#d97706" : "#dc2626",
      trend: null,
      trendUp: null,
      sparkData: null,
    },
  ];

  const portfolioTrends = [
    { label: "Autonomous", count: mockClients.filter((c) => c.level === "Autonomous").length, color: "#16a34a", bg: "#f0fdf4", trendVal: 2, trendDir: "up" as const },
    { label: "Semi-Auto", count: mockClients.filter((c) => c.level === "SemiAuto").length, color: "#d97706", bg: "#fefce8", trendVal: 0, trendDir: "neutral" as const },
    { label: "Supervised", count: mockClients.filter((c) => c.level === "Supervised").length, color: "#dc2626", bg: "#fef2f2", trendVal: -1, trendDir: "down" as const },
  ];

  return (
    <>
      <MorningBriefing />

      {/* ── Command Band ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#1C1A14",
          borderBottom: "2px solid var(--border)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "flex-end",
          gap: 0,
        }}
      >
        {/* Hero stats */}
        {[
          {
            label: "QUEUE",
            value: systemStats.pendingApprovals,
            unit: "PENDING",
            color: systemStats.pendingApprovals > 5 ? "#FF3A00" : "#fff",
            urgent: systemStats.pendingApprovals > 5,
          },
          {
            label: "LEADS",
            value: systemStats.leadsToday,
            unit: "TODAY",
            color: "#fff",
            urgent: false,
          },
          {
            label: "HEALTH",
            value: agencyHealthScore,
            unit: "/ 100",
            color: agencyHealthScore >= 70 ? "#4ADE80" : agencyHealthScore >= 50 ? "#FCD34D" : "#FF3A00",
            urgent: agencyHealthScore < 50,
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: "0 32px",
              borderRight: i < 2 ? "1px solid #2A2520" : "none",
              borderLeft: i > 0 ? "none" : "none",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 9,
                color: "#6B6760",
                letterSpacing: "0.14em",
                marginBottom: 4,
              }}
            >
              {stat.label}
            </div>
            <div
              className="kpi-number"
              style={{
                fontSize: 72,
                color: stat.color,
                lineHeight: 0.9,
              }}
            >
              {stat.value}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "#6B6760",
                letterSpacing: "0.1em",
                marginTop: 4,
              }}
            >
              {stat.unit}
            </div>
          </div>
        ))}

        {/* Right side — date + canary + auto-send */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 10,
            paddingLeft: 32,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              className="kpi-number"
              style={{ fontSize: 28, color: "#fff", letterSpacing: "0.06em" }}
            >
              APR 1
            </div>
            <div
              className="mono"
              style={{ fontSize: 9, color: "#6B6760", letterSpacing: "0.1em" }}
            >
              SYNC: {systemStats.lastSync}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {autoApprovalQueue.length > 0 && (
              <div
                style={{
                  background: "rgba(245,243,234,0.08)",
                  border: "1px solid #F59E0B",
                  padding: "5px 12px",
                  fontSize: 11,
                  color: "#FCD34D",
                  fontFamily: "'Courier Prime', monospace",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  letterSpacing: "0.04em",
                }}
              >
                <span
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }}
                  className="pill-pulse"
                />
                {autoApprovalQueue.length} AUTO-SEND &lt;{Math.max(...autoApprovalQueue.map((a) => a.minutesRemaining))}MIN
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
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid #7c3aed",
                    padding: "5px 10px",
                    fontSize: 11,
                    color: "#C4B5FD",
                    fontFamily: "'Courier Prime', monospace",
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                  }}
                >
                  ⚗ CANARY {canaryDeployment.version}
                </button>
                {canaryOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      zIndex: 50,
                      background: "#fff",
                      border: "2px solid var(--border)",
                      borderRadius: 0,
                      padding: "14px 16px",
                      width: 260,
                      boxShadow: "4px 4px 0 #2A2520",
                    }}
                  >
                    <div
                      className="section-label"
                      style={{ color: "#7c3aed", marginBottom: 8 }}
                    >
                      ⚗ Canary {canaryDeployment.version}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                      {canaryDeployment.hoursRemaining}h remaining
                    </div>
                    <div
                      className="section-label"
                      style={{ marginBottom: 4 }}
                    >
                      Clients
                    </div>
                    {canaryDeployment.clients.map((c) => (
                      <div key={c} style={{ fontSize: 11, color: "#6b7280", padding: "1px 0" }}>• {c}</div>
                    ))}
                    <div style={{ borderTop: "1px solid #E8E5DC", marginTop: 8, paddingTop: 8 }}>
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
                              {m.val}%{" "}
                              <span style={{ color: "#9ca3af", fontWeight: 400 }}>/ {m.base}%</span>
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
                        borderRadius: 0,
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

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px", maxWidth: 1440 }}>

        {/* KPI Rail */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 0,
            marginBottom: 20,
            border: "2px solid var(--border)",
          }}
        >
          {kpis.map((kpi, idx) => (
            <div
              key={kpi.label}
              onClick={kpi.clickable ? () => setAtRiskOpen((v) => !v) : undefined}
              className={kpi.extraBoxShadow ? "stale-queue-pulse" : ""}
              style={{
                background: kpi.urgent ? "#FFF8F6" : "#fff",
                borderRight: idx < kpis.length - 1 ? "1px solid #E8E5DC" : "none",
                padding: "14px 14px 12px",
                cursor: kpi.clickable ? "pointer" : "default",
                borderLeft: kpi.urgent ? "3px solid var(--accent)" : "3px solid transparent",
                transition: "background 0.12s",
              }}
            >
              <div
                className="kpi-number"
                dir={kpi.ltr ? "ltr" : "auto"}
                style={{
                  fontSize: 30,
                  color: kpi.color,
                  lineHeight: 1,
                }}
              >
                {kpi.value}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  marginTop: 5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: (kpi as { subColor?: string }).subColor ?? "var(--text-muted)",
                  marginTop: 2,
                  fontFamily: "'Courier Prime', monospace",
                }}
              >
                {kpi.sub}
              </div>
              {kpi.gauge && (
                <div style={{ display: "flex", gap: 2, marginTop: 6, flexWrap: "wrap" }}>
                  {Array.from({ length: totalSlots }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 10,
                        height: 6,
                        borderRadius: 0,
                        background: i < filledSlots ? slotColor : "#E8E5DC",
                      }}
                    />
                  ))}
                </div>
              )}
              {kpi.sparkData && (
                <div style={{ marginTop: 6 }}>
                  <Sparkline data={kpi.sparkData} color={kpi.accent} height={22} />
                </div>
              )}
              {kpi.clickable && (
                <div
                  className="mono"
                  style={{ fontSize: 9, color: "#d97706", marginTop: 3, fontWeight: 700, letterSpacing: "0.06em" }}
                >
                  {atRiskOpen ? "▲ COLLAPSE" : "▼ EXPAND"}
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
              border: "2px solid var(--border)",
              borderRadius: 0,
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "2px solid #fed7aa",
                background: "#fff7ed",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="section-label" style={{ color: "#9a3412" }}>
                At-Risk Clients ({atRiskClients.length})
              </span>
              <button
                onClick={() => setAtRiskOpen(false)}
                style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 0 }}>
              {atRiskClients.map((c, i) => {
                const tierColor = c.churnTier === "red" ? "#be123c" : "#ea580c";
                const tierBg = c.churnTier === "red" ? "#fff1f2" : "#fff7ed";
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "12px 14px",
                      borderRight: i % 2 === 0 ? "1px solid #E8E5DC" : "none",
                      borderBottom: "1px solid #E8E5DC",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{c.name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 0,
                          background: tierBg,
                          color: tierColor,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          fontFamily: "'Courier Prime', monospace",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {c.churnTier}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                      Health:{" "}
                      <span style={{ fontWeight: 700, color: tierColor, fontFamily: "'Bebas Neue', sans-serif", fontSize: 14 }}>
                        {c.healthScore}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, cursor: "pointer" }}>
                      View →
                    </span>
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
                <span className="section-label">Overnight Summary</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  While you were offline
                </span>
              </div>
              <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
                {[
                  { label: "Leads arrived", value: overnightSummary.leadsReceived, color: "#059669" },
                  { label: "Auto-approved", value: overnightSummary.messagesAutoApproved, color: "#4F46E5" },
                  { label: "Trust changes", value: overnightSummary.trustChanges, color: "#d97706" },
                  { label: "Campaign acts", value: overnightSummary.campaignChanges, color: "#7c3aed" },
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
                        borderRight: i < 3 ? "1px solid #E8E5DC" : "none",
                      }}
                    >
                      <div
                        className="kpi-number"
                        style={{ fontSize: 36, color: s.color, lineHeight: 1 }}
                      >
                        {s.value}
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}
                      >
                        {s.label}
                      </div>
                      <div style={{ fontSize: 9, color: s.color, marginTop: 2, fontWeight: 600 }}>
                        {isExpanded ? "▲" : "▼"}
                      </div>
                    </div>
                  );
                })}
              </div>
              {expandedOvernightItem && (() => {
                const highlights = overnightItemHighlights[expandedOvernightItem] ?? overnightSummary.highlights;
                const displayHighlights = highlights.length > 0 ? highlights : overnightSummary.highlights;
                return (
                  <div
                    style={{
                      margin: "0 14px 12px",
                      background: "var(--page-bg)",
                      border: "1px solid #D9D5CC",
                      padding: "10px 12px",
                    }}
                  >
                    <div className="section-label" style={{ marginBottom: 6 }}>
                      {expandedOvernightItem} — Detail
                    </div>
                    {displayHighlights.map((h, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#374151", padding: "3px 0", display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ color: "var(--accent)", flexShrink: 0 }}>›</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {overnightSummary.highlights.length > 0 && (
                <div style={{ padding: "0 14px 12px" }}>
                  {overnightSummary.highlights.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        padding: "4px 0",
                        borderTop: i === 0 ? "1px solid #E8E5DC" : "none",
                        display: "flex",
                        gap: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: "#D9D5CC", flexShrink: 0 }}>›</span>
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
                <span className="section-label">
                  Portfolio{" "}
                  <span style={{ color: "var(--text-primary)" }}>{systemStats.totalClients}</span>
                  {" "}
                  <span style={{ color: "var(--text-muted)" }}>/ {systemStats.clientCapacity} target</span>
                </span>
                <div style={{ display: "flex", gap: 8, fontSize: 9 }}>
                  {[
                    { color: "#16a34a", label: "Auto" },
                    { color: "#d97706", label: "Semi" },
                    { color: "#dc2626", label: "Super" },
                  ].map((l) => (
                    <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: "'Courier Prime', monospace", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <PortfolioHeatMap />
              </div>
              <div style={{ display: "flex", borderTop: "1px solid #E8E5DC" }}>
                {portfolioTrends.map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 4px",
                      borderRight: i < 2 ? "1px solid #E8E5DC" : "none",
                    }}
                  >
                    <div className="kpi-number" style={{ fontSize: 28, color: s.color }}>{s.count}</div>
                    <div className="mono" style={{ fontSize: 9, color: s.color, marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
                    <div style={{ fontSize: 9, marginTop: 2, fontWeight: 700, color: s.trendDir === "up" ? "#16a34a" : s.trendDir === "down" ? "#dc2626" : "#9ca3af" }}>
                      {s.trendDir === "up" ? `+${s.trendVal} ↑` : s.trendDir === "down" ? `${s.trendVal} ↓` : "→"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Churn Risk */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span className="section-label">Churn Risk</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {[
                  { tier: "green", label: "Green", color: "#059669", bg: "#ecfdf5", count: churnCount("green"), desc: "Normal" },
                  { tier: "yellow", label: "Yellow", color: "#ca8a04", bg: "#fefce8", count: churnCount("yellow"), desc: "Watch" },
                  { tier: "orange", label: "Orange", color: "#ea580c", bg: "#fff7ed", count: churnCount("orange"), desc: "Alert 48h" },
                  { tier: "red", label: "Red", color: "#be123c", bg: "#fff1f2", count: churnCount("red"), desc: "Call now" },
                ].map((t, i) => (
                  <div
                    key={t.tier}
                    style={{
                      padding: "10px 12px",
                      borderRight: i % 2 === 0 ? "1px solid #E8E5DC" : "none",
                      borderBottom: i < 2 ? "1px solid #E8E5DC" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                      <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: t.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.label}</span>
                    </div>
                    <div className="kpi-number" style={{ fontSize: 28, color: t.color, marginTop: 2 }}>{t.count}</div>
                    <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.04em" }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Leads */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span className="section-label">Recent Leads</span>
              </div>
              {mockLeads.slice(0, 4).map((lead, i) => (
                <div
                  key={lead.id}
                  style={{
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: i < 3 ? "1px solid #F0EDE4" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{lead.name}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{lead.clientName}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        background: lead.source === "google" ? "#eff6ff" : lead.source === "facebook" ? "#f5f3ff" : "#f0fdf4",
                        color: lead.source === "google" ? "#2563eb" : lead.source === "facebook" ? "#7c3aed" : "#16a34a",
                        fontWeight: 700,
                        fontFamily: "'Courier Prime', monospace",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {lead.source}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        background: lead.status === "new" ? "#fef9c3" : lead.status === "contacted" ? "#dcfce7" : "#f3f4f6",
                        color: lead.status === "new" ? "#854d0e" : lead.status === "contacted" ? "#166534" : "#6b7280",
                        fontWeight: 700,
                        fontFamily: "'Courier Prime', monospace",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
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
                <span className="section-label">Agent Log</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  ₪{systemStats.aiSpendToday.toFixed(2)} today
                </span>
              </div>
              {mockSystemLogs.slice(0, 6).map((log, i) => {
                const typeColor: Record<string, { bg: string; color: string }> = {
                  alert: { bg: "#fef2f2", color: "#dc2626" },
                  ai: { bg: "#f5f3ff", color: "#7c3aed" },
                  lead: { bg: "#f0fdf4", color: "#16a34a" },
                  campaign: { bg: "#eff6ff", color: "#2563eb" },
                  system: { bg: "#f3f4f6", color: "#6b7280" },
                };
                const tc = typeColor[log.type] ?? typeColor.system;
                return (
                  <div
                    key={log.id}
                    style={{
                      padding: "7px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      borderBottom: i < 5 ? "1px solid #F0EDE4" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 8,
                        padding: "2px 5px",
                        fontWeight: 700,
                        background: tc.bg,
                        color: tc.color,
                        flexShrink: 0,
                        textTransform: "uppercase",
                        marginTop: 1,
                        letterSpacing: "0.06em",
                        fontFamily: "'Courier Prime', monospace",
                      }}
                    >
                      {log.type}
                    </span>
                    <p style={{ fontSize: 11, color: "#374151", flex: 1, margin: 0, lineHeight: 1.4 }}>{log.message}</p>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                      <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>{log.time}</span>
                      {log.cost && (
                        <span className="mono" style={{ fontSize: 9, color: "#7c3aed" }}>{log.cost}</span>
                      )}
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
