"use client";

import { useState } from "react";
import { mockCampaigns } from "@/lib/mock-data";
import type { CampaignRiskTier } from "@/lib/mock-data";

// ── Helpers ──────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<CampaignRiskTier, { bg: string; color: string; label: string; border: string }> = {
  autonomous: { bg: "#f0fdf4", color: "#16a34a", label: "Autonomous", border: "#bbf7d0" },
  approve_24h: { bg: "#fffbeb", color: "#d97706", label: "24h Approve", border: "#fde68a" },
  immediate: { bg: "#fef2f2", color: "#dc2626", label: "Immediate", border: "#fca5a5" },
};

function CPLSparkline({ data, target }: { data: number[]; target: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data, target) - 5;
  const max = Math.max(...data, target) + 5;
  const range = max - min || 1;
  const w = 64, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const last = data[data.length - 1];
  const color = last <= target ? "#16a34a" : "#dc2626";
  const targetY = h - ((target - min) / range) * (h - 4) - 2;

  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <line x1="0" y1={targetY} x2={w} y2={targetY} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,2" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Action modal ─────────────────────────────────────────────────────────────

const CAMPAIGN_ACTIONS = [
  { label: "Bid adjustment ≤15%", riskTier: "autonomous" as CampaignRiskTier, desc: "Adjust bids by up to ±15%" },
  { label: "Add negative keywords", riskTier: "autonomous" as CampaignRiskTier, desc: "Add to negative keyword list" },
  { label: "Ad scheduling adjust", riskTier: "autonomous" as CampaignRiskTier, desc: "Modify ad scheduling" },
  { label: "Keyword match type change", riskTier: "autonomous" as CampaignRiskTier, desc: "Broad → Phrase → Exact" },
  { label: "Budget shift (same total)", riskTier: "approve_24h" as CampaignRiskTier, desc: "Move budget between campaigns" },
  { label: "Pause ad group", riskTier: "approve_24h" as CampaignRiskTier, desc: "Pause a specific ad group" },
  { label: "Add ad variation", riskTier: "approve_24h" as CampaignRiskTier, desc: "Add new ad copy variant" },
  { label: "Pause entire campaign", riskTier: "immediate" as CampaignRiskTier, desc: "Stop all ads for this campaign" },
  { label: "Change bidding strategy", riskTier: "immediate" as CampaignRiskTier, desc: "e.g. Manual → Target CPA" },
  { label: "Budget increase", riskTier: "immediate" as CampaignRiskTier, desc: "Any budget increase amount" },
  { label: "Targeting audience change", riskTier: "immediate" as CampaignRiskTier, desc: "Modify audience targeting" },
];

function ActionModal({ campaignName, onClose }: { campaignName: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12, width: 460, maxHeight: "80vh", overflowY: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Campaign Actions</h3>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>{campaignName}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: "8px 0" }}>
          {(["autonomous", "approve_24h", "immediate"] as CampaignRiskTier[]).map((tier) => {
            const rc = RISK_COLORS[tier];
            const actions = CAMPAIGN_ACTIONS.filter((a) => a.riskTier === tier);
            return (
              <div key={tier}>
                <div style={{ padding: "8px 18px 4px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {rc.label}
                </div>
                {actions.map((action) => (
                  <div
                    key={action.label}
                    style={{
                      padding: "8px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={onClose}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{action.label}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{action.desc}</div>
                    </div>
                    <span style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 99, fontWeight: 700,
                      background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
                      whiteSpace: "nowrap",
                    }}>
                      {rc.label}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Campaigns() {
  const [platform, setPlatform] = useState("All Platforms");
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const filtered = mockCampaigns.filter((c) => {
    if (platform === "Google Ads" && c.platform !== "google") return false;
    if (platform === "Meta" && c.platform !== "meta") return false;
    return true;
  });

  const totalSpend = filtered.reduce((s, c) => s + c.spend, 0);
  const totalBudget = filtered.reduce((s, c) => s + c.budget, 0);
  const totalLeads = filtered.reduce((s, c) => s + c.leads, 0);
  const avgCpl = Math.round(totalSpend / Math.max(1, totalLeads));

  const pendingChanges = mockCampaigns.filter((c) => c.pendingAiChange && !dismissed.includes(c.id));

  return (
    <div style={{ padding: "18px 20px", maxWidth: 1440 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Campaigns</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {mockCampaigns.length} campaigns · Google + Meta
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            style={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 9px", background: "#fff" }}
          >
            <option>All Platforms</option>
            <option>Google Ads</option>
            <option>Meta</option>
          </select>
          <button style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#374151" }}>
            ↺ Sync Now
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Total Spend (MTD)", value: `₪${totalSpend.toLocaleString()}`, sub: `of ₪${totalBudget.toLocaleString()} budget`, ltr: true },
          { label: "Total Leads (MTD)", value: totalLeads, sub: `avg CPL ₪${avgCpl}`, ltr: false },
          { label: "Budget Used", value: `${Math.round((totalSpend / totalBudget) * 100)}%`, sub: "of monthly allocation", ltr: true },
          { label: "AI Change Queue", value: pendingChanges.length, sub: "pending your approval", urgent: pendingChanges.length > 0, ltr: false },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff", borderRadius: 8, border: `1px solid ${(s as { urgent?: boolean }).urgent ? "#fca5a5" : "#e5e7eb"}`,
              padding: "11px 14px",
            }}
          >
            <div className="num-display" dir={s.ltr ? "ltr" : "auto"} style={{ fontSize: 22, fontWeight: 700, color: (s as { urgent?: boolean }).urgent ? "#dc2626" : "#111827" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 3 }}>{s.label}</div>
            <div dir={s.ltr ? "ltr" : "auto"} style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* AI Change Approval Queue */}
      {pendingChanges.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #fde68a", marginBottom: 14, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #fef3c7", background: "#fffbeb", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>AI Campaign Changes — Pending Approval</span>
            <span style={{ fontSize: 10, background: "#f59e0b", color: "#fff", fontWeight: 700, padding: "1px 6px", borderRadius: 99 }}>{pendingChanges.length}</span>
          </div>
          {pendingChanges.map((camp) => {
            if (!camp.pendingAiChange) return null;
            const change = camp.pendingAiChange;
            const rc = RISK_COLORS[change.riskTier];
            return (
              <div
                key={camp.id}
                style={{ padding: "12px 14px", borderBottom: "1px solid #fef9c3", display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{camp.name}</span>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{camp.clientName}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, fontWeight: 700, background: rc.bg, color: rc.color }}>
                      {rc.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#374151" }}>{change.description}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
                    <span dir="ltr">{change.current}</span>
                    <span style={{ margin: "0 6px", color: "#d1d5db" }}>→</span>
                    <span dir="ltr" style={{ fontWeight: 600, color: "#4F46E5" }}>{change.proposed}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, fontStyle: "italic" }}>{change.reasoning}</div>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <button
                    onClick={() => setDismissed((p) => [...p, camp.id])}
                    style={{ fontSize: 11, padding: "4px 10px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600 }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setDismissed((p) => [...p, camp.id])}
                    style={{ fontSize: 11, padding: "4px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 5, cursor: "pointer" }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
              {["Campaign", "Client", "Platform", "Risk Tier", "Spend / Budget", "CPL (7d trend)", "Status", "AI Action", "Actions"].map((h) => (
                <th key={h} style={{
                  textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700,
                  color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((camp) => {
              const usage = Math.round((camp.spend / camp.budget) * 100);
              const rc = RISK_COLORS[camp.riskTier];
              const cplOk = camp.cpl <= camp.cplTarget;

              return (
                <tr
                  key={camp.id}
                  className="hoverable"
                  style={{ borderBottom: "1px solid #f9fafb" }}
                >
                  {/* Campaign name */}
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{camp.name}</div>
                    {camp.learningPhase && (
                      <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#f0f9ff", color: "#0284c7", fontWeight: 700, display: "inline-block", marginTop: 2 }}>
                        🎓 LEARNING
                      </span>
                    )}
                  </td>

                  {/* Client */}
                  <td style={{ padding: "10px 12px", fontSize: 11, color: "#6b7280" }}>{camp.clientName}</td>

                  {/* Platform */}
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      fontSize: 10, padding: "2px 6px", borderRadius: 99, fontWeight: 600,
                      background: camp.platform === "google" ? "#eff6ff" : "#f5f3ff",
                      color: camp.platform === "google" ? "#2563eb" : "#7c3aed",
                    }}>
                      {camp.platform === "google" ? "🔵 Google" : "🟣 Meta"}
                    </span>
                    {camp.qualityScore && (
                      <div style={{ fontSize: 9, color: camp.qualityScore >= 7 ? "#16a34a" : "#d97706", marginTop: 2 }}>
                        QS: {camp.qualityScore}/10
                      </div>
                    )}
                  </td>

                  {/* Risk tier */}
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 99, fontWeight: 700,
                      background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
                    }}>
                      {rc.label}
                    </span>
                  </td>

                  {/* Spend / budget */}
                  <td style={{ padding: "10px 12px" }}>
                    <div dir="ltr" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                      ₪{camp.spend.toLocaleString()}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <div style={{ width: 50, height: 3, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          width: `${usage}%`, height: "100%", borderRadius: 99,
                          background: usage >= 90 ? "#dc2626" : usage >= 70 ? "#d97706" : "#22c55e",
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{usage}%</span>
                    </div>
                    <div dir="ltr" style={{ fontSize: 9, color: "#d1d5db" }}>of ₪{camp.budget.toLocaleString()}</div>
                  </td>

                  {/* CPL + sparkline */}
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CPLSparkline data={camp.cplWeekly} target={camp.cplTarget} />
                      <div>
                        <div dir="ltr" style={{ fontSize: 12, fontWeight: 700, color: cplOk ? "#16a34a" : "#dc2626" }}>
                          ₪{camp.cpl}
                        </div>
                        <div dir="ltr" style={{ fontSize: 9, color: "#9ca3af" }}>
                          target ₪{camp.cplTarget}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      fontSize: 10, padding: "2px 6px", borderRadius: 99, fontWeight: 600,
                      background: camp.status === "active" ? "#f0fdf4" : "#f3f4f6",
                      color: camp.status === "active" ? "#16a34a" : "#6b7280",
                    }}>
                      {camp.status}
                    </span>
                  </td>

                  {/* AI last action */}
                  <td style={{ padding: "10px 12px" }}>
                    {camp.learningPhase ? (
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>Blocked — learning</span>
                    ) : camp.aiLastAction ? (
                      <div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{camp.aiLastAction}</div>
                        <div style={{ fontSize: 9, color: "#d1d5db" }}>{camp.aiLastActionDays}d ago</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, color: "#d1d5db" }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "10px 12px" }}>
                    <button
                      onClick={() => setActionModal(camp.name)}
                      style={{
                        fontSize: 10, padding: "4px 9px", borderRadius: 5,
                        background: "#f3f4f6", border: "1px solid #e5e7eb", cursor: "pointer", color: "#374151", fontWeight: 500,
                      }}
                    >
                      Actions ▾
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action modal */}
      {actionModal && <ActionModal campaignName={actionModal} onClose={() => setActionModal(null)} />}
    </div>
  );
}
