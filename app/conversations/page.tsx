"use client";

import { useState, useMemo, useEffect } from "react";
import { mockConversations } from "@/lib/mock-data";

type Conversation = (typeof mockConversations)[number];

// ── Styles ───────────────────────────────────────────────────────────────────

const TIER_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  T4: { bg: "#fef2f2", color: "#dc2626", label: "Crisis" },
  T3: { bg: "#fffbeb", color: "#d97706", label: "Sensitive" },
  T2: { bg: "#eff6ff", color: "#2563eb", label: "Operational" },
  T1: { bg: "#f0fdf4", color: "#16a34a", label: "Info" },
};

const TRUST_STYLE: Record<string, { bg: string; color: string }> = {
  Autonomous: { bg: "#f0fdf4", color: "#16a34a" },
  SemiAuto: { bg: "#fefce8", color: "#ca8a04" },
  Supervised: { bg: "#fef2f2", color: "#dc2626" },
};

function tierSort(a: Conversation, b: Conversation) {
  const order: Record<string, number> = { T4: 0, T3: 1, T2: 2, T1: 3 };
  return (order[a.tier] ?? 9) - (order[b.tier] ?? 9);
}

// ── Scheduling context helper ────────────────────────────────────────────────

function getSchedulingContext(): { text: string; style: React.CSSProperties } | null {
  const now = new Date();
  const dayName = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    weekday: "long",
  }).format(now);
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jerusalem",
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );

  if (dayName === "יום שישי") {
    return {
      text: "Follow-up: Sunday 09:00 IST",
      style: {
        fontSize: 10, padding: "2px 7px", borderRadius: 4,
        background: "#fffbeb", color: "#92400e",
        display: "inline-block", marginTop: 4,
      },
    };
  }

  if (hour >= 17) {
    return {
      text: "Off-hours — follow-up tomorrow 09:00 IST",
      style: {
        fontSize: 10, padding: "2px 7px", borderRadius: 4,
        background: "#f3f4f6", color: "#6b7280",
        display: "inline-block", marginTop: 4,
      },
    };
  }

  return null;
}

// ── Countdown ────────────────────────────────────────────────────────────────

function AutoSendCountdown({ minutesRemaining }: { minutesRemaining: number }) {
  const [secs, setSecs] = useState(minutesRemaining * 60);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs < 120;
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: urgent ? "#fef2f2" : "#fffbeb",
        border: `1px solid ${urgent ? "#fca5a5" : "#fde68a"}`,
        borderRadius: 6, padding: "3px 8px",
      }}
      className={urgent ? "pill-pulse" : ""}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: urgent ? "#dc2626" : "#f59e0b", display: "inline-block" }} />
      <span dir="ltr" style={{ fontSize: 11, fontWeight: 700, color: urgent ? "#dc2626" : "#92400e", fontFamily: "monospace" }}>
        {m}:{s.toString().padStart(2, "0")}
      </span>
      <span style={{ fontSize: 10, color: urgent ? "#dc2626" : "#92400e" }}>auto-send</span>
    </div>
  );
}

// ── Conversation card ────────────────────────────────────────────────────────

interface ConvCardProps {
  conv: Conversation;
  hideClientName?: boolean;
  flashing: boolean;
  onApprove: () => void;
  onReject: () => void;
}

