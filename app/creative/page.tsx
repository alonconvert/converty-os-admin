"use client";

import { useState } from "react";

// ── Mock creative data ────────────────────────────────────────────────────────

const AB_TESTS = [
  {
    id: "ab1",
    clientName: 'גרינברג נדל"ן',
    type: "landing_page",
    name: "Hero Section Copy — דירות מרכז",
    status: "running",
    daysRunning: 5,
    variantA: { label: "Control", leads: 18, cpl: 97, convRate: 4.2 },
    variantB: { label: "Challenger — urgency tone", leads: 26, cpl: 78, convRate: 6.1 },
    winner: "B",
    autoSwitchAt: "80% confidence",
    confidence: 84,
  },
  {
    id: "ab2",
    clientName: "מרפאת שיניים לוי",
    type: "ad_copy",
    name: "Search Ad — Headline variant",
    status: "running",
    daysRunning: 3,
    variantA: { label: "Control — price focus", leads: 9, cpl: 102, convRate: 3.1 },
    variantB: { label: "Challenger — trust focus", leads: 11, cpl: 88, convRate: 3.8 },
    winner: null,
    autoSwitchAt: "80% confidence",
    confidence: 61,
  },
  {
    id: "ab3",
    clientName: 'ד"ר מירי אופיר',
    type: "landing_page",
    name: "CTA Button — text + color",
    status: "concluded",
    daysRunning: 14,
    variantA: { label: "Control — כתמוצ אלינו", leads: 28, cpl: 95, convRate: 4.8 },
    variantB: { label: "Winner — קביעת תור עכשיו", leads: 41, cpl: 72, convRate: 7.0 },
    winner: "B",
    autoSwitchAt: "Deployed",
    confidence: 97,
  },
  {
    id: "ab4",
    clientName: "עורך דין כהן",
    type: "ad_copy",
    name: "Search Ad — Benefit framing",
    status: "running",
    daysRunning: 7,
    variantA: { label: "Control — expertise", leads: 6, cpl: 78, convRate: 2.8 },
    variantB: { label: "Challenger — result focus", leads: 8, cpl: 65, convRate: 3.7 },
    winner: null,
    autoSwitchAt: "80% confidence",
    confidence: 72,
  },
  {
    id: "ab5",
    clientName: "קרן פיטנס",
    type: "creative",
    name: "Facebook Ad Image — lifestyle vs result",
    status: "paused",
    daysRunning: 2,
    variantA: { label: "Control — lifestyle photo", leads: 4, cpl: 64, convRate: 3.2 },
    variantB: { label: "Challenger — before/after", leads: 3, cpl: 72, convRate: 2.8 },
    winner: null,
    autoSwitchAt: "80% confidence",
    confidence: 38,
  },
];

const LANDING_PAGES = [
  { id: "lp1", clientName: 'גרינברג נדל"ן', url: "greenbert-nadlan.converty.io", variants: 2, activeVariant: "B", lastUpdated: "2 days ago", leadsThisWeek: 44, cpl: 82, status: "active" },
  { id: "lp2", clientName: "מרפאת שיניים לוי", url: "levi-dental.converty.io", variants: 2, activeVariant: "A", lastUpdated: "5 days ago", leadsThisWeek: 31, cpl: 100, status: "active" },
  { id: "lp3", clientName: 'ד"ר מירי אופיר', url: "dr-ofir.converty.io", variants: 1, activeVariant: "A", lastUpdated: "1 day ago", leadsThisWeek: 58, cpl: 72, status: "active" },
  { id: "lp4", clientName: "ביטוח ישיר פלוס", url: "bituach-yasir.converty.io", variants: 2, activeVariant: "A", lastUpdated: "10 days ago", leadsThisWeek: 18, cpl: 95, status: "active" },
  { id: "lp5", clientName: "עורך דין כהן", url: "cohen-law.converty.io", variants: 2, activeVariant: "A", lastUpdated: "7 days ago", leadsThisWeek: 12, cpl: 75, status: "active" },
  { id: "lp6", clientName: "עיצוב פנים שרה", url: "sarah-design.converty.io", variants: 1, activeVariant: "A", lastUpdated: "3 days ago", leadsThisWeek: 2, cpl: 118, status: "active" },
  { id: "lp7", clientName: "מוסך אביב", url: "aviv-garage.converty.io", variants: 1, activeVariant: "A", lastUpdated: "14 days ago", leadsThisWeek: 5, cpl: 68, status: "active" },
  { id: "lp8", clientName: "קרן פיטנס", url: "keren-fitness.converty.io", variants: 2, activeVariant: "A", lastUpdated: "2 days ago", leadsThisWeek: 14, cpl: 60, status: "paused" },
];

