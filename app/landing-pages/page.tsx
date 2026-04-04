"use client";

export default function LandingPages() {
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
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            <circle cx="7" cy="6" r="1" fill="#7C3AED"/><circle cx="10" cy="6" r="1" fill="#7C3AED"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          דפי נחיתה
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 6px" }}>
          בקרוב
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }} dir="rtl">
          בניית דפי נחיתה אוטומטית עם AI — יצירת דפי נחיתה בעברית
          מותאמים אישית לכל לקוח, עם A/B Testing מובנה,
          ביצועים חיים, והמלצות לשיפור המרות.
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