function ConvCard({ conv, hideClientName, flashing, onApprove, onReject }: ConvCardProps) {
  const ts = TIER_STYLE[conv.tier] ?? TIER_STYLE.T1;
  const trustStyle = TRUST_STYLE[conv.trustLevel] ?? TRUST_STYLE.Supervised;
  const isT4 = conv.tier === "T4";
  const isHuman = conv.status === "needs_human";
  const isAutoQueued = conv.status === "auto_queued";
  const [allCleared, setAllCleared] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(conv.draft ?? "");

  const schedulingCtx = getSchedulingContext();

  // Confidence bar
  const conf = conv.confidence;
  const confPct = Math.round(conf * 100);
  const confColor = conf >= 0.85 ? "#059669" : conf >= 0.70 ? "#d97706" : "#dc2626";

  return (
    <div
      className={`${isT4 ? "t4-pulse" : ""}`}
      style={{
        background: flashing ? "#f0fdf4" : "#fff",
        borderRadius: 10,
        border: isT4 ? "2px solid #dc2626" : "1px solid #e5e7eb",
        borderLeft: isT4 ? "2px solid #dc2626" : isHuman ? "3px solid #fca5a5" : "3px solid transparent",
        overflow: "hidden",
        transition: "background 0.3s",
      }}
    >
      {/* T4 Crisis full-width banner */}
      {isT4 && (
        <div
          style={{
            background: "#7f1d1d",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f87171", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: "#fecaca", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            T4 CRISIS — REQUIRES HUMAN TAKEOVER
          </span>
        </div>
      )}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {/* Left content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ ...ts, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>
                {conv.tier}
              </span>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>{ts.label}</span>
              {!hideClientName && (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{conv.clientName}</span>
                  <span style={{ color: "#d1d5db" }}>→</span>
                </>
              )}
              <span style={{ fontSize: 13, color: "#6b7280" }}>{conv.leadName}</span>
              <span style={{ fontSize: 11, color: "#d1d5db" }}>{conv.phone}</span>
              <span
                style={{
                  fontSize: 10, padding: "1px 5px", borderRadius: 99, fontWeight: 600,
                  background: conv.sentiment === "angry" ? "#fef2f2" : conv.sentiment === "positive" ? "#f0fdf4" : "#f3f4f6",
                  color: conv.sentiment === "angry" ? "#dc2626" : conv.sentiment === "positive" ? "#16a34a" : "#6b7280",
                }}
              >
                {conv.sentiment === "angry" ? "😠" : conv.sentiment === "positive" ? "😊" : "😐"}
              </span>
            </div>

            {/* Lead message — RTL */}
            <div style={{ background: "#f9fafb", borderRadius: 7, padding: "8px 11px", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>Lead said:</div>
              <p dir="rtl" style={{ fontSize: 12, color: "#374151", margin: 0, fontFamily: "Heebo, sans-serif", textAlign: "right", lineHeight: 1.6 }}>
                {conv.lastMessage}
              </p>
            </div>

            {/* Scheduling context badge (for non-auto items) */}
            {!isAutoQueued && schedulingCtx && (
              <div style={schedulingCtx.style}>{schedulingCtx.text}</div>
            )}

            {/* AI Draft / editing */}
            {conv.draft && !editMode && (
              <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 7, padding: "8px 11px", marginBottom: 8, marginTop: (!isAutoQueued && schedulingCtx) ? 6 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#4F46E5" }}>AI Draft</span>
                  {/* Confidence bar */}
                  {conv.confidence > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{ fontSize: 10, color: confColor, fontWeight: 700 }}>{confPct}%</span>
                      <div style={{ width: 120, height: 6, background: "#f3f4f6", borderRadius: 99, position: "relative" }}>
                        <div
                          style={{
                            width: `${confPct}%`, height: "100%",
                            background: confColor, borderRadius: 99,
                          }}
                        />
                        {/* 85% threshold marker */}
                        <div
                          style={{
                            position: "absolute", left: "85%", top: -2, bottom: -2,
                            width: 1, background: "#6b7280",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p dir="rtl" style={{ fontSize: 12, color: "#312e81", margin: 0, fontFamily: "Heebo, sans-serif", textAlign: "right", lineHeight: 1.6 }}>
                  {conv.draft}
                </p>
                {conv.trustDeltaOnApprove !== 0 && (
                  <div style={{ fontSize: 10, color: "#059669", marginTop: 4 }}>
                    +{conv.trustDeltaOnApprove} trust on approve
                  </div>
                )}
              </div>
            )}

            {conv.draft && editMode && (
              <div style={{ marginBottom: 8 }}>
                <textarea
                  dir="rtl"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", fontSize: 12, padding: "8px 11px", borderRadius: 7,
                    border: "1px solid #4F46E5", outline: "none", resize: "vertical",
                    fontFamily: "Heebo, sans-serif", textAlign: "right", direction: "rtl",
                    background: "#fafafa",
                  }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                  <button onClick={() => { onApprove(); setEditMode(false); }} style={{ fontSize: 11, padding: "4px 10px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600 }}>
                    Send Edited
                  </button>
                  <button onClick={() => setEditMode(false)} style={{ fontSize: 11, padding: "4px 10px", background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 5, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Human takeover */}
            {isHuman && !allCleared && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 7, padding: "8px 11px", marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, margin: 0 }}>⚠️ Human takeover required</p>
                {conv.takeoverAt && (
                  <p style={{ fontSize: 11, color: "#f87171", margin: "2px 0 0" }}>Since {conv.takeoverAt}</p>
                )}
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
                  Reply on WhatsApp directly, then click "All Clear" to hand back to AI.
                </p>
              </div>
            )}

            {/* All clear / AI re-entry */}
            {isHuman && allCleared && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "8px 11px", marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, margin: 0 }}>✓ All clear — AI resuming with:</p>
                <p dir="rtl" style={{ fontSize: 11, color: "#166534", margin: "4px 0 0", fontFamily: "Heebo, sans-serif", textAlign: "right", background: "#dcfce7", borderRadius: 5, padding: "4px 7px" }}>
                  "ממשיך לאחר שאלון דיבר איתך ישירות."
                </p>
              </div>
            )}

            {/* Auto-queued countdown + scheduling badge */}
            {isAutoQueued && conv.autoSendMinutes !== null && (
              <div style={{ marginTop: 4 }}>
                <AutoSendCountdown minutesRemaining={conv.autoSendMinutes} />
                {schedulingCtx && (
                  <div style={schedulingCtx.style}>{schedulingCtx.text}</div>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, minWidth: 90 }}>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>{conv.age}</span>
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, fontWeight: 600, background: trustStyle.bg, color: trustStyle.color }}>
              {conv.trustLevel}
            </span>

            {conv.draft && !editMode && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                <button
                  onClick={onApprove}
                  style={{ fontSize: 11, padding: "5px 0", background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  style={{ fontSize: 11, padding: "5px 0", background: "#fff", border: "1px solid #e5e7eb", color: "#374151", borderRadius: 6, cursor: "pointer" }}
                >
                  ✏ Edit
                </button>
                <button
                  onClick={onReject}
                  style={{ fontSize: 11, padding: "5px 0", background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 6, cursor: "pointer" }}
                >
                  ✗ Reject
                </button>
              </div>
            )}

            {isHuman && !allCleared && (
              <button
                onClick={() => setAllCleared(true)}
                style={{ fontSize: 11, padding: "5px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
              >
                ✓ All Clear
              </button>
            )}

            {isAutoQueued && !editMode && (
              <button
                onClick={onReject}
                style={{ fontSize: 10, padding: "4px 8px", background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 5, cursor: "pointer" }}
              >
                Cancel Auto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── New Message Modal ─────────────────────────────────────────────────────────

interface NewMsgModalProps {
  allClientNames: string[];
  onClose: () => void;
}

function NewMsgModal({ allClientNames, onClose }: NewMsgModalProps) {
  const [newMsgClient, setNewMsgClient] = useState("");
  const [newMsgText, setNewMsgText] = useState("");
  const [newMsgTier, setNewMsgTier] = useState<string>("T1");
  const [sendWithAI, setSendWithAI] = useState(false);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, padding: 20, width: 440,
          boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>+ New Message</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18 }}>×</button>
        </div>

        {/* Client selector */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Client</label>
          <select
            value={newMsgClient}
            onChange={(e) => setNewMsgClient(e.target.value)}
            style={{ width: "100%", fontSize: 12, padding: "6px 9px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#374151" }}
          >
            <option value="">Select client...</option>
            {allClientNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Message textarea */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Message</label>
          <textarea
            dir="rtl"
            value={newMsgText}
            onChange={(e) => setNewMsgText(e.target.value)}
            placeholder="כתוב הודעה…"
            rows={4}
            style={{
              width: "100%", fontSize: 12, padding: "8px 11px", borderRadius: 7,
              border: "1px solid #e5e7eb", outline: "none", resize: "vertical",
              fontFamily: "Heebo, sans-serif", textAlign: "right", direction: "rtl",
              background: "#fafafa", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Tier selector */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Tier</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["T1", "T2", "T3", "T4"].map((t) => {
              const ts = TIER_STYLE[t];
              return (
                <button
                  key={t}
                  onClick={() => setNewMsgTier(t)}
                  style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 5, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: newMsgTier === t ? ts.color : "#f3f4f6",
                    color: newMsgTier === t ? "#fff" : "#6b7280",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Send with AI toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="sendWithAI"
            checked={sendWithAI}
            onChange={(e) => setSendWithAI(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <label htmlFor="sendWithAI" style={{ fontSize: 12, color: "#374151", cursor: "pointer" }}>Send with AI</label>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, background: "#f3f4f6", color: "#6b7280", border: "none", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={() => { console.log("Send message", { newMsgClient, newMsgText, newMsgTier, sendWithAI }); onClose(); }}
            style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Conversations() {
  const [viewMode, setViewMode] = useState<"grouped" | "chronological">("grouped");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [flashing, setFlashing] = useState<string[]>([]);
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>({});
  const [tierFilter, setTierFilter] = useState("All Tiers");
  const [clientFilter, setClientFilter] = useState("All Clients");
  const [newMsgOpen, setNewMsgOpen] = useState(false);

  const allClientNames = useMemo(
    () => Array.from(new Set(mockConversations.map((c) => c.clientName))).sort(),
    []
  );

  const activeConvs = useMemo(() => {
    return mockConversations.filter((c) => {
      if (dismissed.includes(c.id)) return false;
      if (tierFilter !== "All Tiers" && !c.tier.startsWith(tierFilter.split(" ")[0])) return false;
      if (clientFilter !== "All Clients" && c.clientName !== clientFilter) return false;
      return true;
    });
  }, [dismissed, tierFilter, clientFilter]);

  const groups = useMemo(() => {
    const map: Record<string, Conversation[]> = {};
    for (const c of activeConvs) {
      if (!map[c.clientName]) map[c.clientName] = [];
      map[c.clientName].push(c);
    }
    for (const key of Object.keys(map)) map[key].sort(tierSort);
    const sortedKeys = Object.keys(map).sort((a, b) => {
      const aT4 = map[a].some((c) => c.tier === "T4") ? 0 : 1;
      const bT4 = map[b].some((c) => c.tier === "T4") ? 0 : 1;
      return aT4 - bT4;
    });
    return sortedKeys.map((key) => ({ clientName: key, convs: map[key] }));
  }, [activeConvs]);

  const chronological = useMemo(() => [...activeConvs].sort(tierSort), [activeConvs]);

  // Split chronological into attention and routine
  const attentionConvs = useMemo(
    () => chronological.filter((c) => c.tier === "T4" || c.tier === "T3"),
    [chronological]
  );
  const routineConvs = useMemo(
    () => chronological.filter((c) => c.tier !== "T4" && c.tier !== "T3"),
    [chronological]
  );

  function isExpanded(name: string) { return groupExpanded[name] !== false; }
  function toggleGroup(name: string) { setGroupExpanded((p) => ({ ...p, [name]: !isExpanded(name) })); }

  function handleApprove(id: string) {
    setFlashing((p) => [...p, id]);
    setTimeout(() => { setFlashing((p) => p.filter((x) => x !== id)); setDismissed((p) => [...p, id]); }, 700);
  }
  function handleReject(id: string) { setDismissed((p) => [...p, id]); }
  function handleApproveAllT1(clientName: string) {
    const ids = (groups.find((g) => g.clientName === clientName)?.convs ?? [])
      .filter((c) => c.tier === "T1" && c.draft).map((c) => c.id);
    setFlashing((p) => [...p, ...ids]);
    setTimeout(() => { setFlashing((p) => p.filter((x) => !ids.includes(x))); setDismissed((p) => [...p, ...ids]); }, 700);
  }

  const tierCounts = {
    T4: activeConvs.filter((c) => c.tier === "T4").length,
    T3: activeConvs.filter((c) => c.tier === "T3").length,
    T2: activeConvs.filter((c) => c.tier === "T2").length,
    T1: activeConvs.filter((c) => c.tier === "T1").length,
  };

  const hasAttention = tierCounts.T4 > 0 || tierCounts.T3 > 0;

  return (
    <>
      <style>{`
        @keyframes t4BorderPulse {
          0%,100% { border-left-color:#dc2626; box-shadow:0 0 0 0 rgba(220,38,38,0); }
          50% { border-left-color:#fca5a5; box-shadow:0 0 0 4px rgba(220,38,38,0.07); }
        }
        .t4-pulse { animation: t4BorderPulse 1.8s ease-in-out infinite; }
      `}</style>

      {newMsgOpen && (
        <NewMsgModal allClientNames={allClientNames} onClose={() => setNewMsgOpen(false)} />
      )}

      <div style={{ padding: "18px 20px", maxWidth: 1440 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Conversations</h1>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              Approval queue · {activeConvs.length} active
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* + New Message button */}
            <button
              onClick={() => setNewMsgOpen(true)}
              style={{
                fontSize: 11, padding: "5px 12px", borderRadius: 6,
                background: "#4F46E5", color: "#fff", border: "none",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              + New Message
            </button>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              style={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 9px", background: "#fff", color: "#374151" }}
            >
              <option>All Tiers</option>
              <option>T4 Crisis</option>
              <option>T3 Sensitive</option>
              <option>T2 Operational</option>
              <option>T1 Info</option>
            </select>

            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              style={{ fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 9px", background: "#fff", color: "#374151" }}
            >
              <option>All Clients</option>
              {allClientNames.map((n) => <option key={n}>{n}</option>)}
            </select>

            <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
              {["grouped", "chronological"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as "grouped" | "chronological")}
                  style={{
                    fontSize: 11, padding: "5px 10px", border: "none", cursor: "pointer",
                    background: viewMode === mode ? "#4F46E5" : "#fff",
                    color: viewMode === mode ? "#fff" : "#6b7280",
                    fontWeight: viewMode === mode ? 600 : 400,
                  }}
                >
                  {mode === "grouped" ? "By Client" : "Chronological"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tier legend + counts */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["T4", "T3", "T2", "T1"] as const).map((tier) => {
            const s = TIER_STYLE[tier];
            const count = tierCounts[tier];
            return (
              <div
                key={tier}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#fff", borderRadius: 7, border: `1px solid ${count > 0 && tier === "T4" ? "#fca5a5" : "#e5e7eb"}`,
                  padding: "5px 10px",
                }}
              >
                <span style={{ ...s, fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{tier}</span>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</span>
                <span className="num-display" style={{ fontSize: 13, fontWeight: 700, color: count > 0 ? s.color : "#d1d5db" }}>{count}</span>
                {tier !== "T1" && count === 0 && <span style={{ fontSize: 10, color: "#d1d5db" }}>clear</span>}
              </div>
            );
          })}
        </div>

        {/* Grouped view */}
        {viewMode === "grouped" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Attention banner in grouped view */}
            {hasAttention && (
              <div
                style={{
                  background: "#fef2f2", borderLeft: "4px solid #dc2626",
                  padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#dc2626",
                  borderRadius: 4,
                }}
              >
                ⚠ REQUIRES ATTENTION — {tierCounts.T4} T4 + {tierCounts.T3} T3 messages
              </div>
            )}

            {groups.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                No pending conversations
              </div>
            )}
            {groups.map(({ clientName, convs }) => {
              const t1Count = convs.filter((c) => c.tier === "T1" && c.draft).length;
              const hasT4 = convs.some((c) => c.tier === "T4");
              const expanded = isExpanded(clientName);

              return (
                <div
                  key={clientName}
                  style={{
                    background: "#fff", borderRadius: 10, border: `1px solid ${hasT4 ? "#fca5a5" : "#e5e7eb"}`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderBottom: expanded ? "1px solid #f3f4f6" : "none",
                      background: hasT4 ? "#fef9f9" : "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{clientName}</span>
                      <span style={{ fontSize: 10, background: "#eef2ff", color: "#4F46E5", fontWeight: 700, padding: "1px 6px", borderRadius: 99 }}>
                        {convs.length}
                      </span>
                      {hasT4 && (
                        <span style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", fontWeight: 700, padding: "1px 6px", borderRadius: 99 }} className="pill-pulse">
                          T4 CRISIS
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {t1Count > 0 && (
                        <button
                          onClick={() => handleApproveAllT1(clientName)}
                          style={{ fontSize: 10, padding: "3px 9px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600 }}
                        >
                          Approve T1 ({t1Count})
                        </button>
                      )}
                      <button
                        onClick={() => toggleGroup(clientName)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "2px 4px" }}
                      >
                        {expanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {convs.map((conv) => (
                        <div key={conv.id} style={{ paddingLeft: 12, borderLeft: "2px solid #f3f4f6" }}>
                          <ConvCard
                            conv={conv}
                            hideClientName
                            flashing={flashing.includes(conv.id)}
                            onApprove={() => handleApprove(conv.id)}
                            onReject={() => handleReject(conv.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Chronological view */}
        {viewMode === "chronological" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chronological.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: 13 }}>No pending conversations.</div>
            )}

            {/* REQUIRES ATTENTION section */}
            {attentionConvs.length > 0 && (
              <>
                <div
                  style={{
                    background: "#fef2f2", borderLeft: "4px solid #dc2626",
                    padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#dc2626",
                    borderRadius: 4,
                  }}
                >
                  REQUIRES ATTENTION ({attentionConvs.length})
                </div>
                {attentionConvs.map((conv) => (
                  <ConvCard
                    key={conv.id}
                    conv={conv}
                    flashing={flashing.includes(conv.id)}
                    onApprove={() => handleApprove(conv.id)}
                    onReject={() => handleReject(conv.id)}
                  />
                ))}
              </>
            )}

            {/* ROUTINE QUEUE section */}
            {routineConvs.length > 0 && (
              <>
                <div
                  style={{
                    background: "#f9fafb", borderLeft: "4px solid #9ca3af",
                    padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280",
                    borderRadius: 4,
                  }}
                >
                  ROUTINE QUEUE ({routineConvs.length})
                </div>
                {routineConvs.map((conv) => (
                  <ConvCard
                    key={conv.id}
                    conv={conv}
                    flashing={flashing.includes(conv.id)}
                    onApprove={() => handleApprove(conv.id)}
                    onReject={() => handleReject(conv.id)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
