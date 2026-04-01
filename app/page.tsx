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

// ── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#7C3AED", height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

// ── Portfolio heat map ───────────────────────────────────────────────────────
function PortfolioHeatMap() {
  const total = systemStats.totalClients;
  const allDots = Array.from({ length: total }, (_, i) => {
    const real = mockClients[i];
    if (real) return { score: real.trustScore, budget: real.monthlyBudget, name: real.name, real: true };
    const score = 40 + Math.floor(((i * 17) % 60));
    return { score, budget: 3000 + ((i * 2300) % 18000), name: `Client ${i + 1}`, real: false };
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
      {allDots.map((dot, i) => {
        const size = Math.max(9, Math.min(18, 9 + Math.round((dot.budget / 22000) * 9)));
        const color = dot.score >= 75 ? "#10B981" : dot.score >= 40 ? "#F59E0B" : "#EF4444";
        return (
          <a
            key={i}
            href={dot.real ? "/clients" : undefined}
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

const atRiskClients = mockClients.filter((c) => c.churnTier === "orange" || c.churnTier === "red");

const overnightItemHighlights: Record<string, string[]> = {
  "הגעת לידים": overnightSummary.highlights.filter((h) => h.toLowerCase().includes("lead")),
  "אישור אוטומטי": overnightSummary.highlights.filter((h) =>
    h.toLowerCase().includes("auto-approved") || h.toLowerCase().includes("messages")
  ),
  "שינויי אמון": overnightSummary.highlights.filter((h) => h.toLowerCase().includes("trust")),
  "פעולות קמפיין": overnightSummary.highlights.filter((h) =>
    h.toLowerCase().includes("campaign") || h.toLowerCase().includes("meta") || h.toLowerCase().includes("google")
  ),
};

// ── Shared card styles ───────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--card-border)",
  borderRadius: 8,
  boxShadow: "var(--card-shadow)",
  overflow: "hidden",
};

const CARD_HEADER: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid #F3F4F6",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

// ── KPI Card component ───────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  subColor,
  color,
  sparkData,
  trend,
  trendUp,
  gauge,
  gaugeVal,
  gaugeCap,
  gaugeColor,
  urgent,
  extraPulse,
  onClick,
  expandLabel,
  ltr,
}: {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  color?: string;
  sparkData?: number[] | null;
  trend?: string | null;
  trendUp?: boolean | null;
  gauge?: boolean;
  gaugeVal?: number;
  gaugeCap?: number;
  gaugeColor?: string;
  urgent?: boolean;
  extraPulse?: boolean;
  onClick?: () => void;
  expandLabel?: string;
  ltr?: boolean;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={onClick}
      className={extraPulse ? "stale-queue-pulse" : ""}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        border: `1px solid ${urgent ? "rgba(239,68,68,0.35)" : "var(--card-border)"}`,
        borderRadius: 8,
        padding: "16px 18px 14px",
        boxShadow: hov
          ? "0 4px 12px rgba(0,0,0,0.1)"
          : urgent
          ? "0 0 0 3px rgba(239,68,68,0.06), var(--card-shadow)"
          : "var(--card-shadow)",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s, transform 0.1s",
        transform: hov ? "translateY(-1px)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Top row: label + sparkline */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
        {sparkData && (
          <Sparkline data={sparkData} color={color ?? "#7C3AED"} height={28} />
        )}
        {urgent && !sparkData && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#EF4444",
              display: "inline-block",
              marginTop: 3,
              flexShrink: 0,
            }}
            className="pill-pulse"
          />
        )}
      </div>

      {/* Number */}
      <div
        className="num-display"
        dir={ltr ? "ltr" : "auto"}
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: color ?? "var(--text-primary)",
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>

      {/* Sub */}
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: subColor ?? "var(--text-muted)",
            lineHeight: 1.4,
          }}
          dir="ltr"
        >
          {sub}
        </div>
      )}

      {/* Trend */}
      {trend && (
        <div
          style={{
            fontSize: 11,
            color: trendUp ? "#10B981" : "#EF4444",
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </div>
      )}

      {/* Gauge */}
      {gauge && gaugeVal !== undefined && gaugeCap !== undefined && (
        <div style={{ display: "flex", gap: 2, marginTop: 8, flexWrap: "wrap" }}>
          {Array.from({ length: gaugeCap }, (_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 5,
                borderRadius: 3,
                background: i < gaugeVal ? (gaugeColor ?? "#7C3AED") : "#F3F4F6",
              }}
            />
          ))}
        </div>
      )}

      {/* Expand hint */}
      {expandLabel && (
        <div style={{ fontSize: 10, color: "var(--text-placeholder)", marginTop: 4, fontWeight: 600 }}>
          {expandLabel}
        </div>
      )}
    </div>
  );
}

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

  const oldestMinutes = 252;
  const oldestDisplay = "4h 12m";
  const oldestUrgent = oldestMinutes > 240;
  const slotColor =
    systemStats.supervisedClients <= 7 ? "#10B981" : systemStats.supervisedClients <= 9 ? "#F59E0B" : "#EF4444";
  const healthColor =
    agencyHealthScore >= 70 ? "#10B981" : agencyHealthScore >= 50 ? "#F59E0B" : "#EF4444";

  const portfolioTrends = [
    { label: "אוטונומי", count: mockClients.filter((c) => c.level === "Autonomous").length, color: "#10B981", trendDir: "up" as const, trendVal: 2 },
    { label: "חצי-אוטו", count: mockClients.filter((c) => c.level === "SemiAuto").length, color: "#F59E0B", trendDir: "neutral" as const, trendVal: 0 },
    { label: "מפוקח", count: mockClients.filter((c) => c.level === "Supervised").length, color: "#EF4444", trendDir: "down" as const, trendVal: -1 },
  ];

  return (
    <>
      <MorningBriefing />

      <div style={{ padding: "24px" }}>

        {/* ── Page header ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              לוח בקרה
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
              היום, 1 באפריל 2026 ·{" "}
              <span style={{ color: "#10B981" }}>כל המערכות פעילות</span>
              {" · "}
              <span dir="ltr" style={{ display: "inline" }}>סנכרון: {systemStats.lastSync}</span>
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {autoApprovalQueue.length > 0 && (
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 12,
                  color: "#92400E",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} className="pill-pulse" />
                {autoApprovalQueue.length} הודעות לשליחה אוטומטית
              </div>
            )}

            {canaryDeployment.active && (
              <div ref={canaryRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setCanaryOpen((v) => !v)}
                  style={{
                    background: "#F5F3FF",
                    border: "1px solid #DDD6FE",
                    borderRadius: 8,
                    padding: "5px 12px",
                    fontSize: 12,
                    color: "#7C3AED",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  ⚗ CANARY {canaryDeployment.version}
                </button>
                {canaryOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      insetInlineStart: 0,
                      zIndex: 50,
                      background: "#fff",
                      border: "1px solid var(--card-border)",
                      borderRadius: 10,
                      padding: "14px 16px",
                      width: 260,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED", marginBottom: 8 }}>
                      ⚗ Canary {canaryDeployment.version}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>{canaryDeployment.hoursRemaining}h remaining</div>
                    <div style={{ fontSize: 11, color: "#374151", marginBottom: 4, fontWeight: 600 }}>Clients:</div>
                    {canaryDeployment.clients.map((c) => (
                      <div key={c} style={{ fontSize: 11, color: "#6B7280", padding: "1px 0" }}>• {c}</div>
                    ))}
                    <div style={{ borderTop: "1px solid #F3F4F6", marginTop: 8, paddingTop: 8 }}>
                      {[
                        { label: "Approval rate", val: canaryDeployment.approvalRate, base: canaryDeployment.baselineApprovalRate, higherIsBetter: true },
                        { label: "QA pass rate", val: canaryDeployment.qaPassRate, base: canaryDeployment.baselineQaPassRate, higherIsBetter: true },
                        { label: "Edit rate", val: canaryDeployment.editRate, base: canaryDeployment.baselineEditRate, higherIsBetter: false },
                      ].map((m) => {
                        const better = m.higherIsBetter ? m.val >= m.base : m.val <= m.base;
                        return (
                          <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                            <span style={{ color: "#6B7280" }}>{m.label}</span>
                            <span style={{ fontWeight: 700, color: better ? "#10B981" : "#EF4444" }}>
                              {m.val}%{" "}
                              <span style={{ color: "#9CA3AF", fontWeight: 400 }}>/ {m.base}%</span>
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
                        background: "#FEF2F2",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        borderRadius: 6,
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

            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#10B981", fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} className="pill-pulse" />
              פעיל
            </div>
          </div>
        </div>

        {/* ── KPI Row 1 (Primary) ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
          <KpiCard
            label="תור המתנה"
            value={systemStats.pendingApprovals}
            sub={`הישן ביותר: ${oldestDisplay}`}
            subColor={oldestUrgent ? "#F59E0B" : undefined}
            color="#EF4444"
            urgent
            extraPulse={oldestUrgent}
          />
          <KpiCard
            label="לידים היום"
            value={systemStats.leadsToday}
            sub="+12% לעומת אתמול"
            color="#7C3AED"
            sparkData={[48, 55, 51, 60, 58, 62, 68]}
            trend="+12%"
            trendUp
          />
          <KpiCard
            label="אושר אוטומטית"
            value={systemStats.autoApprovedToday}
            sub="ללא התערבותך"
            color="#10B981"
            sparkData={[8, 10, 12, 9, 11, 13, 14]}
          />
          <KpiCard
            label="לקוחות פעילים"
            value={systemStats.activeClients}
            sub={`מתוך ${systemStats.totalClients} · יעד ${systemStats.clientCapacity}`}
            color="#7C3AED"
            sparkData={[32, 33, 33, 34, 34, 35, 35]}
            trend="+2 החודש"
            trendUp
          />
        </div>

        {/* ── KPI Row 2 (Secondary) ──────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          <KpiCard
            label="הוצאה חודשית"
            value={`₪${(systemStats.monthlySpend / 1000).toFixed(0)}K`}
            sub={`CPL ₪${systemStats.monthlyCpl} / יעד ₪${systemStats.monthlyCplTarget}`}
            color={systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#10B981" : "#F59E0B"}
            ltr
          />
          <KpiCard
            label="לקוחות בסיכון"
            value={mockClients.filter((c) => c.churnTier === "orange" || c.churnTier === "red").length}
            sub={`${churnCount("red")} אדום · ${churnCount("orange")} כתום`}
            color="#EA580C"
            urgent={mockClients.some((c) => c.churnTier === "red")}
            onClick={() => setAtRiskOpen((v) => !v)}
            expandLabel={atRiskOpen ? "▲ סגור" : "▼ הרחב"}
          />
          <KpiCard
            label="מקומות מפוקחים"
            value={`${systemStats.supervisedClients}/${systemStats.supervisedCap}`}
            sub={`${systemStats.supervisedCap - systemStats.supervisedClients} מקומות פנויים`}
            color={systemStats.supervisedClients >= 10 ? "#EF4444" : "#F59E0B"}
            gauge
            gaugeVal={systemStats.supervisedClients}
            gaugeCap={systemStats.supervisedCap}
            gaugeColor={slotColor}
            ltr
          />
          <KpiCard
            label="בריאות הסוכנות"
            value={`${agencyHealthScore}%`}
            sub={agencyHealthScore >= 70 ? "תקין" : agencyHealthScore >= 50 ? "מעקב" : "דרושה פעולה"}
            color={healthColor}
          />
        </div>

        {/* ── At-Risk panel ──────────────────────────────────────── */}
        {atRiskOpen && (
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(234,88,12,0.25)",
              borderRadius: 8,
              marginBottom: 16,
              overflow: "hidden",
              boxShadow: "var(--card-shadow)",
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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#9A3412" }}>
                לקוחות בסיכון ({atRiskClients.length})
              </span>
              <button
                onClick={() => setAtRiskOpen(false)}
                style={{ fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {atRiskClients.map((c, i) => {
                const tierColor = c.churnTier === "red" ? "#BE123C" : "#EA580C";
                const tierBg = c.churnTier === "red" ? "#FFF1F2" : "#FFF7ED";
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "12px 16px",
                      borderInlineEnd: i % 2 === 0 ? "1px solid #F3F4F6" : "none",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: tierBg,
                          color: tierColor,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {c.churnTier}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>
                      ציון בריאות:{" "}
                      <span style={{ fontWeight: 700, color: tierColor }}>{c.healthScore}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600, cursor: "pointer" }}>צפה ←</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Main 2-col grid ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Approval queue */}
            <ApprovalQueue conversations={pendingConvs} />

            {/* Overnight Summary */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  סיכום לילה
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  בזמן שהיית לא מחובר
                </span>
              </div>
              <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                {[
                  { label: "הגעת לידים", value: overnightSummary.leadsReceived, color: "#10B981" },
                  { label: "אישור אוטומטי", value: overnightSummary.messagesAutoApproved, color: "#7C3AED" },
                  { label: "שינויי אמון", value: overnightSummary.trustChanges, color: "#F59E0B" },
                  { label: "פעולות קמפיין", value: overnightSummary.campaignChanges, color: "#3B82F6" },
                ].map((s, i) => {
                  const isExpanded = expandedOvernightItem === s.label;
                  return (
                    <div
                      key={s.label}
                      onClick={() => setExpandedOvernightItem(isExpanded ? null : s.label)}
                      style={{
                        textAlign: "center",
                        cursor: "pointer",
                        padding: "10px 4px",
                        borderInlineEnd: i < 3 ? "1px solid #F3F4F6" : "none",
                        borderRadius: 6,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                    >
                      <div className="num-display" style={{ fontSize: 30, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 9, color: s.color, marginTop: 2, fontWeight: 700 }}>
                        {isExpanded ? "▲" : "▼"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {expandedOvernightItem && (() => {
                const highlights = overnightItemHighlights[expandedOvernightItem] ?? overnightSummary.highlights;
                const list = highlights.length > 0 ? highlights : overnightSummary.highlights;
                return (
                  <div style={{ margin: "0 16px 14px", background: "#F9FAFB", borderRadius: 6, padding: "10px 12px", border: "1px solid #F3F4F6" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-placeholder)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {expandedOvernightItem} — פרטים
                    </div>
                    {list.map((h, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#374151", padding: "3px 0", display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ color: "var(--brand)", flexShrink: 0 }}>›</span>
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
                        color: "#6B7280",
                        padding: "4px 0",
                        borderTop: i === 0 ? "1px solid #F3F4F6" : "none",
                        display: "flex",
                        gap: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: "#D1D5DB", flexShrink: 0 }}>›</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Portfolio */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  תיק לקוחות{" "}
                  <span style={{ color: "var(--brand)" }}>{systemStats.totalClients}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
                    {" "}/ {systemStats.clientCapacity} יעד
                  </span>
                </span>
                <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
                  {[
                    { color: "#10B981", label: "אוטו'" },
                    { color: "#F59E0B", label: "חצי" },
                    { color: "#EF4444", label: "מפוקח" },
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
              <div style={{ display: "flex", borderTop: "1px solid #F3F4F6" }}>
                {portfolioTrends.map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "10px 4px",
                      borderInlineEnd: i < 2 ? "1px solid #F3F4F6" : "none",
                    }}
                  >
                    <div className="num-display" style={{ fontSize: 22, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 10, color: s.color, marginTop: 2, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 10, marginTop: 2, fontWeight: 700, color: s.trendDir === "up" ? "#10B981" : s.trendDir === "down" ? "#EF4444" : "#9CA3AF" }}>
                      {s.trendDir === "up" ? `+${s.trendVal} ↑` : s.trendDir === "down" ? `${s.trendVal} ↓` : "→"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Churn Risk */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  סיכון נטישה
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {[
                  { tier: "green", label: "ירוק", color: "#059669", bg: "#ECFDF5", count: churnCount("green"), desc: "תקין" },
                  { tier: "yellow", label: "צהוב", color: "#CA8A04", bg: "#FEFCE8", count: churnCount("yellow"), desc: "מעקב" },
                  { tier: "orange", label: "כתום", color: "#EA580C", bg: "#FFF7ED", count: churnCount("orange"), desc: "התראה 48h" },
                  { tier: "red", label: "אדום", color: "#BE123C", bg: "#FFF1F2", count: churnCount("red"), desc: "התקשר עכשיו" },
                ].map((t, i) => (
                  <div
                    key={t.tier}
                    style={{
                      padding: "12px 14px",
                      borderInlineEnd: i % 2 === 0 ? "1px solid #F3F4F6" : "none",
                      borderBottom: i < 2 ? "1px solid #F3F4F6" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.label}</span>
                    </div>
                    <div className="num-display" style={{ fontSize: 24, color: t.color }}>{t.count}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Leads */}
            <div style={CARD}>
              <div style={CARD_HEADER}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  לידים אחרונים
                </span>
              </div>
              {mockLeads.slice(0, 4).map((lead, i) => (
                <div
                  key={lead.id}
                  style={{
                    padding: "9px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: i < 3 ? "1px solid #F9FAFB" : "none",
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
                        background: lead.source === "google" ? "#EFF6FF" : lead.source === "facebook" ? "#F5F3FF" : "#ECFDF5",
                        color: lead.source === "google" ? "#2563EB" : lead.source === "facebook" ? "#7C3AED" : "#059669",
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
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  יומן סוכן
                </span>
                <span dir="ltr" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  ₪{systemStats.aiSpendToday.toFixed(2)} היום
                </span>
              </div>
              {mockSystemLogs.slice(0, 6).map((log, i) => {
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
                      borderBottom: i < 5 ? "1px solid #F9FAFB" : "none",
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

          </div>
        </div>
      </div>
    </>
  );
}
