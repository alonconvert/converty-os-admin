"use client";

import { useState } from "react";
import { mockClients, agencyHealthScore, type ChurnTier } from "@/lib/mock-data";
import Link from "next/link";

const TIER_CONFIG: Record<ChurnTier, { label: string; bg: string; border: string; color: string; dot: string }> = {
  green:  { label: "Healthy",   bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", dot: "#22c55e" },
  yellow: { label: "Watch",     bg: "#fefce8", border: "#fde68a", color: "#92400e", dot: "#eab308" },
  orange: { label: "At Risk",   bg: "#fff7ed", border: "#fed7aa", color: "#9a3412", dot: "#f97316" },
  red:    { label: "Critical",  bg: "#fef2f2", border: "#fecaca", color: "#991b1b", dot: "#ef4444" },
};

const DIM_CONFIG = [
  { key: "engagement" as const, label: "Engagement",   weight: "25%", color: "#6366f1" },
  { key: "performance" as const, label: "Performance", weight: "25%", color: "#0891b2" },
  { key: "tone" as const, label: "Tone Quality",       weight: "20%", color: "#8b5cf6" },
  { key: "payment" as const, label: "Payment",         weight: "15%", color: "#059669" },
  { key: "nps" as const, label: "NPS",                 weight: "15%", color: "#d97706" },
];

function RadarBars({ dims, compact }: { dims: Record<string, number>; compact?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 3 : 5 }}>
      {DIM_CONFIG.map((d) => {
        const val = dims[d.key] ?? 0;
        const color = val >= 75 ? d.color : val >= 50 ? "#d97706" : "#ef4444";
        return (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: compact ? 9 : 10, color: "#6b7280", width: compact ? 68 : 80, flexShrink: 0 }}>{d.label}</span>
            <div style={{ flex: 1, height: compact ? 4 : 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: compact ? 9 : 10, fontWeight: 700, color, width: 24, textAlign: "right" }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
}

function ScoreRing({ score, tier }: { score: number; tier: ChurnTier }) {
  const cfg = TIER_CONFIG[tier];
  const size = 64, cx = 32, cy = 32, r = 26;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={5} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={cfg.dot}
          strokeWidth={5}
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: cfg.dot, fontFamily: "'DM Serif Display', serif", lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

export default function ClientHealthDashboard() {
  const [selectedTier, setSelectedTier] = useState<ChurnTier | "all">("all");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const tierCounts = {
    green: mockClients.filter((c) => c.churnTier === "green").length,
    yellow: mockClients.filter((c) => c.churnTier === "yellow").length,
    orange: mockClients.filter((c) => c.churnTier === "orange").length,
    red: mockClients.filter((c) => c.churnTier === "red").length,
  };

  const filtered = selectedTier === "all" ? mockClients : mockClients.filter((c) => c.churnTier === selectedTier);

  // Agency-level averages
  const avgDims = DIM_CONFIG.reduce((acc, d) => {
    acc[d.key] = Math.round(mockClients.reduce((s, c) => s + c.healthDimensions[d.key], 0) / mockClients.length);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: "18px 20px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Link href="/clients" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none" }}>Clients</Link>
            <span style={{ fontSize: 11, color: "#d1d5db" }}>›</span>
            <span style={{ fontSize: 11, color: "#374151" }}>Health Dashboard</span>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Client Health Dashboard</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Churn risk, 5-dimension health scores, renewal radar</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>Agency Health</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: agencyHealthScore >= 75 ? "#16a34a" : agencyHealthScore >= 50 ? "#d97706" : "#dc2626", fontFamily: "'DM Serif Display', serif" }}>
            {agencyHealthScore}
          </div>
        </div>
      </div>

      {/* Churn risk quadrant */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {(["green", "yellow", "orange", "red"] as ChurnTier[]).map((tier) => {
          const cfg = TIER_CONFIG[tier];
          const clients = mockClients.filter((c) => c.churnTier === tier);
          const active = selectedTier === tier;
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier(active ? "all" : tier)}
              style={{
                background: active ? cfg.bg : "#fff",
                border: `2px solid ${active ? cfg.dot : cfg.border}`,
                borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: cfg.dot, fontFamily: "'DM Serif Display', serif", lineHeight: 1.1 }}>
                {tierCounts[tier]}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                {clients.slice(0, 2).map((c) => c.name).join(", ")}{clients.length > 2 ? ` +${clients.length - 2}` : ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Agency avg dimensions */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Agency Average — Health Dimensions</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {DIM_CONFIG.map((d) => (
              <span key={d.key} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "#f3f4f6", color: "#6b7280" }}>{d.label} {d.weight}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {DIM_CONFIG.map((d) => {
            const val = avgDims[d.key];
            const color = val >= 75 ? d.color : val >= 50 ? "#d97706" : "#ef4444";
            return (
              <div key={d.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{val}</span>
                </div>
                <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proactive care queue */}
      {(() => {
        const quietHealthy = mockClients.filter(
          (c) => c.churnTier === "green" && c.lastInteractionDays >= 7 && c.status === "active"
        );
        if (quietHealthy.length === 0) return null;
        return (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>★ Proactive Care Queue</span>
              <span style={{ fontSize: 11, color: "#3b82f6" }}>— {quietHealthy.length} quiet, healthy clients who haven&apos;t heard from you lately</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {quietHealthy.map((c) => (
                <div key={c.id} style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 7, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#111827", fontFamily: "Heebo, sans-serif" }}>{c.name}</span>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{c.lastInteractionDays}d no touch</span>
                  <button style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "none", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                    Send Update
                  </button>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#3b82f6", marginTop: 8 }}>
              Per PRD: &ldquo;Quiet clients — the best clients — receive the most proactive care.&rdquo; Deliver a gift before they think to ask.
            </div>
          </div>
        );
      })()}

      {/* Client cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
            Client Health Breakdown
            {selectedTier !== "all" && (
              <span style={{ marginLeft: 8, fontSize: 11, color: TIER_CONFIG[selectedTier].dot }}>
                — {TIER_CONFIG[selectedTier].label} only
              </span>
            )}
          </h2>
          {selectedTier !== "all" && (
            <button onClick={() => setSelectedTier("all")} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>
              Show all
            </button>
          )}
        </div>
        {filtered.map((client, i) => {
          const tierCfg = TIER_CONFIG[client.churnTier];
          const expanded = expandedClient === client.id;
          const warnings = [];
          if (client.renewalDays < 14) warnings.push(`Renewal in ${client.renewalDays}d`);
          if (client.lastInteractionDays > 14) warnings.push(`No contact ${client.lastInteractionDays}d`);
          if (client.churnTier === "red") warnings.push("Critical — intervention needed");

          return (
            <div key={client.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div
                onClick={() => setExpandedClient(expanded ? null : client.id)}
                style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
              >
                <ScoreRing score={client.healthScore} tier={client.churnTier} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", fontFamily: "Heebo, sans-serif" }}>{client.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: tierCfg.bg, color: tierCfg.color }}>{tierCfg.label}</span>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{client.domain}</span>
                  </div>
                  {warnings.length > 0 && (
                    <div style={{ display: "flex", gap: 5, marginBottom: 4 }}>
                      {warnings.map((w) => (
                        <span key={w} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#fef2f2", color: "#dc2626", fontWeight: 600 }}>⚠ {w}</span>
                      ))}
                    </div>
                  )}
                  <RadarBars dims={client.healthDimensions} compact />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, textAlign: "right" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>Monthly Budget</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>₪{client.monthlyBudget.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>Renewal</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: client.renewalDays < 14 ? "#dc2626" : "#374151" }}>{client.renewalDays}d</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#d1d5db" }}>{expanded ? "▲" : "▼"}</span>
              </div>

              {expanded && (
                <div style={{ padding: "0 16px 16px 94px", borderTop: "1px solid #f9fafb" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginBottom: 8 }}>HEALTH DIMENSIONS — FULL VIEW</div>
                      <RadarBars dims={client.healthDimensions} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginBottom: 8 }}>KEY METRICS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[
                          { label: "Trust Score", value: `${client.trustScore} (${client.level})` },
                          { label: "Leads Today", value: client.leadsToday },
                          { label: "CPL Target", value: `₪${client.cplTarget}` },
                          { label: "Credit", value: `₪${client.clientCredit}` },
                          { label: "Campaigns", value: client.campaigns },
                        ].map((m) => (
                          <div key={m.label} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: "#6b7280" }}>{m.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {client.churnTier === "red" || client.churnTier === "orange" ? (
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                        Schedule Intervention Call
                      </button>
                      <button style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>
                        Generate Health Report
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>
                        Generate Health Report
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
