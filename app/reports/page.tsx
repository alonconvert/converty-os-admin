"use client";

import { useState, useEffect } from "react";
import { mockClients, systemStats } from "@/lib/mock-data";
import Link from "next/link";

const WEEK_LABEL = "Apr 1–7, 2026";

const MOCK_HOLIDAYS = [
  { date: "2026-04-13", name: "ערב פסח", clients: "all" },
];

function Sparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  const W = 60, H = 22;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * H}`).join(" ");
  return (
    <svg width={W} height={H}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

function HealthBadge({ score }: { score: number }) {
  let bg: string, color: string;
  if (score >= 70) { bg = "#ecfdf5"; color = "#059669"; }
  else if (score >= 50) { bg = "#fefce8"; color = "#ca8a04"; }
  else if (score >= 30) { bg = "#fff7ed"; color = "#ea580c"; }
  else { bg = "#fff1f2"; color = "#be123c"; }
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

const DELIVERY_OPTIONS = [
  { label: "Sunday before 09:30 IST ✓", value: "sun_09", active: true },
  { label: "Sunday before 08:00 IST", value: "sun_08", active: false },
  { label: "Monday before 09:30 IST", value: "mon_09", active: false },
  { label: "Custom", value: "custom", active: false },
];

// Demo: clients id "1" and "5" show a Passover prep holiday chip
const DEMO_HOLIDAY_CLIENT_IDS = ["1", "5"];

const SKELETON_STYLE = {
  height: 180,
  background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.4s ease-in-out infinite",
  borderRadius: 8,
} as const;

export default function Reports() {
  const [deliveryTime, setDeliveryTime] = useState("sun_09");
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reportsReady, setReportsReady] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [sendAllOpen, setSendAllOpen] = useState(false);
  const [sendAllConfirmed, setSendAllConfirmed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async data load (replace with real fetch when backend is wired)
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const istOffset = 3 * 60; // UTC+3 (summer)
      const nowIST = new Date(now.getTime() + (istOffset - now.getTimezoneOffset()) * 60000);
      const sunday = new Date(nowIST);
      const day = sunday.getDay(); // 0 = Sunday
      const daysUntilSunday = day === 0 ? 7 : (7 - day);
      sunday.setDate(sunday.getDate() + daysUntilSunday);
      sunday.setHours(9, 30, 0, 0);
      const diff = sunday.getTime() - nowIST.getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${hours}h ${mins}m until Sun 09:30 IST`);
    };
    updateCountdown();
    const t = setInterval(updateCountdown, 60000);
    return () => clearInterval(t);
  }, []);

  const filtered = mockClients.filter((c) => c.name.includes(search) || c.domain.includes(search));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setReportsReady(true);
    }, 1500);
  };

  const handleSendAllConfirm = () => {
    setSendAllOpen(false);
    setSendAllConfirmed(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const redOrangeClients = mockClients.filter(c => c.churnTier === "red" || c.churnTier === "orange");

  // Progress bar segments
  const totalClients = mockClients.length;
  const readyCount = reportsReady ? totalClients : 0;

  return (
    <div style={{ padding: "18px 16px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Reports</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Weekly AI-generated performance reports — {WEEK_LABEL}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link
            href="/reports/costs"
            style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff", textDecoration: "none", fontWeight: 600 }}
          >
            🤖 AI Cost Report →
          </Link>
          <button
            onClick={() => { if (reportsReady) setSendAllOpen(true); }}
            disabled={!reportsReady}
            style={{
              fontSize: 12, padding: "7px 14px", borderRadius: 6, border: "none",
              background: reportsReady ? "#059669" : "#e5e7eb",
              color: reportsReady ? "#fff" : "#9ca3af",
              cursor: reportsReady ? "pointer" : "default",
              fontWeight: 600,
            }}
          >
            Send All Ready ({readyCount})
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{ fontSize: 12, padding: "7px 14px", borderRadius: 6, border: "none", background: generating ? "#e5e7eb" : "#4F46E5", color: generating ? "#9ca3af" : "#fff", cursor: generating ? "default" : "pointer", fontWeight: 600 }}
          >
            {generating ? "Generating…" : "Generate All Reports"}
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      {loading ? (
        <div className="responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          {[1,2,3,4].map((i) => <div key={i} style={SKELETON_STYLE} />)}
        </div>
      ) : null}
      <div className="responsive-grid-4" style={{ display: loading ? "none" : "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {/* Total Leads */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Total Leads</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#4F46E5" }}>{systemStats.leadsToday * 7}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>this week</div>
          <div style={{ fontSize: 12, color: "#059669", marginTop: 4 }}>↑ +23 vs last week (+5.1%)</div>
        </div>
        {/* Avg CPL */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Avg CPL</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#059669" : "#dc2626" }}>₪{systemStats.monthlyCpl}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>target ₪{systemStats.monthlyCplTarget}</div>
          <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>↑ +₪3 vs last week (+3.4%)</div>
        </div>
        {/* Total Spend */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Total Spend</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>₪{(systemStats.monthlySpend / 4).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>week est.</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>↑ +₪1,800 vs last week (+6.8%)</div>
        </div>
        {/* Reports Ready */}
        <div style={{ background: readyCount === 0 ? "#fafafa" : "#fff", borderRadius: 10, border: readyCount === 0 ? "1px solid #c7d2fe" : "1px solid #e5e7eb", padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Reports Ready</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: readyCount === 0 ? "#6b7280" : "#4F46E5" }}>{readyCount}/{totalClients}</div>
          {/* Progress bar */}
          <div style={{ display: "flex", gap: 2, marginTop: 6, marginBottom: 4 }}>
            {Array.from({ length: totalClients }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < readyCount ? "#4F46E5" : "#e5e7eb" }} />
            ))}
          </div>
          {readyCount === 0 ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                width: "100%", marginTop: 4, fontSize: 12, padding: "5px 0", borderRadius: 5,
                border: "none", background: generating ? "#e5e7eb" : "#4F46E5",
                color: generating ? "#9ca3af" : "#fff",
                cursor: generating ? "default" : "pointer", fontWeight: 700,
              }}
            >
              {generating ? "Generating…" : "↑ Generate Reports"}
            </button>
          ) : (
            <div style={{ fontSize: 12, color: "#4F46E5", fontWeight: 600, marginTop: 2 }}>Ready to send</div>
          )}
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{countdown || "calculating…"}</div>
        </div>
      </div>

      {loading && (
        <div className="responsive-grid-2-sidebar" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12 }}>
          <div style={SKELETON_STYLE} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...SKELETON_STYLE, height: 120 }} />
            <div style={{ ...SKELETON_STYLE, height: 120 }} />
          </div>
        </div>
      )}
      <div className="responsive-grid-2-sidebar" style={{ display: loading ? "none" : "grid", gridTemplateColumns: "1fr 280px", gap: 12 }}>
        {/* Report cards */}
        <div>
          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            style={{ width: "100%", fontSize: 12, padding: "8px 10px", borderRadius: 7, border: "1px solid #e5e7eb", marginBottom: 10, boxSizing: "border-box" }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {filtered.map((client, i) => {
              const weeklyLeads = client.leadsWeekly.reduce((s, v) => s + v, 0);
              const weeklyBudget = Math.round(client.monthlyBudget / 4);
              const cpl = weeklyLeads > 0 ? Math.round(weeklyBudget / weeklyLeads) : 0;
              const cplOk = cpl <= client.cplTarget;
              const isHumanTakeover = client.churnTier === "red";
              const showHolidayChip = DEMO_HOLIDAY_CLIENT_IDS.includes(client.id);

              return (
                <div key={client.id} style={{ padding: "12px 14px", borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Status dot */}
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: client.status === "active" ? "#22c55e" : "#d1d5db", flexShrink: 0 }} />

                  {/* Name + domain */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{client.name}</span>
                      {showHolidayChip && (
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#f3f4f6", color: "#6b7280" }}>
                          🗓 Passover prep week
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{client.domain} · {WEEK_LABEL}</div>
                  </div>

                  {/* Sparkline */}
                  <Sparkline data={client.leadsWeekly} color={cplOk ? "#4F46E5" : "#f59e0b"} />

                  {/* Health badge */}
                  <HealthBadge score={client.healthScore} />

                  {/* Metrics */}
                  <div style={{ display: "flex", gap: 14 }}>
                    {[
                      { label: "Leads", value: weeklyLeads },
                      { label: "CPL", value: `₪${cpl}`, alert: !cplOk },
                      { label: "Budget", value: `₪${weeklyBudget.toLocaleString()}` },
                    ].map((m) => (
                      <div key={m.label} style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: m.alert ? "#dc2626" : "#111827" }}>{m.value}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button style={{ fontSize: 12, padding: "4px 8px", borderRadius: 5, border: "none", background: "#eef2ff", color: "#4F46E5", cursor: "pointer", fontWeight: 600 }}>
                      View
                    </button>
                    {isHumanTakeover ? (
                      <button
                        disabled
                        style={{ fontSize: 12, padding: "4px 8px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", cursor: "default", fontWeight: 600 }}
                      >
                        HT Required
                      </button>
                    ) : (
                      <button style={{ fontSize: 12, padding: "4px 8px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>
                        Send
                      </button>
                    )}
                    <button style={{ fontSize: 12, padding: "4px 8px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>
                      🔄
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: delivery config + AI cost summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Weekly delivery config */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Weekly Delivery Schedule</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DELIVERY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDeliveryTime(opt.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7,
                    border: `1px solid ${deliveryTime === opt.value ? "#c7d2fe" : "#e5e7eb"}`,
                    background: deliveryTime === opt.value ? "#eef2ff" : "#fff",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{
                    width: 14, height: 14, borderRadius: "50%", border: `2px solid ${deliveryTime === opt.value ? "#4F46E5" : "#d1d5db"}`,
                    background: deliveryTime === opt.value ? "#4F46E5" : "#fff",
                    display: "inline-block", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: deliveryTime === opt.value ? "#4F46E5" : "#374151", fontWeight: deliveryTime === opt.value ? 600 : 400 }}>{opt.label}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              Reports delivered via WhatsApp to each client
            </div>
          </div>

          {/* AI cost summary */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>AI Cost Today</h2>
              <Link href="/reports/costs" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>Full Report →</Link>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
              ₪{systemStats.aiSpendToday.toFixed(2)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { label: "Haiku 4.5 (Replies)", pct: 39, color: "#0891b2" },
                { label: "Sonnet 4.6 (QA + Opt)", pct: 54, color: "#7c3aed" },
                { label: "Opus 4.6 (Briefing)", pct: 7, color: "#d97706" },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{m.label}</span>
                    <span style={{ fontSize: 12, color: m.color, fontWeight: 600 }}>{m.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${m.pct}%`, height: "100%", background: m.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 10px" }}>Report Status</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Total clients", value: mockClients.length },
                { label: "Reports ready", value: readyCount },
                { label: "Sent this week", value: sendAllConfirmed ? totalClients : 0 },
                { label: "Pending approval", value: 0 },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Send All Confirmation Modal */}
      {sendAllOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>Send {totalClients} reports?</h3>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>The following clients require manual review before sending:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
              {redOrangeClients.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#fef2f2", borderRadius: 7, border: "1px solid #fca5a5" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Review manually first</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setSendAllOpen(false)}
                style={{ fontSize: 12, padding: "8px 16px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendAllConfirm}
                style={{ fontSize: 12, padding: "8px 16px", borderRadius: 7, border: "none", background: "#059669", color: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, width: 200, height: 60,
          background: "#059669", color: "#fff", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 600, zIndex: 2000,
          boxShadow: "0 4px 20px rgba(5,150,105,0.4)",
        }}>
          {totalClients} reports queued for delivery
        </div>
      )}
    </div>
  );
}
