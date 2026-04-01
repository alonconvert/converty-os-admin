"use client";

import { useState, useEffect, useCallback } from "react";
import { mockClients, systemStats, overnightSummary, autoApprovalQueue } from "@/lib/mock-data";

const STORAGE_KEY = "briefing_dismissed_date_v2";

function todayKey(): string {
  // Key by IST date
  const ist = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return ist;
}

function formatHebrewDate(): string {
  return new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getISTHour(): number {
  return parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
    10
  );
}

function shouldShow(): boolean {
  const hour = getISTHour();
  if (hour < 9 || hour >= 13) return false; // show 09:00–13:00 IST
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== todayKey();
  } catch {
    return true;
  }
}

function dismiss(): void {
  try {
    localStorage.setItem(STORAGE_KEY, todayKey());
  } catch {
    // ignore
  }
}

// Build exception client list (max 7)
function getExceptionClients() {
  return mockClients
    .filter((c) => {
      return (
        c.churnTier === "red" ||
        c.churnTier === "orange" ||
        c.trustScore < 40 ||
        c.renewalDays < 14 ||
        c.status === "paused"
      );
    })
    .slice(0, 7)
    .map((c) => {
      const reasons: string[] = [];
      const actions: string[] = [];
      if (c.churnTier === "red") { reasons.push("🔴 Health critical"); actions.push("Call now"); }
      else if (c.churnTier === "orange") { reasons.push("🟠 Churn risk"); actions.push("Check in today"); }
      if (c.trustScore < 40) { reasons.push(`Trust ${c.trustScore} — Supervised`); actions.push("Review messages"); }
      if (c.renewalDays < 14) { reasons.push(`Renews in ${c.renewalDays}d`); actions.push("Prepare renewal"); }
      if (c.status === "paused") { reasons.push("AI paused"); actions.push("Resume?"); }
      return { client: c, reasons, action: actions[0] ?? "Review" };
    });
}

interface BriefingButtonProps {
  onClick: () => void;
}

function BriefingTriggerButton({ onClick }: BriefingButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: "#4F46E5",
        color: "#fff",
        border: "none",
        borderRadius: 99,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(79,70,229,0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>📋</span> Today&apos;s Brief
    </button>
  );
}

export default function MorningBriefing() {
  const [open, setOpen] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);

  useEffect(() => {
    const auto = shouldShow();
    if (auto) {
      setOpen(true);
    } else {
      setShowTrigger(true); // show button if briefing was already dismissed today
    }
  }, []);

  const close = useCallback(() => {
    dismiss();
    setOpen(false);
    setShowTrigger(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  const exceptionClients = getExceptionClients();
  const supervisedUsage = `${systemStats.supervisedClients}/${systemStats.supervisedCap}`;
  const autoSendCount = autoApprovalQueue.length;
  const autoSendMinutes = autoApprovalQueue.length > 0
    ? Math.max(...autoApprovalQueue.map((a) => a.minutesRemaining))
    : 0;

  return (
    <>
      {showTrigger && !open && <BriefingTriggerButton onClick={() => setOpen(true)} />}

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            padding: "20px",
            paddingTop: 56, // below status bar
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 14,
              width: 420,
              maxHeight: "calc(100vh - 80px)",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f3f4f6",
                position: "sticky",
                top: 0,
                background: "#fff",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
                    ☀️ Good morning, אלון
                  </h2>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    {formatHebrewDate()}
                  </p>
                </div>
                <button
                  onClick={close}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                    padding: "2px 6px",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Agency health summary */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                {[
                  { label: "Overnight leads", value: overnightSummary.leadsReceived, color: "#059669" },
                  { label: "Auto-approved", value: overnightSummary.messagesAutoApproved, color: "#4F46E5" },
                  { label: "Supervised slots", value: supervisedUsage, color: systemStats.supervisedClients >= 10 ? "#dc2626" : "#d97706" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "#f9fafb",
                      borderRadius: 8,
                      padding: "8px 10px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      className="num-display"
                      dir="ltr"
                      style={{ fontSize: 20, fontWeight: 700, color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-approval alert */}
            {autoSendCount > 0 && (
              <div
                style={{
                  margin: "12px 16px 0",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>⏱</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>
                    {autoSendCount} message{autoSendCount > 1 ? "s" : ""} auto-sending in &lt;{autoSendMinutes} min
                  </div>
                  <div style={{ fontSize: 11, color: "#a16207", marginTop: 2 }}>
                    Intervene now if needed — go to Conversations
                  </div>
                </div>
              </div>
            )}

            {/* Exception clients */}
            <div style={{ padding: "12px 16px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                {exceptionClients.length} clients need attention today
              </div>

              {exceptionClients.length === 0 ? (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    padding: "12px",
                    fontSize: 13,
                    color: "#16a34a",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  ✅ All clients healthy — no exceptions today
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {exceptionClients.map(({ client, reasons, action }) => (
                    <div
                      key={client.id}
                      style={{
                        background: "#fafafa",
                        border: "1px solid #e5e7eb",
                        borderLeft: `3px solid ${
                          client.churnTier === "red" ? "#be123c"
                          : client.churnTier === "orange" ? "#ea580c"
                          : "#d97706"
                        }`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                          {client.name}
                        </div>
                        <div style={{ marginTop: 3 }}>
                          {reasons.map((r) => (
                            <div key={r} style={{ fontSize: 11, color: "#6b7280" }}>
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        style={{
                          fontSize: 10,
                          padding: "4px 9px",
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          cursor: "pointer",
                          color: "#374151",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {action}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overnight highlights */}
            {overnightSummary.highlights.length > 0 && (
              <div style={{ padding: "0 16px 12px" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                  }}
                >
                  Overnight activity
                </div>
                {overnightSummary.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      padding: "5px 0",
                      borderTop: "1px solid #f3f4f6",
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "#d1d5db" }}>›</span>
                    {h}
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: "12px 16px 16px" }}>
              <button
                onClick={close}
                style={{
                  width: "100%",
                  padding: "11px",
                  background: "#4F46E5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 9,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Start working →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
