"use client";

import { useState } from "react";
import { mockClients, systemStats } from "@/lib/mock-data";
import Link from "next/link";

const DAILY_SPEND = [
  { date: "Mar 26", total: 2.10, haiku: 0.80, sonnet: 1.10, opus: 0.20 },
  { date: "Mar 27", total: 2.45, haiku: 0.90, sonnet: 1.30, opus: 0.25 },
  { date: "Mar 28", total: 1.90, haiku: 0.75, sonnet: 1.00, opus: 0.15 },
  { date: "Mar 29", total: 2.80, haiku: 1.00, sonnet: 1.50, opus: 0.30 },
  { date: "Mar 30", total: 2.20, haiku: 0.85, sonnet: 1.15, opus: 0.20 },
  { date: "Mar 31", total: 3.10, haiku: 1.20, sonnet: 1.60, opus: 0.30 },
  { date: "Apr 01", total: 2.40, haiku: 0.90, sonnet: 1.30, opus: 0.20 },
];

const AGENT_BREAKDOWN = [
  { agent: "Reply Drafter", model: "Haiku 4.5", calls: 142, avgCost: 0.006, total: 0.85, pct: 35 },
  { agent: "QA Reviewer", model: "Sonnet 4.6", calls: 58, avgCost: 0.018, total: 1.04, pct: 43 },
  { agent: "Morning Briefing", model: "Opus 4.6", calls: 1, avgCost: 0.14, total: 0.14, pct: 6 },
  { agent: "Trust Evaluator", model: "Haiku 4.5", calls: 28, avgCost: 0.003, total: 0.08, pct: 3 },
  { agent: "Campaign Optimizer", model: "Sonnet 4.6", calls: 14, avgCost: 0.018, total: 0.25, pct: 10 },
  { agent: "T4 Escalator", model: "Opus 4.6", calls: 2, avgCost: 0.03, total: 0.06, pct: 3 },
];

const CLIENT_COST = mockClients.map((c) => ({
  name: c.name,
  domain: c.domain,
  interactions: c.leadsToday * 3 + Math.floor(Math.random() * 5),
  costToday: +(c.leadsToday * 0.04 + Math.random() * 0.2).toFixed(2),
  costMonth: +(c.monthlyBudget * 0.002 + Math.random() * 0.5).toFixed(2),
  budget: c.monthlyBudget,
}));

const MODEL_CONFIG = {
  "Haiku 4.5": { color: "#0891b2", bg: "#ecfeff" },
  "Sonnet 4.6": { color: "#7c3aed", bg: "#faf5ff" },
  "Opus 4.6": { color: "#d97706", bg: "#fffbeb" },
};

