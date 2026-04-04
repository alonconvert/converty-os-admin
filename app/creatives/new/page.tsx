"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchClients, type DbClient } from "@/lib/db";
import { createBatch } from "@/lib/meta-api";

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

  const handleSubmit = async () => {
    if (!clientId) {
      setError("יש לבחור לקוח");
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
      router.push(`/creatives?batchId=${result.batch.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת באצ׳");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "18px 16px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/creatives"
          style={{
            fontSize: 12,
            color: "#6b7280",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>&larr;</span> חזרה לרשימה
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
          באצ׳ קריאייטיב חדש
        </h1>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
          יצירת סט תמונות חדש ללקוח
        </p>
      </div>

      {/* Form card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          padding: "20px 24px",
          maxWidth: 600,
        }}
      >
        {loading ? (
          <div style={{ fontSize: 13, color: "#9ca3af", padding: "20px 0" }}>טוען לקוחות...</div>
        ) : (
          <>
            {/* Client select */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}
              >
                לקוח
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 13,
                  fontFamily: "inherit",
                  background: "#fff",
                  color: "#111827",
                  cursor: "pointer",
                }}
              >
                <option value="">— בחר לקוח —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch size slider */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}
              >
                כמות קריאייטיבים
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "#7C3AED" }}
                />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#7C3AED",
                    minWidth: 32,
                    textAlign: "center",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {batchSize}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                1–50 תמונות לכל באצ׳
              </div>
            </div>

            {/* Transcript source toggle */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}
              >
                מקור טרנסקריפט
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  background: "#f3f4f6",
                  borderRadius: 8,
                  padding: 3,
                  width: "fit-content",
                  marginBottom: 10,
                }}
              >
                {(
                  [
                    { key: "auto", label: "אוטומטי" },
                    { key: "paste", label: "הדבקה ידנית" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTranscriptMode(opt.key)}
                    style={{
                      fontSize: 12,
                      padding: "5px 14px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      background: transcriptMode === opt.key ? "#fff" : "transparent",
                      color: transcriptMode === opt.key ? "#111827" : "#9ca3af",
                      boxShadow: transcriptMode === opt.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {transcriptMode === "paste" ? (
                <textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="הדבק את הטרנסקריפט כאן..."
                  dir="rtl"
                  style={{
                    width: "100%",
                    minHeight: 120,
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical",
                    color: "#111827",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    background: "#f9fafb",
                    borderRadius: 6,
                    padding: "10px 12px",
                    border: "1px solid #f3f4f6",
                  }}
                >
                  הטרנסקריפט יילקח אוטומטית מ-Timeless לפי הלקוח שנבחר
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: 6,
                  padding: "8px 12px",
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                fontSize: 13,
                padding: "9px 20px",
                borderRadius: 6,
                border: "none",
                background: submitting ? "#c4b5fd" : "#7C3AED",
                color: "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: 600,
                width: "100%",
              }}
            >
              {submitting ? "...יוצר" : "צור באצ׳"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
