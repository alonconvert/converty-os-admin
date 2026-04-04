"use client";

export default function SearchTerms() {
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
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="8" x2="14" y2="8"/><line x1="8" y1="11" x2="12" y2="11"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          מונחי חיפוש
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 6px" }}>
          בקרוב
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }} dir="rtl">
          ניהול מונחי חיפוש חכם — סקירה אוטומטית של מונחי חיפוש מ-Google Ads,
          זיהוי מונחים שליליים, והמלצות AI לאופטימיזציה.
          כל הממצאים מוצגים לאישור המפעיל לפני ביצוע.
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
