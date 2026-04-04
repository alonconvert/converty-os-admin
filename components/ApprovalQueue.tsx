"use client";

import { useState, useRef, useEffect } from "react";

interface Conversation {
  id: string;
  clientName: string;
  leadName: string;
  phone: string;
  lastMessage: string;
  draft: string | null;
  tier: string;
  confidence: number;
  trustLevel: string;
  status: string;
  age: string;
  ageMinutes: number;
  sentiment: string;
  autoSendMinutes: number | null;
  trustDeltaOnApprove: number;
  takeoverAt?: string;
  operatorName?: string | null;
  reentryAckSent?: boolean;
}

type FlashState = { id: string; message: string };
type EditState = { id: string; text: string };
type RejectState = { id: string };

const REJECT_CHIPS = ["Wrong tone", "Wrong info", "Too aggressive", "Factual error"];

function tierColors(tier: string): { background: string; color: string } {
  if (tier === "T4") return { background: "#fef2f2", color: "#dc2626" };
  if (tier === "T3") return { background: "#fffbeb", color: "#d97706" };
  if (tier === "T2") return { background: "#eff6ff", color: "#2563eb" };
  return { background: "#f0fdf4", color: "#16a34a" };
}

function confidenceColor(conf: number) {
  if (conf >= 0.85) return "#059669";
  if (conf >= 0.70) return "#d97706";
  return "#dc2626";
}

// Live countdown component
function Countdown({ minutesRemaining }: { minutesRemaining: number }) {
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
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: urgent ? "#fef2f2" : "#fffbeb",
        border: `1px solid ${urgent ? "#fca5a5" : "#fde68a"}`,
        borderRadius: 6,
        padding: "3px 8px",
      }}
      className={urgent ? "pill-pulse" : ""}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: urgent ? "#dc2626" : "#f59e0b", display: "inline-block" }} />
      <span
        dir="ltr"
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: urgent ? "#dc2626" : "#92400e",
          fontFamily: "monospace",
        }}
      >
        {m}:{s.toString().padStart(2, "0")}
      </span>
      <span style={{ fontSize: 10, color: urgent ? "#dc2626" : "#92400e" }}>auto-send</span>
    </div>
  );
}