const AD_COPY_QUEUE = [
  {
    id: "copy1",
    clientName: "מרפאת שיניים לוי",
    type: "search_headline",
    headline: "ציפויים לשיניים מ-₪1,500 בלבד",
    description: "טיפולי שיניים אסתטיים ברמה הגבוהה ביותר. תוצאות מיידיות. קביעת תור עכשיו.",
    targetCampaign: "ציפויים ואסתטיקה",
    status: "pending_review",
    generatedAt: "20 min ago",
  },
  {
    id: "copy2",
    clientName: 'גרינברג נדל"ן',
    type: "facebook_primary",
    headline: "הדירה שחיפשתם — עכשיו במרכז",
    description: "3-4 חדרים, מיקום מושלם, מחיר שמפתיע. צרו קשר היום לפגישת ייעוץ ללא עלות.",
    targetCampaign: 'נדל"ן השקעות - FB',
    status: "pending_review",
    generatedAt: "1h ago",
  },
  {
    id: "copy3",
    clientName: "עורך דין כהן",
    type: "search_headline",
    headline: "פוטרתם? תביעה ב-₪0 מראש",
    description: "עורכי דין לדיני עבודה עם 15 שנות ניסיון. ייעוץ ראשוני חינם. תוצאות מוכחות.",
    targetCampaign: "ייעוץ משפטי - Brand",
    status: "approved",
    generatedAt: "3h ago",
  },
];

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  landing_page: { label: "Landing Page", color: "#4F46E5", bg: "#eef2ff" },
  ad_copy: { label: "Ad Copy", color: "#0891b2", bg: "#ecfeff" },
  creative: { label: "Visual", color: "#7c3aed", bg: "#faf5ff" },
  search_headline: { label: "Search Headline", color: "#0891b2", bg: "#ecfeff" },
  facebook_primary: { label: "Facebook Ad", color: "#7c3aed", bg: "#faf5ff" },
};

// ── Compliance helper ─────────────────────────────────────────────────────────

function getComplianceIssue(clientName: string, headline: string): { level: 'ok' | 'check' | 'violation', msg: string } {
  if (clientName.includes('שיניים') || clientName.includes('רפואה')) {
    const superlatives = ['מספר 1', 'הטוב ביותר', 'מומחה', 'הכי', 'ללא תחרות'];
    const found = superlatives.find(s => headline.includes(s));
    if (found) return { level: 'violation', msg: `Superlative detected: "${found}" — Dental vertical prohibited` };
    return { level: 'ok', msg: 'Dental compliance OK' };
  }
  if (clientName.includes('עורך דין') || clientName.includes('משפטי')) {
    if (headline.includes('עכשיו') && headline.includes('₪0')) return { level: 'check', msg: 'Legal: verify Bar Association compliance for fee mention' };
    return { level: 'ok', msg: 'Legal compliance OK' };
  }
  return { level: 'ok', msg: 'No compliance issues' };
}

function ComplianceBadge({ level, msg }: { level: 'ok' | 'check' | 'violation'; msg: string }) {
  const styles: Record<string, { bg: string; color: string; border: string; text: string }> = {
    ok: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", text: "✓ Compliant" },
    check: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", text: "⚠ Review" },
    violation: { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5", text: "✗ Violation" },
  };
  const s = styles[level];
  return (
    <span
      title={msg}
      style={{
        fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        cursor: "help",
      }}
    >
      {s.text}
    </span>
  );
}

function getVerticalNote(clientName: string): string | null {
  if (clientName.includes('שיניים')) return "Dental vertical — no superlatives";
  if (clientName.includes('עורך דין')) return "Legal vertical — Bar Association rules";
  return null;
}

// ── Enhanced ConfidenceBar ────────────────────────────────────────────────────

function ConfidenceBar({ pct }: { pct: number }) {
  const confidenceColor =
    pct >= 95 ? "#15803d" :
    pct >= 90 ? "#16a34a" :
    pct >= 70 ? "#f59e0b" :
    "#9ca3af";

  const confidenceLabel =
    pct >= 95 ? "STATISTICALLY SIGNIFICANT ✓" :
    pct >= 90 ? "High confidence" :
    pct >= 85 ? "Strong signal emerging" :
    pct >= 70 ? "Building confidence" :
    "Insufficient data — keep running";

  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color: confidenceColor, lineHeight: 1 }}>{pct}%</div>
      <div style={{ fontSize: 10, color: confidenceColor, fontWeight: pct >= 95 ? 700 : 500, marginTop: 2 }}>
        {confidenceLabel}
      </div>
    </div>
  );
}

