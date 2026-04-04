"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://converty-os-production.up.railway.app";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    whatsappSent?: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/onboarding/quick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          success: true,
          message: data.whatsappSent
            ? `${name} קיבל הודעת WhatsApp עם הלינק לאפליקציה`
            : `הלקוח נוצר בהצלחה. שליחת WhatsApp נכשלה — שלח ידנית`,
          whatsappSent: data.whatsappSent,
        });
        setName("");
        setPhone("");
      } else {
        setResult({
          success: false,
          message: data.error || "שגיאה לא צפויה",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: `שגיאת תקשורת: ${err instanceof Error ? err.message : "Unknown"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "18px 16px", maxWidth: 560, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
          קליטת לקוח חדש
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          הזן שם ומספר טלפון — הלקוח יקבל הודעת WhatsApp עם הלינק ל-Pulse
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="client-name"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              שם הלקוח
            </label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: יוסי כהן"
              dir="rtl"
              autoFocus
              disabled={loading}
              style={{
                width: "100%",
                fontSize: 15,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                direction: "rtl",
                outline: "none",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="client-phone"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              מספר טלפון
            </label>
            <input
              id="client-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="054-260-4967"
              dir="ltr"
              disabled={loading}
              style={{
                width: "100%",
                fontSize: 15,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                direction: "ltr",
                textAlign: "left",
                outline: "none",
                transition: "border-color 0.15s",
                fontVariantNumeric: "tabular-nums",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim() || !phone.trim()}
            style={{
              width: "100%",
              fontSize: 14,
              fontWeight: 700,
              padding: "12px",
              borderRadius: 8,
              border: "none",
              cursor: loading || !name.trim() || !phone.trim() ? "not-allowed" : "pointer",
              background:
                loading || !name.trim() || !phone.trim()
                  ? "#e5e7eb"
                  : "#7C3AED",
              color:
                loading || !name.trim() || !phone.trim()
                  ? "#9ca3af"
                  : "#fff",
              transition: "background 0.15s",
            }}
          >
            {loading ? "שולח..." : "שלח הודעת WhatsApp ללקוח"}
          </button>
        </div>
      </form>

      {/* Result */}
      {result && (
        <div
          style={{
            marginTop: 16,
            padding: "14px 16px",
            borderRadius: 10,
            border: `1px solid ${result.success ? "#bbf7d0" : "#fecaca"}`,
            background: result.success ? "#f0fdf4" : "#fef2f2",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>
            {result.success ? (result.whatsappSent ? "✅" : "⚠️") : "❌"}
          </span>
          <span
            dir="rtl"
            style={{
              fontSize: 13,
              color: result.success ? "#166534" : "#991b1b",
              fontWeight: 500,
              textAlign: "right",
            }}
          >
            {result.message}
          </span>
        </div>
      )}

      {/* Info */}
      <div
        style={{
          marginTop: 20,
          padding: "14px 16px",
          borderRadius: 10,
          background: "#f5f0fd",
          border: "1px solid #e9e1f9",
        }}
      >
        <div
          dir="rtl"
          style={{ fontSize: 12, color: "#6b21a8", fontWeight: 600, marginBottom: 6 }}
        >
          מה קורה כשלוחצים?
        </div>
        <ul
          dir="rtl"
          style={{
            fontSize: 12,
            color: "#7c3aed",
            margin: 0,
            paddingRight: 16,
            paddingLeft: 0,
            lineHeight: 1.7,
          }}
        >
          <li>נוצר חשבון לקוח ב-Converty OS</li>
          <li>נוצר טננט Pulse (מערכת מעקב לידים)</li>
          <li>הלקוח מקבל הודעת WhatsApp עם הלינק לאפליקציה</li>
          <li>ההודעה כוללת 3 צעדים פשוטים להתחלה</li>
        </ul>
      </div>
    </div>
  );
}
