"use client";

import { useState } from "react";
import { mockCampaigns, canaryDeployment } from "@/lib/mock-data";
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

// ── 5-state Campaign Status Chip ──────────────────────────────────────────────

function CampaignStatusChip({ status, learningPhase, pendingChange, budgetPct }: {
  status: string;
  learningPhase: boolean;
  pendingChange: boolean;
  budgetPct: number;
}) {
  if (budgetPct >= 95) {
    return (
      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 99, fontWeight: 700, background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", whiteSpace: "nowrap" }}>
        BUDGET EXHAUSTED
      </span>
    );
  }
  if (learningPhase) {
    return (
      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, fontWeight: 700, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
        🎓 LEARNING
      </span>
    );
  }
  if (pendingChange) {
    return (
      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, fontWeight: 700, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
        ⏳ PENDING
      </span>
    );
  }
  if (status === "active") {
    return (
      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
        ● ACTIVE
      </span>
    );
  }
  return (
    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, fontWeight: 700, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}>
      ⏸ PAUSED
    </span>
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
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [canaryToast, setCanaryToast] = useState<string | null>(null);

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

  // Budget Pace calculations
  const daysElapsed = 14;
  const daysInMonth = 30;
  const pacePct = Math.round((daysElapsed / daysInMonth) * 100);
  const spendPct = Math.round((totalSpend / totalBudget) * 100);
  const paceDelta = spendPct - pacePct;

  const paceBorderColor =
    paceDelta > 10 ? "#fca5a5" :
    paceDelta < -10 ? "#fde68a" :
    "#e5e7eb";

  const paceSubColor =
    Math.abs(paceDelta) <= 5 ? "#16a34a" :
    paceDelta > 5 ? "#dc2626" :
    "#d97706";

  const paceSubText =
    Math.abs(paceDelta) <= 5 ? "On pace ✓" :
    paceDelta > 5 ? `Overpacing +${paceDelta}% ⚠` :
    `Underpacing ${paceDelta}%`;

  function showCanaryToast(msg: string) {
    setCanaryToast(msg);
    setTimeout(() => setCanaryToast(null), 2000);
  }

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
        {/* Total Spend */}
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: "11px 14px" }}>
          <div className="num-display" dir="ltr" style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
            ₪{totalSpend.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 3 }}>Total Spend (MTD)</div>
          <div dir="ltr" style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>of ₪{totalBudget.toLocaleString()} budget</div>
        </div>

        {/* Total Leads */}
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: "11px 14px" }}>
          <div className="num-display" style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
            {totalLeads}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 3 }}>Total Leads (MTD)</div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>avg CPL ₪{avgCpl}</div>
        </div>

        {/* Budget Pace */}
        <div style={{ background: "#fff", borderRadius: 8, border: `1px solid ${paceBorderColor}`, padding: "11px 14px" }}>
          <div className="num-display" dir="ltr" style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
            {spendPct}%
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 3 }}>Budget Pace</div>
          <div style={{ fontSize: 10, color: paceSubColor, marginTop: 2, fontWeight: 600 }}>{paceSubText}</div>
        </div>

        {/* AI Change Queue */}
        <div style={{ background: "#fff", borderRadius: 8, border: `1px solid ${pendingChanges.length > 0 ? "#fca5a5" : "#e5e7eb"}`, padding: "11px 14px" }}>
          <div className="num-display" style={{ fontSize: 22, fontWeight: 700, color: pendingChanges.length > 0 ? "#dc2626" : "#111827" }}>
            {pendingChanges.length}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 3 }}>AI Change Queue</div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>pending your approval</div>
        </div>
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

      {/* Canary Rollout Banner */}
      {canaryDeployment.active && (
        <div style={{
          background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8,
          padding: "10px 14px", marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>
              ⚗ CANARY ACTIVE — {canaryDeployment.version} deployed to {canaryDeployment.clients.length} clients · {canaryDeployment.hoursRemaining}h elapsed
            </span>
            <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 12 }}>
              Approval rate{" "}
              <span style={{ fontWeight: 700, color: canaryDeployment.approvalRate >= canaryDeployment.baselineApprovalRate ? "#16a34a" : "#dc2626" }}>
                {canaryDeployment.approvalRate}%
              </span>
              {" "}vs baseline {canaryDeployment.baselineApprovalRate}%
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => showCanaryToast("Promoting canary to full rollout...")}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontWeight: 600 }}
            >
              Promote Now
            </button>
            <button
              onClick={() => showCanaryToast("Rolling back canary deployment...")}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}
            >
              Rollback
            </button>
          </div>
        </div>
      )}

      {/* Campaign table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
              {["Campaign", "Client", "Platform", "Risk Tier", "Spend / Budget", "ETA", "CPL (7d trend)", "Status", "AI Action", "Actions"].map((h) => (
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
              const isExpanded = expandedAction === camp.id;

              // ETA calculation
              const dailySpend = camp.spend / 14;
              const remainingBudget = camp.budget - camp.spend;
              const daysLeft = dailySpend > 0 ? remainingBudget / dailySpend : 999;

              const etaColor = daysLeft <= 2 ? "#dc2626" : daysLeft <= 5 ? "#d97706" : camp.learningPhase ? "#9ca3af" : "#16a34a";
              const etaText = camp.learningPhase ? "—" : daysLeft <= 2 ? `${Math.round(daysLeft)}d ⚠` : daysLeft <= 5 ? `${Math.round(daysLeft)}d` : `~${Math.round(daysLeft)}d`;

              return (
                <tr
                  key={camp.id}
                  className="hoverable"
                  style={{ borderBottom: "1px solid #f9fafb" }}
                >
                  {/* Campaign name */}
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{camp.name}</div>
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

                  {/* ETA column */}
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: etaColor }}>
                      {etaText}
                    </span>
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

                  {/* Status — 5-state chip */}
                  <td style={{ padding: "10px 12px" }}>
                    <CampaignStatusChip
                      status={camp.status}
                      learningPhase={camp.learningPhase}
                      pendingChange={!!camp.pendingAiChange}
                      budgetPct={usage}
                    />
                  </td>

                  {/* AI last action — expandable chip */}
                  <td style={{ padding: "10px 12px", position: "relative", minWidth: 160 }}>
                    {camp.learningPhase ? (
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>Blocked — learning</span>
                    ) : camp.aiLastAction ? (
                      <div>
                        <button
                          onClick={() => setExpandedAction(isExpanded ? null : camp.id)}
                          style={{
                            fontSize: 11, color: "#4F46E5", background: "#eef2ff",
                            border: "1px solid #c7d2fe", borderRadius: 5,
                            padding: "2px 8px", cursor: "pointer", fontWeight: 600,
                            textAlign: "left", display: "block",
                          }}
                        >
                          {camp.aiLastAction} ▾
                        </button>
                        <div style={{ fontSize: 9, color: "#d1d5db", marginTop: 2 }}>{camp.aiLastActionDays}d ago</div>

                        {isExpanded && (
                          <div style={{
                            position: "absolute", left: 0, top: "100%", zIndex: 20,
                            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6,
                            padding: "8px 10px", width: 240, boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Action Log</span>
                              <button
                                onClick={() => setExpandedAction(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 13, lineHeight: 1 }}
                              >
                                ×
                              </button>
                            </div>
                            <div style={{ fontSize: 11, color: "#374151", marginBottom: 3 }}>
                              <strong>Action:</strong> {camp.aiLastAction}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                              <strong>Time:</strong> {camp.aiLastActionDays}d ago
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                              <strong>Reasoning:</strong> Bid adjustment based on 7-day CPL trend above target by 8%.
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                              <strong>Pre:</strong> CPL ₪{camp.cplTarget + 5} → <strong>Post:</strong> CPL ₪{camp.cpl}
                            </div>
                            <button
                              onClick={() => setExpandedAction(null)}
                              style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", cursor: "pointer" }}
                            >
                              Rollback
                            </button>
                          </div>
                        )}
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

      {/* Canary toast */}
      {canaryToast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#111827", color: "#fff", fontSize: 13, fontWeight: 600,
          padding: "10px 18px", borderRadius: 8, zIndex: 100,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}>
          {canaryToast}
        </div>
      )}
    </div>
  );
}
