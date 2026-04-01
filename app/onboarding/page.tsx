"use client";

import { useState } from "react";

const STEPS = [
  { id: 1, label: "Pre-Intake Form", icon: "📋", desc: "Client fills 24h before session" },
  { id: 2, label: "WhatsApp History", icon: "💬", desc: "Import + tone extraction (3-8 min)" },
  { id: 3, label: "Tone Review", icon: "✍️", desc: "Approve 5 AI-drafted sample messages" },
  { id: 4, label: "Campaign OAuth", icon: "🔗", desc: "Google/Meta API access + initial sync" },
  { id: 5, label: "Brand Config", icon: "🎨", desc: "Logo, colors, font, image style" },
  { id: 6, label: "Go-Live Gates", icon: "🚀", desc: "Confirm all 5 gates before first message" },
];

const GO_LIVE_GATES = [
  { label: "Tone extraction reviewed by operator", done: false },
  { label: "Campaign sync status: minimum threshold reached", done: false },
  { label: "QA Phase B enabled (DB access for fact-checking)", done: false },
  { label: "Brand config present", done: false },
  { label: "Escalation rules documented", done: false },
];

const SAMPLE_DRAFTS = [
  { lead: "שלום, ראיתי את המודעה שלכם - אפשר לקבל מחיר?", draft: "שלום! בשמחה. המחירים שלנו מותאמים אישית לכל לקוח. מה השירות שמעניין אותך ואיפה אתה נמצא? נחזור אליך עם הצעה מדויקת תוך שעה." },
  { lead: "מה שעות הפעילות שלכם?", draft: "אנחנו פעילים ראשון-חמישי 8:00-18:00, שישי 8:00-13:00. לשאלות דחופות אפשר לכתוב בכל שעה ונחזור בהקדם." },
  { lead: "יש לכם ניסיון עם עסקים כמו שלי?", draft: "כן, יש לנו ניסיון רב בתחום שלך. נשמח לספר לך על לקוחות דומים ותוצאות שהשגנו. אפשר לקבוע שיחה קצרה?" },
  { lead: "כמה זמן לוקחת העבודה?", draft: "הזמנים משתנים לפי הפרויקט, אבל בדרך כלל מדובר ב-X-Y ימים. נוכל לתת לך הערכה מדויקת יותר לאחר שנבין את הצרכים שלך." },
  { lead: "מה ההבדל בינכם לבין המתחרים?", draft: "ההבדל העיקרי הוא שאנחנו מתמחים בתחום שלך ומביאים ניסיון ספציפי. בנוסף, אנחנו מתחייבים לזמינות גבוהה ומעקב צמוד. מה הכי חשוב לך בספק?" },
];

export default function Onboarding() {
  const [activeStep, setActiveStep] = useState(1);
  const [gates, setGates] = useState(GO_LIVE_GATES.map((g) => ({ ...g })));
  const [approvedDrafts, setApprovedDrafts] = useState<number[]>([]);
  const [clientName, setClientName] = useState("");

  const allGatesOk = gates.every((g) => g.done);
  const toggleGate = (i: number) => setGates((prev) => prev.map((g, idx) => idx === i ? { ...g, done: !g.done } : g));

  return (
    <div style={{ padding: "18px 20px", maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Client Onboarding</h1>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Step-by-step flow — complete all gates before first message sends</p>
      </div>

      {/* Client name input */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px", marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Client Name</label>
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g. מרפאת שיניים ישראלי"
          dir="rtl"
          style={{ width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", direction: "rtl" }}
        />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            style={{
              flex: 1, padding: "10px 8px", border: "none", borderRight: i < STEPS.length - 1 ? "1px solid #f3f4f6" : "none",
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

      {/* Step content */}
      {activeStep === 3 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Tone Review — 5 Sample Drafts</h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Review and approve each AI-drafted message. The AI will match this tone going forward.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {SAMPLE_DRAFTS.map((s, i) => (
              <div key={i} style={{ padding: "12px 16px", borderBottom: i < SAMPLE_DRAFTS.length - 1 ? "1px solid #f3f4f6" : "none", background: approvedDrafts.includes(i) ? "#f0fdf4" : "#fff" }}>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Lead said:</div>
                  <p dir="rtl" style={{ fontSize: 12, color: "#6b7280", margin: 0, textAlign: "right" }}>{s.lead}</p>
                </div>
                <div style={{ background: "#eef2ff", borderRadius: 6, padding: "8px 10px", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#4F46E5", fontWeight: 600, marginBottom: 3 }}>AI Draft</div>
                  <p dir="rtl" style={{ fontSize: 12, color: "#312e81", margin: 0, textAlign: "right" }}>{s.draft}</p>
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
                    {approvedDrafts.includes(i) ? "✓ Approved" : "Approve Tone"}
                  </button>
                  <button style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#374151" }}>
                    Edit Draft
                  </button>
                  <button style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", cursor: "pointer", color: "#dc2626" }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", background: "#fafafa", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{approvedDrafts.length}/5 drafts approved</span>
            <button
              disabled={approvedDrafts.length < 5}
              onClick={() => setActiveStep(4)}
              style={{
                fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "none", cursor: approvedDrafts.length < 5 ? "default" : "pointer", fontWeight: 600,
                background: approvedDrafts.length >= 5 ? "#4F46E5" : "#e5e7eb",
                color: approvedDrafts.length >= 5 ? "#fff" : "#9ca3af",
              }}
            >
              Continue to Campaign OAuth →
            </button>
          </div>
        </div>
      )}

      {activeStep === 6 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Go-Live Gates</h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>All 5 must be complete before first message sends.</p>
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
                <span style={{ fontSize: 13, color: gate.done ? "#374151" : "#6b7280", textDecoration: gate.done ? "none" : "none" }}>
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
              {allGatesOk ? "🚀 Launch Client — First Message Enabled" : `Complete ${gates.filter((g) => !g.done).length} remaining gates`}
            </button>
          </div>
        </div>
      )}

      {activeStep !== 3 && activeStep !== 6 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{STEPS[activeStep - 1].icon}</div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>{STEPS[activeStep - 1].label}</h2>
          <p style={{ fontSize: 13, color: "#6b7280" }}>{STEPS[activeStep - 1].desc}</p>
          <button
            onClick={() => setActiveStep(Math.min(6, activeStep + 1))}
            style={{ marginTop: 14, fontSize: 12, padding: "8px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 600 }}
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
