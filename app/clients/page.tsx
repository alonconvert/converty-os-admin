"use client";

import { useState, useRef } from "react";
import { mockClients, systemStats } from "@/lib/mock-data";

type Client = (typeof mockClients)[number];
type ChurnTier = "green" | "yellow" | "orange" | "red";

// ── Color helpers ────────────────────────────────────────────────────────────

const trustColors = {
  Autonomous: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  SemiAuto: { bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  Supervised: { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5" },
};

const healthColors: Record<ChurnTier, { bg: string; text: string; border: string; label: string }> = {
  green: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", label: "Healthy" },
  yellow: { bg: "#fefce8", text: "#ca8a04", border: "#fde68a", label: "Watch" },
  orange: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", label: "Alert" },
  red: { bg: "#fff1f2", text: "#be123c", border: "#fecdd3", label: "Critical" },
};

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 50, h = 20;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Kill Switch ──────────────────────────────────────────────────────────────

function KillSwitch({ clientId, isKilled, onToggle }: { clientId: string; isKilled: boolean; onToggle: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const startHold = () => {
    setHolding(true);
    timerRef.current = setTimeout(() => { onToggle(clientId); setHolding(false); }, 1000);
  };
  const cancelHold = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setHolding(false);
  };
  const active = !isKilled;

  return (
    <button
      onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
      onTouchStart={startHold} onTouchEnd={cancelHold}
      aria-label={active ? "Kill AI" : "Restore AI"}
      title="Hold 1s to toggle"
      style={{
        position: "relative", display: "inline-flex", alignItems: "center",
        width: 38, height: 20, borderRadius: 10,
        background: holding ? "#f59e0b" : active ? "#22c55e" : "#ef4444",
        border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
        outline: holding ? "2px solid #f59e0b" : "none", outlineOffset: 2,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", left: active ? 19 : 2, width: 16, height: 16,
        borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

// ── Health score bar ─────────────────────────────────────────────────────────

function HealthDimBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  const color = value >= 70 ? "#059669" : value >= 50 ? "#ca8a04" : value >= 30 ? "#ea580c" : "#be123c";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
      <span style={{ color: "#6b7280", width: 80, flexShrink: 0 }}>{label} <span style={{ color: "#d1d5db" }}>({weight}%)</span></span>
      <div style={{ flex: 1, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99 }} />
      </div>
      <span style={{ color, fontWeight: 700, width: 24, textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ── Trust breakdown popover ──────────────────────────────────────────────────

function TrustPopover({ client, onClose }: { client: Client; onClose: () => void }) {
  const { trustBreakdown } = client;
  const items = [
    { label: "Approved", value: trustBreakdown.approved, pos: true },
    { label: "Minor corrections", value: trustBreakdown.minorCorrections, pos: false },
    { label: "Significant edits", value: trustBreakdown.significantEdits, pos: false },
    { label: "Rejections", value: trustBreakdown.rejections, pos: false },
    { label: "Factual errors", value: trustBreakdown.factualErrors, pos: false },
    { label: "Complaints", value: trustBreakdown.complaints, pos: false },
    { label: "Time decay", value: trustBreakdown.decay, pos: false },
  ].filter((i) => i.value !== 0);

  return (
    <div
      style={{
        position: "absolute", top: "100%", left: 0, zIndex: 50, marginTop: 4,
        background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 14, width: 240,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>Score Breakdown</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>×</button>
      </div>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
          <span style={{ color: "#6b7280" }}>{item.label}</span>
          <span style={{ fontWeight: 700, color: item.value > 0 ? "#059669" : "#dc2626" }}>
            {item.value > 0 ? "+" : ""}{item.value}
          </span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 6, paddingTop: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Recent events</div>
        {client.trustBreakdown.lastEvents.slice(0, 3).map((ev, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "2px 0", color: "#6b7280" }}>
            <span>{ev.event}</span>
            <span style={{ color: ev.delta > 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>
              {ev.delta > 0 ? "+" : ""}{ev.delta}
            </span>
          </div>
        ))}
      </div>
      {client.hysteresisBuffer && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#7c3aed", background: "#faf5ff", borderRadius: 4, padding: "3px 6px" }}>
          Protected until score &lt;{client.trustScore - client.hysteresisBuffer}
        </div>
      )}
      {client.thresholdProximity && (
        <div style={{ marginTop: 4, fontSize: 10, color: "#d97706", background: "#fffbeb", borderRadius: 4, padding: "3px 6px" }}>
          {client.thresholdProximity} pts to next level
        </div>
      )}
    </div>
  );
}

// ── Client detail drawer ─────────────────────────────────────────────────────

function ClientDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  const tc = trustColors[client.level as keyof typeof trustColors];
  const hc = healthColors[client.churnTier as ChurnTier];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }}
      />
      <div
        className="drawer-open"
        style={{
          position: "relative", background: "#fff", width: 400, height: "100%",
          overflowY: "auto", boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{client.name}</h2>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {client.domain} · {client.campaigns} campaigns
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 20 }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600, background: tc.bg, color: tc.text }}>
              {client.level}
            </span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600, background: hc.bg, color: hc.text }}>
              {hc.label}
            </span>
            {client.status === "paused" && (
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600, background: "#f3f4f6", color: "#6b7280" }}>
                Paused
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Key metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { label: "Monthly budget", value: `₪${client.monthlyBudget.toLocaleString()}`, dir: "ltr" as const },
              { label: "Target CPL", value: `₪${client.cplTarget}`, dir: "ltr" as const },
              { label: "Leads today", value: client.leadsToday, dir: "auto" as const },
              { label: "Credit balance", value: client.clientCredit, dir: "auto" as const },
              { label: "Renews in", value: `${client.renewalDays}d`, dir: "auto" as const, urgent: client.renewalDays < 14 },
              { label: "Last interaction", value: client.lastInteractionDays === 0 ? "Today" : `${client.lastInteractionDays}d ago`, dir: "auto" as const, urgent: client.lastInteractionDays > 14 },
            ].map((m) => (
              <div key={m.label} style={{ background: "#f9fafb", borderRadius: 7, padding: "8px 10px", border: m.urgent ? "1px solid #fca5a5" : "none" }}>
                <div dir={m.dir} style={{ fontSize: 15, fontWeight: 700, color: m.urgent ? "#dc2626" : "#111827" }}>{m.value}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Trust score */}
          <div style={{ background: "#fafafa", borderRadius: 8, padding: "12px 14px", border: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Trust Score</span>
              <span className="num-display" style={{ fontSize: 22, fontWeight: 700, color: tc.text }}>{client.trustScore}</span>
            </div>
            <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${client.trustScore}%`, height: "100%", background: tc.text, borderRadius: 99 }} />
            </div>
            {client.thresholdProximity && (
              <div style={{ fontSize: 11, color: "#d97706" }}>↑ {client.thresholdProximity} pts to next level</div>
            )}
            {client.hysteresisBuffer && (
              <div style={{ fontSize: 11, color: "#7c3aed" }}>Protected: reversion requires {client.hysteresisBuffer}+ pt drop</div>
            )}
            {client.lastInteractionDays > 14 && (
              <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>
                ⚠️ Decaying: -1/day since {client.lastInteractionDays - 14} days ago
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Score components</div>
              {[
                { label: "Approved", value: client.trustBreakdown.approved },
                { label: "Corrections", value: client.trustBreakdown.minorCorrections + client.trustBreakdown.significantEdits },
                { label: "Rejections", value: client.trustBreakdown.rejections },
                { label: "Complaints", value: client.trustBreakdown.complaints },
              ].filter((i) => i.value !== 0).map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                  <span style={{ color: "#9ca3af" }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.value > 0 ? "#059669" : "#dc2626" }}>
                    {item.value > 0 ? "+" : ""}{item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Health score */}
          <div style={{ background: "#fafafa", borderRadius: 8, padding: "12px 14px", border: `1px solid ${hc.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Client Health</span>
              <span className="num-display" style={{ fontSize: 22, fontWeight: 700, color: hc.text }}>{client.healthScore}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <HealthDimBar label="Engagement" value={client.healthDimensions.engagement} weight={25} />
              <HealthDimBar label="Performance" value={client.healthDimensions.performance} weight={25} />
              <HealthDimBar label="Tone drift" value={client.healthDimensions.tone} weight={20} />
              <HealthDimBar label="Payment" value={client.healthDimensions.payment} weight={15} />
              <HealthDimBar label="NPS proxy" value={client.healthDimensions.nps} weight={15} />
            </div>
          </div>

          {/* Lead trend */}
          <div style={{ background: "#fafafa", borderRadius: 8, padding: "12px 14px", border: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>7-day lead trend</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4F46E5" }}>
                {client.leadsWeekly.reduce((a, b) => a + b, 0)} total
              </span>
            </div>
            <Sparkline data={client.leadsWeekly} color="#4F46E5" />
          </div>

          {/* Recent trust events */}
          <div style={{ background: "#fafafa", borderRadius: 8, padding: "12px 14px", border: "1px solid #f3f4f6" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Trust History</div>
            {client.trustBreakdown.lastEvents.map((ev, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: i < client.trustBreakdown.lastEvents.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#374151" }}>{ev.event}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{ev.date}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: ev.delta > 0 ? "#059669" : "#dc2626" }}>
                  {ev.delta > 0 ? "+" : ""}{ev.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Clients() {
  const [killedClients, setKilledClients] = useState<string[]>(
    mockClients.filter((c) => c.status === "paused").map((c) => c.id)
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openTrustPopover, setOpenTrustPopover] = useState<string | null>(null);

  const toggleKill = (id: string) => {
    setKilledClients((prev) => prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]);
  };

  const attentionClients = mockClients.filter((c) =>
    c.churnTier === "red" || c.churnTier === "orange" || c.trustScore < 40 || c.status === "paused" || c.renewalDays < 14
  );

  const supervisedCount = mockClients.filter((c) => c.level === "Supervised").length;

  return (
    <div style={{ padding: "18px 20px", maxWidth: 1440 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Clients</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {mockClients.length} shown of {systemStats.totalClients} total
          </p>
        </div>
        <button
          style={{
            fontSize: 12, padding: "7px 14px", borderRadius: 7, color: "#fff",
            fontWeight: 600, background: "#4F46E5", border: "none", cursor: "pointer",
          }}
        >
          + Onboard Client
        </button>
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Autonomous", count: mockClients.filter((c) => c.level === "Autonomous").length, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Semi-Autonomous", count: mockClients.filter((c) => c.level === "SemiAuto").length, color: "#d97706", bg: "#fefce8" },
          {
            label: `Supervised (${supervisedCount}/${systemStats.supervisedCap} cap)`,
            count: supervisedCount,
            color: supervisedCount >= 10 ? "#dc2626" : "#dc2626",
            bg: "#fef2f2",
            urgent: supervisedCount >= 10,
          },
          {
            label: "At-Risk (health)",
            count: mockClients.filter((c) => c.churnTier === "orange" || c.churnTier === "red").length,
            color: "#ea580c",
            bg: "#fff7ed",
            urgent: mockClients.some((c) => c.churnTier === "red"),
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              borderRadius: 8,
              border: `1px solid ${(s as { urgent?: boolean }).urgent ? "#fca5a5" : "#e5e7eb"}`,
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="num-display" style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>
                {s.label.startsWith("Autonomous") ? "●" : s.label.startsWith("Semi") ? "◐" : s.label.startsWith("Super") ? "○" : "⚠"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Attention cards */}
      {attentionClients.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Needs attention ({attentionClients.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {attentionClients.map((client) => {
              const hc = healthColors[client.churnTier as ChurnTier];
              const isKilled = killedClients.includes(client.id);
              return (
                <div
                  key={client.id}
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    borderLeft: `3px solid ${hc.text}`,
                    padding: "10px 12px",
                    minWidth: 200,
                    maxWidth: 260,
                    opacity: isKilled ? 0.6 : 1,
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedClient(client)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{client.name}</div>
                    <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 99, background: hc.bg, color: hc.text, fontWeight: 700 }}>
                      {hc.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    Trust: {client.trustScore} · Health: {client.healthScore}
                    {client.renewalDays < 14 && ` · Renews ${client.renewalDays}d`}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                    <button
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "#f3f4f6", border: "none", cursor: "pointer", color: "#374151" }}
                      onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                    >
                      View →
                    </button>
                    <div onClick={(e) => e.stopPropagation()}>
                      <KillSwitch clientId={client.id} isKilled={isKilled} onToggle={toggleKill} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Client table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
              {["Client", "Trust Score", "Health", "Leads / Week", "CPL vs Target", "Budget / mo", "Last Active", "Kill"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left", padding: "9px 12px", fontSize: 10, fontWeight: 700,
                    color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockClients.map((client) => {
              const tc = trustColors[client.level as keyof typeof trustColors];
              const hc = healthColors[client.churnTier as ChurnTier];
              const isKilled = killedClients.includes(client.id);
              const cplAboveTarget = client.cplTarget;
              const estimatedCpl = Math.round(client.monthlyBudget / Math.max(1, client.leadsWeekly.reduce((a, b) => a + b, 0)));
              const cplOk = estimatedCpl <= cplAboveTarget;

              return (
                <tr
                  key={client.id}
                  className="hoverable"
                  style={{
                    opacity: isKilled ? 0.55 : 1,
                    borderBottom: "1px solid #f9fafb",
                    background: isKilled ? "#fafafa" : "transparent",
                  }}
                  onClick={() => setSelectedClient(client)}
                >
                  {/* Client name */}
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 5 }}>
                      {client.name}
                      {isKilled && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "#fef2f2", color: "#dc2626" }}>
                          KILLED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{client.domain} · {client.campaigns} campaigns</div>
                  </td>

                  {/* Trust score */}
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 48, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${client.trustScore}%`, height: "100%", background: tc.text, borderRadius: 99 }} />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTrustPopover(openTrustPopover === client.id ? null : client.id);
                          }}
                          style={{
                            fontSize: 12, fontWeight: 700, color: tc.text, background: "none", border: "none",
                            cursor: "pointer", padding: 0,
                          }}
                          title="Click for breakdown"
                        >
                          {client.trustScore}
                        </button>
                      </div>
                      <div style={{ fontSize: 9, marginTop: 2 }}>
                        <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 99, background: tc.bg, color: tc.text, fontWeight: 600 }}>
                          {client.level}
                        </span>
                        {client.thresholdProximity && (
                          <span style={{ fontSize: 9, color: "#d97706", marginLeft: 4 }}>↑{client.thresholdProximity}pts</span>
                        )}
                      </div>
                      {openTrustPopover === client.id && (
                        <TrustPopover client={client} onClose={() => setOpenTrustPopover(null)} />
                      )}
                    </div>
                  </td>

                  {/* Health */}
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 40, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${client.healthScore}%`, height: "100%", background: hc.text, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: hc.text }}>{client.healthScore}</span>
                    </div>
                    <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 99, background: hc.bg, color: hc.text, fontWeight: 600, marginTop: 2, display: "inline-block" }}>
                      {hc.label}
                    </span>
                  </td>

                  {/* Leads / sparkline */}
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkline data={client.leadsWeekly} color="#4F46E5" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#4F46E5" }}>{client.leadsToday}↑</span>
                    </div>
                  </td>

                  {/* CPL vs target */}
                  <td style={{ padding: "9px 12px" }}>
                    <div dir="ltr" style={{ fontSize: 12, fontWeight: 600, color: cplOk ? "#059669" : "#dc2626" }}>
                      ₪{estimatedCpl}
                    </div>
                    <div dir="ltr" style={{ fontSize: 10, color: "#9ca3af" }}>target ₪{cplAboveTarget}</div>
                  </td>

                  {/* Budget */}
                  <td style={{ padding: "9px 12px" }}>
                    <div dir="ltr" style={{ fontSize: 12, color: "#374151" }}>₪{client.monthlyBudget.toLocaleString()}</div>
                    {client.renewalDays < 14 && (
                      <div style={{ fontSize: 10, color: "#dc2626" }}>Renews {client.renewalDays}d</div>
                    )}
                  </td>

                  {/* Last active */}
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{client.lastActivity}</div>
                    {client.lastInteractionDays > 14 && (
                      <div style={{ fontSize: 10, color: "#dc2626" }}>⚠️ Decaying</div>
                    )}
                  </td>

                  {/* Kill switch */}
                  <td style={{ padding: "9px 12px" }} onClick={(e) => e.stopPropagation()}>
                    <KillSwitch clientId={client.id} isKilled={isKilled} onToggle={toggleKill} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Client detail drawer */}
      {selectedClient && (
        <ClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}
    </div>
  );
}
