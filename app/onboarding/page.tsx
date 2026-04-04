"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://converty-os-production.up.railway.app";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "";

// ─── Original onboarding flow steps ─────────────────────────────────────────

const STEPS = [
  { id: 1, label: "טופס קדם-שיחה", icon: "📋", desc: "הלקוח ממלא 24 שעות לפני השיחה" },
  { id: 2, label: "היסטוריית WhatsApp", icon: "💬", desc: "ייבוא + חילוץ טון (3-8 דקות)" },
  { id: 3, label: "בדיקת טון", icon: "✍️", desc: "אישור 5 טיוטות AI לדוגמה" },
  { id: 4, label: "חיבור קמפיינים", icon: "🔗", desc: "גישת Google/Meta API + סנכרון ראשוני" },
  { id: 5, label: "הגדרות מותג", icon: "🎨", desc: "לוגו, צבעים, פונט, סגנון תמונות" },
  { id: 6, label: "בדיקות Go-Live", icon: "🚀", desc: "אשר את כל 5 השערים לפני הודעה ראשונה" },
];

const GO_LIVE_GATES = [
  { label: "חילוץ טון נבדק על ידי מפעיל", done: false },
  { label: "סנכרון קמפיינים: סף מינימלי הושג", done: false },
  { label: "שלב QA B פעיל (גישה ל-DB לבדיקת עובדות)", done: false },
  { label: "הגדרות מותג קיימות", done: false },
  { label: "כללי אסקלציה מתועדים", done: false },
];

