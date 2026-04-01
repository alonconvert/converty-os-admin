"use client";

import { useState } from "react";
import { mockClients, systemStats } from "@/lib/mock-data";
import Link from "next/link";

const WEEK_LABEL = "Apr 1–7, 2026";

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

const DELIVERY_OPTIONS = [
  { label: "Sunday before 09:30 IST ✓", value: "sun_09", active: true },
  { label: "Sunday before 08:00 IST", value: "sun_08", active: false },
  { label: "Monday before 09:30 IST", value: "mon_09", active: false },
  { label: "Custom", value: "custom", active: false },
];

export default function Reports() {
  const [deliveryTime, setDeliveryTime] = useState("sun_09");
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);

  const filtered = mockClients.filter((c) => c.name.includes(search) || c.domain.includes(search));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1500);
  };

  return (
    <div style={{ padding: "18px 20px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Reports</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Weekly AI-generated performance reports — {WEEK_LABEL}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link
            href="/reports/costs"
            style={{ fontSize: 11, padding: "6px 12px", borderRadius: 6, background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff", textDecoration: "none", fontWeight: 600 }}
          >
            🤖 AI Cost Report →
          </Link>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Total Leads", value: systemStats.leadsToday * 7, sub: "this week", color: "#4F46E5" },
          { label: "Avg CPL", value: `₪${systemStats.monthlyCpl}`, sub: `target ₪${systemStats.monthlyCplTarget}`, color: systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#059669" : "#dc2626" },
          { label: "Total Spend", value: `₪${(systemStats.monthlySpend / 4).toLocaleString()}`, sub: "week est.", color: "#111827" },
          { label: "Reports Ready", value: `0/${mockClients.length}`, sub: "click generate", color: "#9ca3af" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color, fontFamily: "'DM Serif Display', serif" }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12 }}>
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
              return (
                <div key={client.id} style={{ padding: "12px 14px", borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Status dot */}
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: client.status === "active" ? "#22c55e" : "#d1d5db", flexShrink: 0 }} />

                  {/* Name + domain */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", fontFamily: "Heebo, sans-serif" }}>{client.name}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{client.domain} · {WEEK_LABEL}</div>
                  </div>

                  {/* Sparkline */}
                  <Sparkline data={client.leadsWeekly} color={cplOk ? "#4F46E5" : "#f59e0b"} />

                  {/* Metrics */}
                  <div style={{ display: "flex", gap: 14 }}>
                    {[
                      { label: "Leads", value: weeklyLeads },
                      { label: "CPL", value: `₪${cpl}`, alert: !cplOk },
                      { label: "Budget", value: `₪${weeklyBudget.toLocaleString()}` },
                    ].map((m) => (
                      <div key={m.label} style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: m.alert ? "#dc2626" : "#111827" }}>{m.value}</div>
                        <div style={{ fontSize: 9, color: "#9ca3af" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button style={{ fontSize: 10, padding: "4px 8px", borderRadius: 5, border: "none", background: "#eef2ff", color: "#4F46E5", cursor: "pointer", fontWeight: 600 }}>
                      View
                    </button>
                    <button style={{ fontSize: 10, padding: "4px 8px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>
                      Send
                    </button>
                    <button style={{ fontSize: 10, padding: "4px 8px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>
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
            <div style={{ marginTop: 10, fontSize: 10, color: "#9ca3af", textAlign: "center" }}>
              Reports delivered via WhatsApp to each client
            </div>
          </div>

          {/* AI cost summary */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>AI Cost Today</h2>
              <Link href="/reports/costs" style={{ fontSize: 10, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>Full Report →</Link>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", fontFamily: "'DM Serif Display', serif", marginBottom: 6 }}>
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
                    <span style={{ fontSize: 10, color: "#6b7280" }}>{m.label}</span>
                    <span style={{ fontSize: 10, color: m.color, fontWeight: 600 }}>{m.pct}%</span>
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
                { label: "Reports ready", value: 0 },
                { label: "Sent this week", value: 0 },
                { label: "Pending approval", value: 0 },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{r.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
