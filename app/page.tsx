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
function Sparkline({ data, color = "#4F46E5", height = 28 }: { data: number[]; color?: string; height?: number }) {
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

// ── Portfolio heat map (37 client dots) ─────────────────────────────────────
function PortfolioHeatMap() {
  const activeClients = mockClients;
  // Generate ghost clients to fill to 37
  const total = systemStats.totalClients;
  const allDots = Array.from({ length: total }, (_, i) => {
    const real = activeClients[i];
    if (real) return { score: real.trustScore, budget: real.monthlyBudget, name: real.name };
    // ghost client
    const score = 40 + Math.floor(((i * 17) % 60));
    return { score, budget: 3000 + ((i * 2300) % 18000), name: `Client ${i + 1}` };
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        alignItems: "center",
      }}
    >
      {allDots.map((dot, i) => {
        const size = Math.max(8, Math.min(18, 8 + Math.round((dot.budget / 22000) * 10)));
        const color =
          dot.score >= 75 ? "#16a34a"
          : dot.score >= 40 ? "#d97706"
          : "#dc2626";
        return (
          <div
            key={i}
            title={`${dot.name} — Trust: ${dot.score}`}
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: 0.7,
              cursor: "default",
              transition: "opacity 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "1";
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "0.7";
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
            }}
          />
        );
      })}
    </div>
  );
}

// ── Churn tier summary ───────────────────────────────────────────────────────
function churnCount(tier: string) {
  return mockClients.filter((c) => c.churnTier === tier).length;
}

