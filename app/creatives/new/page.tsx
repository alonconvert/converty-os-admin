"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchClients, type DbClient } from "@/lib/db";
import { createBatch } from "@/lib/meta-api";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--card-border)",
  borderRadius: 10,
  boxShadow: "var(--card-shadow)",
  overflow: "hidden",
};

export default function NewBatchPage() {
  const router = useRouter();
  const [clients, setClients] = useState<DbClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [clientId, setClientId] = useState("");
  const [batchSize, setBatchSize] = useState(5);
  const [transcriptMode, setTranscriptMode] = useState<"auto" | "paste">("auto");
  const [transcriptText, setTranscriptText] = useState("");

  useEffect(() => {
    fetchClients().then((c) => {
      setClients(c);
      setLoading(false);
    });
  }, []);

  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!clientId) {
      setError("יש לבחור לקוח");
      return;
    }
    // Show confirmation step first
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createBatch({
        clientId,
        batchSize,
        ...(transcriptMode === "paste" && transcriptText
          ? { transcriptText }
          : {}),
      });
      // Show saved confirmation before redirect
      setSaved(true);
      await new Promise((r) => setTimeout(r, 1500));
      router.push(`/creatives?batchId=${result.batch.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת באצ׳");
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1100 }}>
      {/* Back link */}
      <Link
        href="/creatives"
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 12,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        חזרה לרשימה
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          באצ׳ קריאייטיב חדש
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
          יצירת סט תמונות חדש ללקוח — מטרנסקריפט לתמונות מוכנות לפרסום
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }} className="responsive-grid-2-sidebar">
        {/* Form card */}
        <div style={{ ...CARD, padding: "24px 28px" }} className="kpi-enter kpi-enter-1">
          {loading ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <div className="pill-pulse" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                טוען לקוחות...
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Client */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: clientId ? "#059669" : "var(--brand)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                  >
                    {clientId ? "✓" : "1"}
                  </span>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    בחירת לקוח
                  </label>
                </div>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--card-border)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    background: "#fff",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "border-color 0.15s",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
                >
                  <option value="">— בחר לקוח —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Batch size */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--brand)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    2
                  </span>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    כמות קריאייטיבים
                  </label>
                </div>
                <div
                  style={{
                    background: "#f9fafb",
                    borderRadius: 8,
                    padding: "14px 16px",
                    border: "1px solid #f3f4f6",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--brand)", height: 4 }}
                    />
                    <span
                      className="num-display"
                      style={{
                        fontSize: 24,
                        color: "var(--brand)",
                        minWidth: 36,
                        textAlign: "center",
                      }}
                    >
                      {batchSize}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "var(--text-placeholder)" }}>
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Transcript */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--brand)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    3
                  </span>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    מקור טרנסקריפט
                  </label>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 2,
                    background: "#f3f4f6",
                    borderRadius: 10,
                    padding: 3,
                    width: "fit-content",
                    marginBottom: 12,
                  }}
                >
                  {(
                    [
                      { key: "auto", label: "אוטומטי מ-Timeless", icon: "⚡" },
                      { key: "paste", label: "הדבקה ידנית", icon: "📋" },
                    ] as const
                  ).map((opt) => {
                    const isActive = transcriptMode === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setTranscriptMode(opt.key)}
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                          background: isActive ? "#fff" : "transparent",
                          color: isActive ? "var(--text-primary)" : "var(--text-placeholder)",
                          boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          transition: "all 0.15s",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {transcriptMode === "paste" ? (
                  <textarea
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    placeholder="הדבק את הטרנסקריפט של שיחת האסטרטגיה כאן..."
                    dir="rtl"
                    style={{
                      width: "100%",
                      minHeight: 140,
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--card-border)",
                      fontSize: 13,
                      fontFamily: "inherit",
                      resize: "vertical",
                      color: "var(--text-primary)",
                      lineHeight: 1.6,
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      background: "#ECFDF5",
                      borderRadius: 8,
                      padding: "12px 14px",
                      border: "1px solid #A7F3D0",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: "#065F46", fontWeight: 500 }}>
                      הטרנסקריפט יילקח אוטומטית מ-Timeless לפי הלקוח שנבחר
                    </span>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#991B1B",
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Saved confirmation */}
              {saved && (
                <div
                  style={{
                    background: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    borderRadius: 10,
                    padding: "16px 20px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    animation: "adminCountUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>
                      הטרנסקריפט נשמר בהצלחה
                    </div>
                    <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
                      {selectedClient?.name} — {batchSize} קריאייטיבים · מעביר למסך הייצור...
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation step */}
              {showConfirm && !saved && !submitting && (
                <div
                  style={{
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    borderRadius: 10,
                    padding: "16px 18px",
                    marginBottom: 16,
                    animation: "adminCountUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>
                    אישור לפני שליחה
                  </div>
                  <div dir="rtl" style={{ fontSize: 12, color: "#78350F", lineHeight: 1.6, marginBottom: 12 }}>
                    <strong>{selectedClient?.name}</strong> — {batchSize} קריאייטיבים
                    {transcriptMode === "paste" && transcriptText ? ` · טרנסקריפט ידני (${transcriptText.length} תווים)` : " · טרנסקריפט אוטומטי"}
                    <br />
                    <span style={{ fontSize: 11, color: "#92400E" }}>
                      אחרי היצירה תוכל לסקור, לאשר או לדחות כל קונספט בנפרד.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleSubmit}
                      style={{
                        fontSize: 12,
                        padding: "8px 18px",
                        borderRadius: 6,
                        border: "none",
                        background: "var(--brand)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 2px 8px rgba(124,58,237,0.25)",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      אישור — צור באצ׳
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      style={{
                        fontSize: 12,
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--card-border)",
                        background: "#fff",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      חזור ותקן
                    </button>
                  </div>
                </div>
              )}

              {/* Submit */}
              {!saved && !showConfirm && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !clientId}
                  style={{
                    fontSize: 14,
                    padding: "11px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: submitting || !clientId ? "#c4b5fd" : "var(--brand)",
                    color: "#fff",
                    cursor: submitting || !clientId ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    width: "100%",
                    boxShadow: submitting || !clientId ? "none" : "0 2px 8px rgba(124,58,237,0.25)",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting && clientId) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,58,237,0.35)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = submitting || !clientId ? "none" : "0 2px 8px rgba(124,58,237,0.25)";
                  }}
                >
                  המשך
                </button>
              )}

              {/* Submitting state */}
              {submitting && !saved && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "11px 24px",
                    borderRadius: 8,
                    background: "#c4b5fd",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  <span className="pill-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                  שומר ויוצר באצ׳...
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="kpi-enter kpi-enter-2" style={{ ...CARD, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
            סיכום
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-placeholder)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3 }}>
                לקוח
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: selectedClient ? "var(--text-primary)" : "var(--text-placeholder)" }}>
                {selectedClient?.name || "לא נבחר"}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-placeholder)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3 }}>
                כמות תמונות
              </div>
              <div className="num-display" style={{ fontSize: 22, color: "var(--brand)" }}>
                {batchSize}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-placeholder)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3 }}>
                מקור
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                {transcriptMode === "auto" ? "Timeless (אוטומטי)" : "הדבקה ידנית"}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-placeholder)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3 }}>
                פורמטים
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["1080x1080", "1080x1920", "1200x628", "1080x1350"].map((size) => (
                  <span
                    key={size}
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#f3f4f6",
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