function SpendChart({ data }: { data: typeof DAILY_SPEND }) {
  const maxVal = Math.max(...data.map((d) => d.total));
  const W = 520, H = 100, barW = 52, gap = 10;
  return (
    <svg width={W} height={H + 20} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const x = i * (barW + gap);
        const totalH = (d.total / maxVal) * H;
        const haikuH = (d.haiku / maxVal) * H;
        const sonnetH = (d.sonnet / maxVal) * H;
        const opusH = (d.opus / maxVal) * H;
        return (
          <g key={d.date}>
            {/* Stacked bars */}
            <rect x={x} y={H - haikuH} width={barW} height={haikuH} fill="#0891b2" opacity={0.8} rx={2} />
            <rect x={x} y={H - haikuH - sonnetH} width={barW} height={sonnetH} fill="#7c3aed" opacity={0.8} />
            <rect x={x} y={H - haikuH - sonnetH - opusH} width={barW} height={opusH} fill="#d97706" opacity={0.8} />
            {/* Total label */}
            <text x={x + barW / 2} y={H - totalH - 5} textAnchor="middle" fontSize={9} fill="#6b7280">
              ₪{d.total.toFixed(2)}
            </text>
            {/* Date label */}
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {d.date.slice(4)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AiCostReport() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  const totalToday = systemStats.aiSpendToday;
  const totalWeek = DAILY_SPEND.reduce((s, d) => s + d.total, 0);
  const totalMonth = totalWeek * 4.3;
  const monthlyBudget = 150;
  const budgetUsed = (totalMonth / monthlyBudget) * 100;

  const displayTotal = period === "today" ? totalToday : period === "week" ? totalWeek : totalMonth;

  return (
    <div style={{ padding: "18px 20px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Link href="/reports" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none" }}>Reports</Link>
            <span style={{ fontSize: 11, color: "#d1d5db" }}>›</span>
            <span style={{ fontSize: 11, color: "#374151" }}>AI Cost Report</span>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>AI Cost Report</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Claude API spend by agent, client, and model</p>
        </div>
        <div style={{ display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 7, padding: 2 }}>
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "none", cursor: "pointer", fontWeight: 600,
                background: period === p ? "#fff" : "transparent",
                color: period === p ? "#111827" : "#9ca3af",
                boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {p === "today" ? "Today" : p === "week" ? "7 Days" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "AI Spend", value: `₪${displayTotal.toFixed(2)}`, sub: period === "today" ? "today" : period === "week" ? "last 7 days" : "this month", alert: totalToday > 5 },
          { label: "Monthly Budget", value: `₪${monthlyBudget}`, sub: `${Math.round(budgetUsed)}% used`, alert: budgetUsed > 80 },
          { label: "Avg Cost/Lead", value: `₪${(totalToday / systemStats.leadsToday).toFixed(3)}`, sub: `${systemStats.leadsToday} leads today`, alert: false },
          { label: "Total API Calls", value: AGENT_BREAKDOWN.reduce((s, a) => s + a.calls, 0).toString(), sub: "all agents today", alert: false },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${kpi.alert ? "#fca5a5" : "#e5e7eb"}`, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: kpi.alert ? "#dc2626" : "#111827", fontFamily: "'DM Serif Display', serif", lineHeight: 1.1 }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: kpi.alert ? "#dc2626" : "#6b7280", marginTop: 3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12, marginBottom: 12 }}>
        {/* Daily spend chart */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Daily Spend — Last 7 Days</h2>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(MODEL_CONFIG).map(([model, cfg]) => (
                <div key={model} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, display: "inline-block" }} />
                  <span style={{ fontSize: 9, color: "#6b7280" }}>{model}</span>
                </div>
              ))}
            </div>
          </div>
          <SpendChart data={DAILY_SPEND} />
        </div>

        {/* Model breakdown */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Model Breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(MODEL_CONFIG).map(([model, cfg]) => {
              const agents = AGENT_BREAKDOWN.filter((a) => a.model === model);
              const modelTotal = agents.reduce((s, a) => s + a.total, 0);
              const modelPct = Math.round((modelTotal / totalToday) * 100);
              return (
                <div key={model} style={{ background: cfg.bg, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{model}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>₪{modelTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ width: `${modelPct}%`, height: "100%", background: cfg.color, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>{modelPct}% of total · {agents.reduce((s, a) => s + a.calls, 0)} calls</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent breakdown table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Cost by Agent</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Agent", "Model", "Calls", "Avg Cost", "Total", "Share"].map((h) => (
                <th key={h} style={{ padding: "8px 14px", textAlign: h === "Agent" ? "left" : "right", fontSize: 10, fontWeight: 600, color: "#9ca3af", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENT_BREAKDOWN.map((a, i) => {
              const cfg = MODEL_CONFIG[a.model as keyof typeof MODEL_CONFIG];
              return (
                <tr key={a.agent} style={{ borderBottom: i < AGENT_BREAKDOWN.length - 1 ? "1px solid #f9fafb" : "none" }}>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: "#111827", fontWeight: 500 }}>{a.agent}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right" }}>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{a.model}</span>
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12, color: "#374151" }}>{a.calls}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12, color: "#374151" }}>₪{a.avgCost.toFixed(3)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#111827" }}>₪{a.total.toFixed(2)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                      <div style={{ width: 40, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${a.pct}%`, height: "100%", background: cfg.color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#6b7280" }}>{a.pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cost by client */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Cost by Client</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Client", "Interactions", "AI Cost Today", "AI Cost Month", "Cost % of Budget"].map((h) => (
                <th key={h} style={{ padding: "8px 14px", textAlign: h === "Client" ? "left" : "right", fontSize: 10, fontWeight: 600, color: "#9ca3af", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENT_COST.sort((a, b) => b.costMonth - a.costMonth).map((c, i) => {
              const budgetPct = (c.costMonth / (c.budget * 0.01)) * 100;
              const pctColor = budgetPct > 1.5 ? "#dc2626" : budgetPct > 1 ? "#d97706" : "#059669";
              return (
                <tr key={c.name} style={{ borderBottom: i < CLIENT_COST.length - 1 ? "1px solid #f9fafb" : "none" }}>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: "#111827", fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12, color: "#374151" }}>{c.interactions}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12, color: "#374151" }}>₪{c.costToday.toFixed(2)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#111827" }}>₪{c.costMonth.toFixed(2)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: pctColor }}>{budgetPct.toFixed(2)}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