export default function Dashboard() {
  const pendingConvs = mockConversations.filter(
    (c) => c.status === "pending_approval" || c.status === "needs_human" || c.status === "auto_queued"
  );

  const kpis = [
    {
      label: "Active Clients",
      value: systemStats.activeClients,
      sub: `of ${systemStats.totalClients} · target ${systemStats.clientCapacity}`,
      color: "#4F46E5",
      trend: "+2 this month",
      trendUp: true,
      sparkData: [32, 33, 33, 34, 34, 35, 35],
    },
    {
      label: "Leads Today",
      value: systemStats.leadsToday,
      sub: "+12% vs yesterday",
      color: "#059669",
      trend: "+12%",
      trendUp: true,
      sparkData: [48, 55, 51, 60, 58, 62, 68],
    },
    {
      label: "Pending Queue",
      value: systemStats.pendingApprovals,
      sub: "need your eye",
      color: "#dc2626",
      urgent: true,
      trend: null,
      trendUp: null,
      sparkData: null,
    },
    {
      label: "Auto-Approved",
      value: systemStats.autoApprovedToday,
      sub: "today without you",
      color: "#059669",
      trend: null,
      trendUp: null,
      sparkData: [8, 10, 12, 9, 11, 13, 14],
    },
    {
      label: "Monthly Spend",
      value: `₪${(systemStats.monthlySpend / 1000).toFixed(0)}K`,
      sub: `CPL ₪${systemStats.monthlyCpl} / target ₪${systemStats.monthlyCplTarget}`,
      color: systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#059669" : "#d97706",
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
      urgent: mockClients.some((c) => c.churnTier === "red"),
      trend: null,
      trendUp: null,
      sparkData: null,
    },
    {
      label: "Supervised Slots",
      value: `${systemStats.supervisedClients}/${systemStats.supervisedCap}`,
      sub: `${systemStats.supervisedCap - systemStats.supervisedClients} slots free`,
      color: systemStats.supervisedClients >= 10 ? "#dc2626" : "#d97706",
      trend: null,
      trendUp: null,
      sparkData: null,
      ltr: true,
    },
    {
      label: "Agency Health",
      value: agencyHealthScore,
      sub: agencyHealthScore >= 70 ? "Healthy" : agencyHealthScore >= 50 ? "Watch" : "Action needed",
      color: agencyHealthScore >= 70 ? "#059669" : agencyHealthScore >= 50 ? "#d97706" : "#dc2626",
      trend: null,
      trendUp: null,
      sparkData: null,
    },
  ];

  return (
    <>
      <MorningBriefing />
      <div className="p-5" style={{ maxWidth: 1440 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              Today, April 1 ·{" "}
              <span style={{ color: "#059669" }}>All systems operational</span>
              {" · "}
              <span style={{ color: "#6b7280" }}>Sync: {systemStats.lastSync}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {autoApprovalQueue.length > 0 && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 12,
                  color: "#92400e",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#f59e0b",
                    display: "inline-block",
                  }}
                  className="pill-pulse"
                />
                {autoApprovalQueue.length} message{autoApprovalQueue.length > 1 ? "s" : ""} auto-send in &lt;{Math.max(...autoApprovalQueue.map((a) => a.minutesRemaining))}min
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "5px 10px",
                fontSize: 12,
                color: "#166534",
                fontWeight: 600,
              }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }}
              />
              Live
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: "12px 14px",
                border: `1px solid ${kpi.urgent ? "#fca5a5" : "#e5e7eb"}`,
                boxShadow: kpi.urgent ? "0 0 0 3px rgba(220,38,38,0.07)" : "none",
                position: "relative",
              }}
            >
              <div
                className="num-display"
                dir={kpi.ltr ? "ltr" : "auto"}
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: kpi.color,
                  lineHeight: 1,
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, lineHeight: 1.3 }}>{kpi.sub}</div>
              {kpi.sparkData && (
                <div style={{ marginTop: 6 }}>
                  <Sparkline data={kpi.sparkData} color={kpi.color} height={24} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Approval queue */}
            <ApprovalQueue conversations={pendingConvs} />

            {/* Overnight summary */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid #f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                  Overnight Summary
                </h2>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>While you were offline</span>
              </div>
              <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Leads arrived", value: overnightSummary.leadsReceived, color: "#059669" },
                  { label: "Auto-approved", value: overnightSummary.messagesAutoApproved, color: "#4F46E5" },
                  { label: "Trust changes", value: overnightSummary.trustChanges, color: "#d97706" },
                  { label: "Campaign acts", value: overnightSummary.campaignChanges, color: "#7c3aed" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div
                      className="num-display"
                      style={{ fontSize: 24, fontWeight: 700, color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {overnightSummary.highlights.length > 0 && (
                <div style={{ padding: "0 14px 12px" }}>
                  {overnightSummary.highlights.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        padding: "4px 0",
                        borderTop: i === 0 ? "1px solid #f3f4f6" : "none",
                        display: "flex",
                        gap: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: "#d1d5db", flexShrink: 0 }}>›</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Portfolio heat map */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                  Portfolio — {systemStats.totalClients} <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>/ {systemStats.clientCapacity} target</span>
                </h2>
                <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#9ca3af" }}>
                  {[
                    { color: "#16a34a", label: "Autonomous" },
                    { color: "#d97706", label: "Semi" },
                    { color: "#dc2626", label: "Supervised" },
                  ].map((l) => (
                    <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
              <PortfolioHeatMap />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                {[
                  { label: "Autonomous", count: mockClients.filter((c) => c.level === "Autonomous").length, color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Semi-Auto", count: mockClients.filter((c) => c.level === "SemiAuto").length, color: "#d97706", bg: "#fefce8" },
                  { label: "Supervised", count: mockClients.filter((c) => c.level === "Supervised").length, color: "#dc2626", bg: "#fef2f2" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      background: s.bg,
                      borderRadius: 6,
                      padding: "5px 4px",
                      margin: "0 2px",
                    }}
                  >
                    <div className="num-display" style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 9, color: s.color, marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Churn risk */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Churn Risk</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {[
                  { tier: "green", label: "Green", color: "#059669", bg: "#ecfdf5", count: churnCount("green"), desc: "Normal" },
                  { tier: "yellow", label: "Yellow", color: "#ca8a04", bg: "#fefce8", count: churnCount("yellow"), desc: "Watch" },
                  { tier: "orange", label: "Orange", color: "#ea580c", bg: "#fff7ed", count: churnCount("orange"), desc: "Alert 48h" },
                  { tier: "red", label: "Red", color: "#be123c", bg: "#fff1f2", count: churnCount("red"), desc: "Call now" },
                ].map((t) => (
                  <div
                    key={t.tier}
                    style={{
                      padding: "10px 12px",
                      borderRight: t.tier === "green" || t.tier === "orange" ? "1px solid #f3f4f6" : "none",
                      borderBottom: t.tier === "green" || t.tier === "yellow" ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.color, textTransform: "uppercase" }}>{t.label}</span>
                    </div>
                    <div className="num-display" style={{ fontSize: 22, fontWeight: 700, color: t.color, marginTop: 2 }}>{t.count}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent leads */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Recent Leads</h2>
              </div>
              {mockLeads.slice(0, 4).map((lead, i) => (
                <div
                  key={lead.id}
                  style={{
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: i < 3 ? "1px solid #f9fafb" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{lead.clientName}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 99,
                        background: lead.source === "google" ? "#eff6ff" : lead.source === "facebook" ? "#f5f3ff" : "#f0fdf4",
                        color: lead.source === "google" ? "#2563eb" : lead.source === "facebook" ? "#7c3aed" : "#16a34a",
                        fontWeight: 600,
                      }}
                    >
                      {lead.source}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 99,
                        background: lead.status === "new" ? "#fef9c3" : lead.status === "contacted" ? "#dcfce7" : "#f3f4f6",
                        color: lead.status === "new" ? "#854d0e" : lead.status === "contacted" ? "#166534" : "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity log */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid #f3f4f6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                  Agent Log
                </h2>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  AI: ₪{systemStats.aiSpendToday.toFixed(2)} today
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
                      borderBottom: i < 5 ? "1px solid #f9fafb" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 5px",
                        borderRadius: 4,
                        fontWeight: 700,
                        background: tc.bg,
                        color: tc.color,
                        flexShrink: 0,
                        textTransform: "uppercase",
                        marginTop: 1,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {log.type}
                    </span>
                    <p style={{ fontSize: 11, color: "#374151", flex: 1, margin: 0, lineHeight: 1.4 }}>{log.message}</p>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{log.time}</span>
                      {log.cost && (
                        <span style={{ fontSize: 10, color: "#7c3aed" }}>{log.cost}</span>
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