export default function Creative() {
  const [activeTab, setActiveTab] = useState<"tests" | "pages" | "copy">("tests");
  const [approvedCopies, setApprovedCopies] = useState<string[]>(["copy3"]);

  const runningTests = AB_TESTS.filter((t) => t.status === "running").length;
  const concludedTests = AB_TESTS.filter((t) => t.status === "concluded").length;
  const pendingCopies = AD_COPY_QUEUE.filter((c) => c.status === "pending_review").length;
  const activeLPs = LANDING_PAGES.filter((p) => p.status === "active").length;

  return (
    <div style={{ padding: "18px 20px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Creative</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            A/B tests, landing pages, ad copy — always two variants live
          </p>
        </div>
        <button style={{ fontSize: 12, padding: "7px 14px", borderRadius: 6, border: "none", background: "#4F46E5", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          + Generate New Variant
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Running A/B Tests", value: runningTests, color: "#4F46E5", sub: `${concludedTests} concluded this month` },
          { label: "Landing Pages Live", value: activeLPs, color: "#059669", sub: "2 variants each target" },
          { label: "Ad Copies Pending", value: pendingCopies, color: pendingCopies > 0 ? "#d97706" : "#9ca3af", sub: "awaiting your review", urgent: pendingCopies > 0 },
          { label: "Tests Won This Month", value: concludedTests, color: "#7c3aed", sub: "auto-deployed winners" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${kpi.urgent ? "#fde68a" : "#e5e7eb"}`, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, fontFamily: "'DM Serif Display', serif", lineHeight: 1.1 }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 8, padding: 3, marginBottom: 14, width: "fit-content" }}>
        {([
          { key: "tests", label: `A/B Tests (${AB_TESTS.length})` },
          { key: "pages", label: `Landing Pages (${LANDING_PAGES.length})` },
          { key: "copy", label: `Ad Copy Queue (${AD_COPY_QUEUE.length})` },
        ] as { key: "tests" | "pages" | "copy"; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600,
              background: activeTab === tab.key ? "#fff" : "transparent",
              color: activeTab === tab.key ? "#111827" : "#9ca3af",
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* A/B Tests */}
      {activeTab === "tests" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {AB_TESTS.map((test) => {
            const typeCfg = TYPE_CONFIG[test.type];
            const statusColor = test.status === "running" ? "#22c55e" : test.status === "concluded" ? "#4F46E5" : "#9ca3af";

            // Benchmark comparison
            const currentBestCpl = Math.min(test.variantA.cpl, test.variantB.cpl);
            const historicalCpl = Math.round(currentBestCpl * 1.15);
            const benchmarkDelta = Math.round(((historicalCpl - currentBestCpl) / historicalCpl) * 100);

            // Sample size
            const totalClicks = (test.variantA.leads + test.variantB.leads) * 3;
            const aClicks = test.variantA.leads * 3;
            const bClicks = test.variantB.leads * 3;
            const velocity = Math.round((test.variantA.leads + test.variantB.leads) * 0.7);
            const daysToSignificance = test.confidence < 85 ? Math.max(1, Math.round(20 - test.daysRunning * 1.5)) : null;

            // Vertical note
            const verticalNote = getVerticalNote(test.clientName);

            return (
              <div key={test.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                {/* Card header */}
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: typeCfg.bg, color: typeCfg.color }}>{typeCfg.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{test.name}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>— {test.clientName}</span>
                  {verticalNote && (
                    <span style={{ fontSize: 9, color: "#6b7280", background: "#f9fafb", padding: "1px 5px", borderRadius: 3 }}>
                      {verticalNote}
                    </span>
                  )}
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{test.daysRunning}d running</span>
                    {daysToSignificance !== null && test.status === "running" && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                        background: daysToSignificance <= 3 ? "#fffbeb" : "#f9fafb",
                        color: daysToSignificance <= 3 ? "#d97706" : "#6b7280",
                        border: `1px solid ${daysToSignificance <= 3 ? "#fde68a" : "#e5e7eb"}`,
                      }}>
                        ~{daysToSignificance}d to decision
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: test.status === "running" ? "#f0fdf4" : test.status === "concluded" ? "#eef2ff" : "#f3f4f6", color: statusColor }}>
                      {test.status === "running" ? "● RUNNING" : test.status === "concluded" ? "✓ CONCLUDED" : "⏸ PAUSED"}
                    </span>
                  </div>
                </div>

                {/* Variant metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  {[
                    { variant: test.variantA, label: "A", isWinner: test.winner === "A" },
                    { variant: test.variantB, label: "B", isWinner: test.winner === "B" },
                  ].map(({ variant, label, isWinner }) => {
                    // Only show WINNER badge if confidence >= 95
                    const showWinner = isWinner && test.confidence >= 95;
                    return (
                      <div
                        key={label}
                        style={{
                          padding: "12px 16px",
                          borderRight: label === "A" ? "1px solid #f3f4f6" : "none",
                          background: showWinner ? "#f0fdf4" : "#fff",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: showWinner ? "#16a34a" : "#6b7280", background: showWinner ? "#dcfce7" : "#f3f4f6", padding: "1px 6px", borderRadius: 3 }}>
                            {label} {showWinner ? "— WINNER ✓" : ""}
                          </span>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>{variant.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: 14 }}>
                          {[
                            { label: "Leads", value: variant.leads },
                            { label: "CPL", value: `₪${variant.cpl}` },
                            { label: "Conv%", value: `${variant.convRate}%` },
                          ].map((m) => (
                            <div key={m.label}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "'DM Serif Display', serif" }}>{m.value}</div>
                              <div style={{ fontSize: 9, color: "#9ca3af" }}>{m.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Benchmark row */}
                <div style={{ padding: "6px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <span style={{ fontSize: 11, color: benchmarkDelta >= 0 ? "#16a34a" : "#dc2626", fontWeight: 500 }}>
                    vs Benchmark ₪{historicalCpl}: current best ₪{currentBestCpl} ({benchmarkDelta}% improvement)
                  </span>
                </div>

                {/* Confidence footer */}
                <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ marginBottom: 6 }}>
                      <ConfidenceBar pct={test.confidence} />
                    </div>
                    {/* Sample size & velocity */}
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>
                      Sample: {totalClicks} clicks (A: {aClicks} / B: {bClicks}) | Velocity: ~{velocity} clicks/day
                      {daysToSignificance !== null && (
                        <span> | Est. significance in {daysToSignificance} more days</span>
                      )}
                    </div>
                  </div>
                  {test.status === "concluded" ? (
                    <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Winner deployed</span>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>End Test</button>
                      <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "none", background: "#4F46E5", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                        {test.winner ? "Deploy Winner Now" : "Force Winner"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Landing Pages */}
      {activeTab === "pages" && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Client", "URL", "Status", "Variants", "Active", "Leads / Week", "CPL", "Last Updated", ""].map((h) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#9ca3af", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LANDING_PAGES.map((lp, i) => (
                <tr key={lp.id} style={{ borderBottom: i < LANDING_PAGES.length - 1 ? "1px solid #f9fafb" : "none" }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#111827" }}>{lp.clientName}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{lp.url}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: lp.status === "active" ? "#f0fdf4" : "#f3f4f6", color: lp.status === "active" ? "#16a34a" : "#6b7280" }}>
                      {lp.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151", textAlign: "center" }}>{lp.variants}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: "#eef2ff", color: "#4F46E5" }}>Variant {lp.activeVariant}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#111827" }}>{lp.leadsThisWeek}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#111827" }}>₪{lp.cpl}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#9ca3af" }}>{lp.lastUpdated}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>Preview</button>
                      <button style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, border: "none", background: "#eef2ff", color: "#4F46E5", cursor: "pointer", fontWeight: 600 }}>New Variant</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ad Copy Queue */}
      {activeTab === "copy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {AD_COPY_QUEUE.map((copy) => {
            const typeCfg = TYPE_CONFIG[copy.type] ?? TYPE_CONFIG.search_headline;
            const approved = approvedCopies.includes(copy.id);
            const compliance = getComplianceIssue(copy.clientName, copy.headline);
            return (
              <div key={copy.id} style={{ background: approved ? "#f0fdf4" : "#fff", borderRadius: 10, border: `1px solid ${approved ? "#bbf7d0" : "#e5e7eb"}`, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: typeCfg.bg, color: typeCfg.color }}>{typeCfg.label}</span>
                  <ComplianceBadge level={compliance.level} msg={compliance.msg} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{copy.clientName}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>→ {copy.targetCampaign}</span>
                  <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: "auto" }}>{copy.generatedAt}</span>
                </div>
                <div style={{ background: "#f9fafb", borderRadius: 7, padding: "10px 12px", marginBottom: 10 }} dir="rtl">
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{copy.headline}</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{copy.description}</div>
                  {/* Character counts */}
                  {copy.type === 'search_headline' && (
                    <div style={{ fontSize: 10, color: copy.headline.length > 30 ? "#dc2626" : "#9ca3af", marginTop: 4 }} dir="ltr">
                      Headline: {copy.headline.length}/30 chars {copy.headline.length > 30 ? "⚠ OVER LIMIT" : "✓"}
                    </div>
                  )}
                  {(copy.type === 'search_headline' || copy.type === 'facebook_primary') && (
                    <div style={{ fontSize: 10, color: copy.description.length > 90 ? "#dc2626" : "#9ca3af", marginTop: 2 }} dir="ltr">
                      Description: {copy.description.length}/90 chars {copy.description.length > 90 ? "⚠ OVER LIMIT" : "✓"}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {approved ? (
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Approved — queued for A/B test</span>
                  ) : (
                    <>
                      <button
                        onClick={() => setApprovedCopies((p) => [...p, copy.id])}
                        style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                      >
                        Approve + Add to Test
                      </button>
                      <button style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>
                        Edit
                      </button>
                      <button style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
