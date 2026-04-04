"use client";

export default function Referrals() {
  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: "48px 24px",
          textAlign: "center",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", display: "block", opacity: 0.7 }}>
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/><path d="M20 12H4"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          הפניות
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 6px" }}>
          בקרוב
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }} dir="rtl">
          תוכנית הפניות אוטומטית — מעקב אחר הפניות של לקוחות קיימים,
          שליחת בקשות הפניה חכמות בזמן הנכון (אחרי הצלחות),
          תגמולים ומעקב אחר המרות מהפניות.
        </p>
        <div
          style={{
            marginTop: 20,
            padding: "8px 16px",
            background: "var(--brand-light)",
            borderRadius: 8,
            display: "inline-block",
            fontSize: 12,
            color: "var(--brand)",
            fontWeight: 600,
          }}
        >
          מודול בפיתוח
        </div>
      </div>
    </div>
  );
}
