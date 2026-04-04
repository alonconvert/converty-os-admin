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
      className="fixed bottom-5 right-5 bg-[var(--brand)] text-white border-none rounded-full px-3.5 py-2 text-xs font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-shadow z-[1000] flex items-center gap-1.5"
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
          className="fixed inset-0 bg-black/65 z-[9999] flex items-start justify-end p-5 pt-14"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[14px] w-[420px] max-h-[calc(100vh-80px)] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-[1] rounded-t-[14px]">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
                    ☀️ Good morning, אלון
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatHebrewDate()}
                  </p>
                </div>
                <button
                  onClick={close}
                  aria-label="סגור"
                  className="bg-transparent border-none text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none p-0 min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Agency health summary */}
              <div className="grid grid-cols-3 gap-2 mt-3.5">
                {[
                  { label: "Overnight leads", value: overnightSummary.leadsReceived, color: "#059669" },
                  { label: "Auto-approved", value: overnightSummary.messagesAutoApproved, color: "#7C3AED" },
                  { label: "Supervised slots", value: supervisedUsage, color: systemStats.supervisedClients >= 10 ? "#dc2626" : "#d97706" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-[#f9fafb] rounded-lg px-2.5 py-2 text-center"
                  >
                    <div
                      className="num-display text-xl font-bold"
                      dir="ltr"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-approval alert */}
            {autoSendCount > 0 && (
              <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex gap-2 items-start">
                <span className="text-base leading-none">⏱</span>
                <div>
                  <div className="text-xs font-semibold text-amber-800">
                    {autoSendCount} message{autoSendCount > 1 ? "s" : ""} auto-sending in &lt;{autoSendMinutes} min
                  </div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    Intervene now if needed — go to Conversations
                  </div>
                </div>
              </div>
            )}

            {/* Exception clients */}
            <div className="p-4">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                {exceptionClients.length} clients need attention today
              </div>

              {exceptionClients.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600 font-semibold text-center">
                  ✅ All clients healthy — no exceptions today
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {exceptionClients.map(({ client, reasons, action }) => (
                    <div
                      key={client.id}
                      className="bg-[#f9fafb] border border-gray-200 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2.5 hover:bg-[#F5F3FF] transition-colors"
                      style={{
                        borderLeftWidth: 3,
                        borderLeftColor:
                          client.churnTier === "red" ? "#be123c"
                          : client.churnTier === "orange" ? "#ea580c"
                          : "#d97706",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {client.name}
                        </div>
                        <div className="mt-0.5">
                          {reasons.map((r) => (
                            <div key={r} className="text-xs text-gray-600">
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-md cursor-pointer text-gray-700 font-semibold whitespace-nowrap shrink-0 hover:bg-[#F5F3FF] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors">
                        {action}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overnight highlights */}
            {overnightSummary.highlights.length > 0 && (
              <div className="px-4 pb-3">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Overnight activity
                </div>
                {overnightSummary.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="text-xs text-gray-600 py-1.5 border-t border-gray-100 flex gap-1.5"
                  >
                    <span className="text-gray-400">›</span>
                    {h}
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="px-4 pt-3 pb-4">
              <button
                onClick={close}
                className="w-full py-2.5 bg-[var(--brand)] text-white border-none rounded-[9px] text-sm font-semibold cursor-pointer hover:bg-[#6D28D9] transition-colors shadow-md"
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