const SAMPLE_DRAFTS = [
  { lead: "שלום, ראיתי את המודעה שלכם - אפשר לקבל מחיר?", draft: "שלום! בשמחה. המחירים שלנו מותאמים אישית לכל לקוח. מה השירות שמעניין אותך ואיפה אתה נמצא? נחזור אליך עם הצעה מדויקת תוך שעה." },
  { lead: "מה שעות הפעילות שלכם?", draft: "אנחנו פעילים ראשון-חמישי 8:00-18:00, שישי 8:00-13:00. לשאלות דחופות אפשר לכתוב בכל שעה ונחזור בהקדם." },
  { lead: "יש לכם ניסיון עם עסקים כמו שלי?", draft: "כן, יש לנו ניסיון רב בתחום שלך. נשמח לספר לך על לקוחות דומים ותוצאות שהשגנו. אפשר לקבוע שיחה קצרה?" },
  { lead: "כמה זמן לוקחת העבודה?", draft: "הזמנים משתנים לפי הפרויקט, אבל בדרך כלל מדובר ב-X-Y ימים. נוכל לתת לך הערכה מדויקת יותר לאחר שנבין את הצרכים שלך." },
  { lead: "מה ההבדל בינכם לבין המתחרים?", draft: "ההבדל העיקרי הוא שאנחנו מתמחים בתחום שלך ומביאים ניסיון ספציפי. בנוסף, אנחנו מתחייבים לזמינות גבוהה ומעקב צמוד. מה הכי חשוב לך בספק?" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function Onboarding() {
  // Quick onboard state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    whatsappSent?: boolean;
  } | null>(null);

  // Full flow state
  const [activeStep, setActiveStep] = useState(0); // 0 = collapsed
  const [gates, setGates] = useState(GO_LIVE_GATES.map((g) => ({ ...g })));
  const [approvedDrafts, setApprovedDrafts] = useState<number[]>([]);

  const allGatesOk = gates.every((g) => g.done);
  const toggleGate = (i: number) => setGates((prev) => prev.map((g, idx) => idx === i ? { ...g, done: !g.done } : g));

  const validateIsraeliMobile = (p: string): boolean => {
    const digits = p.replace(/\D/g, '');
    return (digits.length === 10 && /^05[0-9]/.test(digits)) ||
           (digits.length === 12 && /^9725[0-9]/.test(digits));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (!validateIsraeliMobile(phone)) {
      setResult({
        success: false,
        message: 'מספר טלפון לא תקין. הזן מספר נייד ישראלי (למשל 054-260-4967)',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`;

      const res = await fetch(`${API_URL}/api/onboarding/quick`, {
        method: "POST",
        headers,
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
        message: `שגיאת תקשורת: ${err instanceof Error ? err.message : "שגיאה"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={{ padding: "18px 16px", maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>קליטת לקוח</h1>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>קליטה מהירה או תהליך קליטה מלא — שלב אחרי שלב</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: Quick Onboard — name + phone → WhatsApp
          ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        border: "2px solid #7C3AED",
        padding: "20px",
        marginBottom: 20,
        boxShadow: "0 1px 3px rgba(124,58,237,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{
            background: "#7C3AED",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
          }}>
            קליטה מהירה
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            הזן שם וטלפון — הלקוח יקבל הודעת WhatsApp עם הלינק ל-Pulse
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label htmlFor="qo-name" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              שם הלקוח
            </label>
            <input
              id="qo-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: יוסי כהן"
              dir="rtl"
              autoFocus
              disabled={loading}
              style={{
                width: "100%", fontSize: 14, padding: "9px 10px", borderRadius: 7,
                border: "1px solid #d1d5db", outline: "none", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <div style={{ flex: "1 1 180px" }}>
            <label htmlFor="qo-phone" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              מספר טלפון
            </label>
            <input
              id="qo-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="054-260-4967"
              dir="ltr"
              disabled={loading}
              style={{
                width: "100%", fontSize: 14, padding: "9px 10px", borderRadius: 7,
                border: "1px solid #d1d5db", direction: "ltr", textAlign: "left",
                outline: "none", fontVariantNumeric: "tabular-nums", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(e); } }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !phone.trim()}
            style={{
              flex: "0 0 auto",
              fontSize: 13, fontWeight: 700, padding: "9px 20px", borderRadius: 7,
              border: "none",
              cursor: loading || !name.trim() || !phone.trim() ? "not-allowed" : "pointer",
              background: loading || !name.trim() || !phone.trim() ? "#e5e7eb" : "#7C3AED",
              color: loading || !name.trim() || !phone.trim() ? "#9ca3af" : "#fff",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "שולח..." : "שלח WhatsApp ללקוח"}
          </button>
        </form>

        {/* Result feedback */}
        {result && (
          <div style={{
            marginTop: 12, padding: "10px 12px", borderRadius: 8,
            border: `1px solid ${result.success ? "#bbf7d0" : "#fecaca"}`,
            background: result.success ? "#f0fdf4" : "#fef2f2",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>
              {result.success ? (result.whatsappSent ? "✅" : "⚠️") : "❌"}
            </span>
            <span style={{ fontSize: 12, color: result.success ? "#166534" : "#991b1b", fontWeight: 500 }}>
              {result.message}
            </span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: Full Onboarding Flow (collapsible)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={() => setActiveStep(activeStep === 0 ? 1 : 0)}
          style={{
            width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
            padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>תהליך קליטה מלא</span>
            <span style={{ fontSize: 12, color: "#6b7280", marginRight: 8 }}> — 6 שלבים</span>
          </div>
          <span style={{ fontSize: 16, color: "#6b7280", transform: activeStep > 0 ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
        </button>
      </div>

      {activeStep > 0 && (
        <>
          {/* Steps nav */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginBottom: 20, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                style={{
                  flex: "1 1 auto", minWidth: 80, padding: "10px 8px", border: "none",
                  borderLeft: i < STEPS.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: activeStep === step.id ? "#4F46E5" : "#fff",
                  cursor: "pointer", textAlign: "center",
                }}
              >
                <div style={{ fontSize: 16 }}>{step.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: activeStep === step.id ? "#fff" : "#374151", marginTop: 3, whiteSpace: "nowrap" }}>
                  {step.label}
                </div>
              </button>
            ))}
          </div>

          {/* Step 3: Tone review */}
          {activeStep === 3 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>בדיקת טון — 5 טיוטות לדוגמה</h2>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>בדוק ואשר כל הודעה שנוצרה ע״י AI. המערכת תתאים את הטון בהתאם.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {SAMPLE_DRAFTS.map((s, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderBottom: i < SAMPLE_DRAFTS.length - 1 ? "1px solid #f3f4f6" : "none", background: approvedDrafts.includes(i) ? "#f0fdf4" : "#fff" }}>
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>הליד אמר:</div>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{s.lead}</p>
                    </div>
                    <div style={{ background: "#eef2ff", borderRadius: 6, padding: "8px 10px", marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#4F46E5", fontWeight: 600, marginBottom: 3 }}>טיוטת AI</div>
                      <p style={{ fontSize: 12, color: "#312e81", margin: 0 }}>{s.draft}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setApprovedDrafts((p) => p.includes(i) ? p : [...p, i])}
                        style={{
                          fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer", fontWeight: 600,
                          background: approvedDrafts.includes(i) ? "#dcfce7" : "#f3f4f6",
                          color: approvedDrafts.includes(i) ? "#16a34a" : "#374151",
                        }}
                      >
                        {approvedDrafts.includes(i) ? "✓ מאושר" : "אשר טון"}
                      </button>
                      <button style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#374151" }}>
                        ערוך
                      </button>
                      <button style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", cursor: "pointer", color: "#dc2626" }}>
                        דחה
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 16px", background: "#fafafa", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{approvedDrafts.length}/5 טיוטות אושרו</span>
                <button
                  disabled={approvedDrafts.length < 5}
                  onClick={() => setActiveStep(4)}
                  style={{
                    fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "none", cursor: approvedDrafts.length < 5 ? "default" : "pointer", fontWeight: 600,
                    background: approvedDrafts.length >= 5 ? "#4F46E5" : "#e5e7eb",
                    color: approvedDrafts.length >= 5 ? "#fff" : "#9ca3af",
                  }}
                >
                  המשך לחיבור קמפיינים ←
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Go-live gates */}
          {activeStep === 6 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>בדיקות Go-Live</h2>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>כל 5 השערים חייבים להיות מושלמים לפני שליחת הודעה ראשונה.</p>
              </div>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {gates.map((gate, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                    <button
                      onClick={() => toggleGate(i)}
                      style={{
                        width: 20, height: 20, borderRadius: 5, border: `2px solid ${gate.done ? "#22c55e" : "#d1d5db"}`,
                        background: gate.done ? "#22c55e" : "#fff", cursor: "pointer", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {gate.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </button>
                    <span style={{ fontSize: 13, color: gate.done ? "#374151" : "#6b7280" }}>
                      {gate.label}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                <button
                  disabled={!allGatesOk}
                  style={{
                    width: "100%", fontSize: 13, padding: "10px", borderRadius: 7, border: "none", fontWeight: 700,
                    cursor: allGatesOk ? "pointer" : "default",
                    background: allGatesOk ? "#22c55e" : "#e5e7eb",
                    color: allGatesOk ? "#fff" : "#9ca3af",
                  }}
                >
                  {allGatesOk ? "🚀 השק לקוח — הודעה ראשונה מופעלת" : `השלם ${gates.filter((g) => !g.done).length} שערים נותרים`}
                </button>
              </div>
            </div>
          )}

          {/* Generic step placeholder */}
          {activeStep !== 3 && activeStep !== 6 && activeStep > 0 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{STEPS[activeStep - 1].icon}</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>{STEPS[activeStep - 1].label}</h2>
              <p style={{ fontSize: 13, color: "#6b7280" }}>{STEPS[activeStep - 1].desc}</p>
              <button
                onClick={() => setActiveStep(Math.min(6, activeStep + 1))}
                style={{ marginTop: 14, fontSize: 12, padding: "8px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 600 }}
              >
                המשך ←
              </button>
            </div>
          )}
        </>
      )}

      {/* Info box */}
      <div style={{
        marginTop: 20, padding: "14px 16px", borderRadius: 10,
        background: "#f5f0fd", border: "1px solid #e9e1f9",
      }}>
        <div style={{ fontSize: 12, color: "#6b21a8", fontWeight: 600, marginBottom: 6 }}>
          מה קורה בקליטה מהירה?
        </div>
        <ul style={{ fontSize: 12, color: "#7c3aed", margin: 0, paddingRight: 16, paddingLeft: 0, lineHeight: 1.7 }}>
          <li>נוצר חשבון לקוח ב-Converty OS</li>
          <li>נוצר טננט Pulse (מערכת מעקב לידים)</li>
          <li>הלקוח מקבל הודעת WhatsApp עם הלינק לאפליקציה</li>
          <li>אם הלקוח עונה תוך 48 שעות — אתה מקבל התראת Telegram</li>
        </ul>
      </div>
    </div>
  );
}