// Confidence bar
function ConfidenceBar({ conf }: { conf: number }) {
  const pct = Math.round(conf * 100);
  const color = confidenceColor(conf);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 48, height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.3s ease" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

interface Props {
  conversations: Conversation[];
  title?: string;
  variant?: "crisis" | "routine";
  showBatchApprove?: boolean;
}

export default function ApprovalQueue({ conversations, title = "Approval Queue", variant, showBatchApprove }: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [flash, setFlash] = useState<FlashState | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [rejecting, setRejecting] = useState<RejectState | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [clearedHuman, setClearedHuman] = useState<string[]>([]);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingConvs = conversations.filter((c) => !dismissed.includes(c.id));

  // Keyboard shortcuts
  useEffect(() => {
    const focused = { id: pendingConvs[0]?.id };
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (!focused.id) return;
      const conv = pendingConvs.find((c) => c.id === focused.id);
      if (!conv) return;
      if (e.key === "a" && conv.draft && !editing) { triggerFlash(conv.id, `✓ Sent to ${conv.leadName}`); }
      if (e.key === "r" && !editing) { setRejecting({ id: conv.id }); }
      if (e.key === "e" && conv.draft && !editing) {
        setEditing({ id: conv.id, text: conv.draft ?? "" });
        setEditText(conv.draft ?? "");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pendingConvs, editing]);

  function triggerFlash(id: string, message: string) {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ id, message });
    flashTimer.current = setTimeout(() => {
      setFlash(null);
      setDismissed((prev) => [...prev, id]);
    }, 1800);
  }

  function handleApprove(conv: Conversation) {
    triggerFlash(conv.id, `✓ Sent to ${conv.leadName} (+${conv.trustDeltaOnApprove} trust)`);
  }

  function handleEditClick(conv: Conversation) {
    setEditing({ id: conv.id, text: conv.draft ?? "" });
    setEditText(conv.draft ?? "");
    setRejecting(null);
  }

  function handleSendEdit(conv: Conversation) {
    triggerFlash(conv.id, `✓ Edited & sent to ${conv.leadName}`);
    setEditing(null);
  }

  function handleRejectClick(conv: Conversation) {
    setRejecting({ id: conv.id });
    setEditing(null);
  }

  function handleRejectChip(convId: string, reason: string) {
    triggerFlash(convId, `✗ Rejected: ${reason} — sent to training queue`);
    setRejecting(null);
  }

  function handleAllClear(conv: Conversation) {
    setClearedHuman((prev) => [...prev, conv.id]);
  }

  const isCrisis = variant === "crisis";
  const isRoutine = variant === "routine";

  function handleBatchApprove() {
    const approvable = pendingConvs.filter((c) => c.draft && c.status !== "needs_human");
    approvable.forEach((conv) => {
      triggerFlash(conv.id, `✓ Sent to ${conv.leadName} (+${conv.trustDeltaOnApprove} trust)`);
    });
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: isCrisis ? "1px solid rgba(239,68,68,0.35)" : "1px solid #e5e7eb",
        overflow: "hidden",
        boxShadow: isCrisis ? "0 0 0 3px rgba(239,68,68,0.06)" : undefined,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: isCrisis ? "1px solid rgba(239,68,68,0.15)" : "1px solid #f3f4f6",
          background: isCrisis ? "#FEF2F2" : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: isCrisis ? "#991B1B" : "#111827", margin: 0 }}>{title}</h2>
          {pendingConvs.length > 0 && (
            <span
              style={{
                background: isCrisis ? "#DC2626" : "#4F46E5",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: 99,
              }}
            >
              {pendingConvs.length}
            </span>
          )}
          {!isCrisis && pendingConvs.length > 0 && (() => {
            const oldest = Math.max(...pendingConvs.map((c) => c.ageMinutes ?? 0));
            const h = Math.floor(oldest / 60);
            const m = oldest % 60;
            const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
            const isStale = oldest > 240;
            return (
              <span
                style={{
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 4,
                  background: isStale ? "#fff7ed" : "#f9fafb",
                  color: isStale ? "#c2410c" : "#6b7280",
                  border: `1px solid ${isStale ? "#fed7aa" : "#e5e7eb"}`,
                }}
                className={isStale ? "pill-pulse" : ""}
              >
                ⏰ oldest: {label}
              </span>
            );
          })()}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {showBatchApprove && pendingConvs.filter((c) => c.draft).length > 1 && (
            <button
              onClick={handleBatchApprove}
              style={{
                fontSize: 11,
                padding: "4px 12px",
                background: "#dcfce7",
                color: "#16a34a",
                border: "1px solid #bbf7d0",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              ✓ Approve All
            </button>
          )}
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            A=approve · E=edit · R=reject
          </span>
        </div>
      </div>

      <div>
        {pendingConvs.map((conv) => {
          const isFlashing = flash?.id === conv.id;
          const isEditing = editing?.id === conv.id;
          const isRejecting = rejecting?.id === conv.id;
          const isCleared = clearedHuman.includes(conv.id);
          const tc = tierColors(conv.tier);
          const isT4 = conv.tier === "T4";
          const isHuman = conv.status === "needs_human";
          const isAutoQueued = conv.status === "auto_queued";

          if (isFlashing) {
            return (
              <div
                key={conv.id}
                style={{
                  padding: "14px 14px",
                  background: flash!.message.startsWith("✗") ? "#fef2f2" : "#f0fdf4",
                  borderLeft: `3px solid ${flash!.message.startsWith("✗") ? "#dc2626" : "#10b981"}`,
                }}
              >
                <span
                  style={{
                    color: flash!.message.startsWith("✗") ? "#dc2626" : "#059669",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {flash!.message}
                </span>
              </div>
            );
          }

          return (
            <div
              key={conv.id}
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid #f9fafb",
                borderLeft: isT4 ? "3px solid #dc2626" : "3px solid transparent",
              }}
              className={isT4 ? "t4-pulse" : ""}
            >
              {/* Top row: tier + names + confidence */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Meta line */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                    <span
                      style={{
                        ...tc,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {conv.tier}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{conv.clientName}</span>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>→</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{conv.leadName}</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{conv.phone}</span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "1px 5px",
                        borderRadius: 99,
                        background:
                          conv.sentiment === "angry" ? "#fef2f2"
                          : conv.sentiment === "positive" ? "#f0fdf4"
                          : "#f3f4f6",
                        color:
                          conv.sentiment === "angry" ? "#dc2626"
                          : conv.sentiment === "positive" ? "#16a34a"
                          : "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      <span
                        role="img"
                        aria-label={
                          conv.sentiment === "angry" ? "סנטימנט שלילי"
                          : conv.sentiment === "positive" ? "סנטימנט חיובי"
                          : "סנטימנט ניטרלי"
                        }
                      >
                        {conv.sentiment === "angry" ? "😠" : conv.sentiment === "positive" ? "😊" : "😐"}
                      </span>{" "}
                      {conv.sentiment}
                    </span>
                  </div>

                  {/* Incoming message — RTL Hebrew */}
                  <div
                    style={{
                      background: "#f9fafb",
                      borderRadius: 6,
                      padding: "7px 10px",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 2 }}>Lead said:</span>
                    <p
                      dir="rtl"
                      style={{
                        fontSize: 12,
                        color: "#374151",
                        margin: 0,
                        textAlign: "right",
                        lineHeight: 1.5,
                      }}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Draft or editing */}
                  {conv.draft && !isEditing && (
                    <div
                      style={{
                        background: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        borderRadius: 6,
                        padding: "7px 10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#4F46E5" }}>AI Draft</span>
                        {conv.confidence > 0 && <ConfidenceBar conf={conv.confidence} />}
                      </div>
                      <p
                        dir="rtl"
                        style={{
                          fontSize: 12,
                          color: "#312e81",
                          margin: 0,
                          textAlign: "right",
                          lineHeight: 1.5,
                        }}
                      >
                        {conv.draft}
                      </p>
                    </div>
                  )}

                  {conv.draft && isEditing && (
                    <div>
                      <textarea
                        dir="rtl"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        style={{
                          width: "100%",
                          fontSize: 12,
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #4F46E5",
                          outline: "none",
                          resize: "vertical",
                          color: "#1f2937",
                          background: "#fafafa",
                          boxSizing: "border-box",
                          textAlign: "right",
                          direction: "rtl",
                        }}
                      />
                      <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "right", marginTop: 2 }}>
                        {editText.length} chars
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button
                          onClick={() => handleSendEdit(conv)}
                          style={{
                            fontSize: 11, padding: "4px 10px", background: "#4F46E5", color: "#fff",
                            border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600,
                          }}
                        >
                          Send Edited
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          style={{
                            fontSize: 11, padding: "4px 10px", background: "#f3f4f6", color: "#6b7280",
                            border: "none", borderRadius: 5, cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Human takeover */}
                  {isHuman && !isCleared && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        borderRadius: 6,
                        padding: "8px 10px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, margin: 0 }}>
                          ⚠️ Human takeover required
                        </p>
                        {conv.takeoverAt && (
                          <p style={{ fontSize: 11, color: "#f87171", margin: "2px 0 0" }}>
                            Active since {conv.takeoverAt}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
                          Reply directly on WhatsApp, then click "All Clear" to resume AI.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI re-entry after all clear */}
                  {isHuman && isCleared && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: 6,
                        padding: "8px 10px",
                      }}
                    >
                      <p style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, margin: 0 }}>
                        ✓ All clear sent — AI will resume with:
                      </p>
                      <p
                        dir="rtl"
                        style={{
                          fontSize: 11,
                          color: "#166534",
                          margin: "4px 0 0",
                          textAlign: "right",
                          background: "#dcfce7",
                          borderRadius: 4,
                          padding: "4px 7px",
                        }}
                      >
                        "ממשיך לאחר שאלון דיבר איתך ישירות."
                      </p>
                    </div>
                  )}

                  {/* Auto-queued countdown */}
                  {isAutoQueued && conv.autoSendMinutes !== null && (
                    <div style={{ marginTop: 4 }}>
                      <Countdown minutesRemaining={conv.autoSendMinutes} />
                    </div>
                  )}

                  {/* Reject reason */}
                  {isRejecting && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>
                        Reason (trains AI):
                      </span>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {REJECT_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => handleRejectChip(conv.id, chip)}
                            style={{
                              fontSize: 11, padding: "3px 9px", background: "#fff0f0", color: "#dc2626",
                              border: "1px solid #fca5a5", borderRadius: 99, cursor: "pointer", fontWeight: 500,
                            }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: time + actions */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 5,
                    flexShrink: 0,
                    minWidth: 80,
                  }}
                >
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>{conv.age}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 99,
                      fontWeight: 600,
                      background:
                        conv.trustLevel === "Autonomous" ? "#f0fdf4"
                        : conv.trustLevel === "SemiAuto" ? "#fefce8"
                        : "#fef2f2",
                      color:
                        conv.trustLevel === "Autonomous" ? "#16a34a"
                        : conv.trustLevel === "SemiAuto" ? "#ca8a04"
                        : "#dc2626",
                    }}
                  >
                    {conv.trustLevel}
                  </span>

                  {/* Trust delta preview */}
                  {conv.trustDeltaOnApprove !== 0 && (
                    <span style={{ fontSize: 10, color: "#059669" }}>
                      {conv.trustDeltaOnApprove > 0 ? "+" : ""}{conv.trustDeltaOnApprove} trust
                    </span>
                  )}

                  {/* Action buttons */}
                  {conv.draft && !isEditing && !isRejecting && (
                    <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                      <button
                        onClick={() => handleApprove(conv)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#dcfce7"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#dcfce7"; }}
                        style={{
                          fontSize: 11, padding: "4px 7px", background: "#dcfce7", color: "#16a34a",
                          border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 700,
                          transition: "background 0.15s, color 0.15s",
                        }}
                        title="Approve (A)"
                        aria-label="אשר הודעה"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleEditClick(conv)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F3FF"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; }}
                        style={{
                          fontSize: 11, padding: "4px 7px", background: "#f3f4f6", color: "#4b5563",
                          border: "none", borderRadius: 5, cursor: "pointer",
                          transition: "background 0.15s, color 0.15s",
                        }}
                        title="Edit (E)"
                        aria-label="ערוך הודעה"
                      >
                        ✏
                      </button>
                      <button
                        onClick={() => handleRejectClick(conv)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; }}
                        style={{
                          fontSize: 11, padding: "4px 7px", background: "#fef2f2", color: "#dc2626",
                          border: "none", borderRadius: 5, cursor: "pointer",
                          transition: "background 0.15s, color 0.15s",
                        }}
                        title="Reject (R)"
                        aria-label="דחה הודעה"
                      >
                        ✗
                      </button>
                    </div>
                  )}

                  {/* Human takeover All Clear */}
                  {isHuman && !isCleared && (
                    <button
                      onClick={() => handleAllClear(conv)}
                      style={{
                        fontSize: 11, padding: "4px 10px", background: "#16a34a", color: "#fff",
                        border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600, marginTop: 4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ✓ All Clear
                    </button>
                  )}

                  {isHuman && isCleared && (
                    <button
                      onClick={() => setDismissed((p) => [...p, conv.id])}
                      style={{
                        fontSize: 10, padding: "3px 8px", background: "#f3f4f6", color: "#6b7280",
                        border: "none", borderRadius: 5, cursor: "pointer",
                      }}
                    >
                      Dismiss
                    </button>
                  )}

                  {/* Auto-queued cancel */}
                  {isAutoQueued && !isEditing && !isRejecting && (
                    <button
                      onClick={() => setDismissed((p) => [...p, conv.id])}
                      style={{
                        fontSize: 10, padding: "3px 8px", background: "#fff7ed", color: "#c2410c",
                        border: "1px solid #fed7aa", borderRadius: 5, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Cancel Auto
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {pendingConvs.length === 0 && (
          <div
            style={{
              padding: "28px 14px",
              textAlign: "center",
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>✓</div>
            All caught up — queue empty
          </div>
        )}
      </div>
    </div>
  );
}
