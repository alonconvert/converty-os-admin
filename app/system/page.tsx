import { mockSystemLogs, systemStats, canaryDeployment } from "@/lib/mock-data";
import Link from "next/link";

const services = [
  { name: "Railway Backend", status: "healthy", latency: "42ms", uptime: systemStats.uptime },
  { name: "Supabase DB", status: "healthy", latency: "18ms", uptime: "99.9%" },
  { name: "Green API (WhatsApp)", status: "healthy", latency: "120ms", uptime: "98.1%" },
  { name: "Claude API", status: "healthy", latency: "890ms", uptime: "99.7%" },
  { name: "Telegram Bot", status: "healthy", latency: "55ms", uptime: "100%" },
  { name: "Google Ads API", status: "healthy", latency: "340ms", uptime: "99.5%" },
  { name: "Meta Marketing API", status: "healthy", latency: "280ms", uptime: "99.3%" },
  { name: "Voicenter", status: "unconfigured", latency: "—", uptime: "—" },
];

export default function System() {
  return (
    <div style={{ padding: "18px 20px", maxWidth: 1440 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>System</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Infrastructure, kill switch, logs, prompt versions</p>
        </div>
        <Link
          href="/system/prompts"
          style={{
            fontSize: 11, padding: "6px 12px", borderRadius: 6, background: "#f5f3ff", color: "#7c3aed",
            border: "1px solid #e9d5ff", textDecoration: "none", fontWeight: 600,
          }}
        >
          ⚗ Canary Dashboard →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
        {/* Kill Switch */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 18px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 14px" }}>Global Kill Switch</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>System Active</span>
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2, marginLeft: 15 }}>All AI agents running normally</p>
            </div>
            <div style={{ width: 48, height: 26, borderRadius: 13, background: "#22c55e", display: "flex", alignItems: "center", padding: 3, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", marginLeft: "auto" }} />
            </div>
          </div>
          <button style={{
            width: "100%", fontSize: 12, padding: "8px", background: "#fef2f2", color: "#dc2626",
            border: "1px solid #fca5a5", borderRadius: 7, cursor: "pointer", fontWeight: 600,
          }}>
            ⛔ Emergency Stop All AI
          </button>
          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 6, textAlign: "center" }}>
            Telegram: /kill or /resume
          </p>

          {/* Canary deployment */}
          {canaryDeployment.active && (
            <div style={{ marginTop: 14, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 6 }}>
                ⚗ Canary {canaryDeployment.version} — {canaryDeployment.hoursRemaining}h remaining
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                {canaryDeployment.clients.length} clients in canary group
              </div>
              {[
                { label: "Approval rate", value: `${canaryDeployment.approvalRate}%`, baseline: `${canaryDeployment.baselineApprovalRate}%` },
                { label: "QA pass rate", value: `${canaryDeployment.qaPassRate}%`, baseline: `${canaryDeployment.baselineQaPassRate}%` },
                { label: "Edit rate", value: `${canaryDeployment.editRate}%`, baseline: `${canaryDeployment.baselineEditRate}%` },
              ].map((m) => (
                <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                  <span style={{ color: "#6b7280" }}>{m.label}</span>
                  <span style={{ fontWeight: 700, color: "#7c3aed" }}>{m.value} <span style={{ color: "#9ca3af", fontWeight: 400 }}>(baseline {m.baseline})</span></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service health */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 18px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Service Health</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {services.map((svc) => (
              <div
                key={svc.name}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 12px", background: "#f9fafb", borderRadius: 7,
                  border: `1px solid ${svc.status === "degraded" ? "#fde68a" : svc.status === "unconfigured" ? "#f3f4f6" : "transparent"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0, display: "inline-block",
                    background: svc.status === "healthy" ? "#22c55e" : svc.status === "degraded" ? "#f59e0b" : "#d1d5db",
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#374151" }}>{svc.name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{svc.latency}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{svc.uptime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nightly optimization loop */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Nightly Optimization Loop</h2>
          <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 3, background: "#f0fdf4", color: "#16a34a", fontWeight: 700 }}>✓ COMPLETED</span>
        </div>
        <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Last Run", value: "03:00 IST", sub: "Apr 1, 2026" },
            { label: "Next Run", value: "03:00 IST", sub: "Apr 2, 2026" },
            { label: "Campaigns Reviewed", value: "21", sub: "of 21 active" },
            { label: "Actions Taken", value: "3", sub: "1 bid · 2 keywords" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#f9fafb", borderRadius: 7, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Serif Display', serif" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 14px 12px", borderTop: "1px solid #f9fafb" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginBottom: 6, marginTop: 8 }}>LAST LOOP ACTIONS</div>
          {[
            { icon: "▲", msg: "מרפאת שיניים לוי — ציפויים ואסתטיקה: Target CPA increase queued for operator approval", color: "#d97706" },
            { icon: "✓", msg: "גרינברג נדל\"ן — דירות מרכז: Bid -8% on mobile (autonomous, executed)", color: "#059669" },
            { icon: "✓", msg: "ד\"ר מירי אופיר — ייעוץ גינקולוגי: Added 6 negative keywords (autonomous, executed)", color: "#059669" },
          ].map((a, i) => (
            <div key={i} style={{ fontSize: 11, color: "#374151", padding: "4px 0", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: a.color, flexShrink: 0, fontWeight: 700 }}>{a.icon}</span>
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust engine */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Trust Engine — All Clients</h2>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Click a client for full breakdown</span>
        </div>
        <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { name: 'מרפאת שיניים לוי', score: 82, level: 'Autonomous', health: 78, healthTier: 'green' },
            { name: 'גרינברג נדל"ן', score: 44, level: 'SemiAuto', health: 65, healthTier: 'yellow' },
            { name: 'ד"ר מירי אופיר', score: 78, level: 'Autonomous', health: 82, healthTier: 'green' },
            { name: 'ביטוח ישיר פלוס', score: 25, level: 'Supervised', health: 22, healthTier: 'red' },
            { name: 'עורך דין כהן', score: 61, level: 'SemiAuto', health: 58, healthTier: 'yellow' },
            { name: 'מוסך אביב', score: 30, level: 'Supervised', health: 42, healthTier: 'orange' },
            { name: 'קרן פיטנס', score: 55, level: 'SemiAuto', health: 34, healthTier: 'orange' },
            { name: 'עיצוב פנים שרה', score: 88, level: 'Autonomous', health: 91, healthTier: 'green' },
          ].map((c) => {
            const trustColor = c.score >= 75 ? "#16a34a" : c.score >= 40 ? "#d97706" : "#dc2626";
            const healthColor = c.healthTier === "green" ? "#059669" : c.healthTier === "yellow" ? "#ca8a04" : c.healthTier === "orange" ? "#ea580c" : "#be123c";
            return (
              <div key={c.name} style={{ border: "1px solid #f3f4f6", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{c.name}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 2 }}>Trust</div>
                    <div style={{ height: 3, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginBottom: 2 }}>
                      <div style={{ width: `${c.score}%`, height: "100%", background: trustColor, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: trustColor }}>{c.score}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 2 }}>Health</div>
                    <div style={{ height: 3, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginBottom: 2 }}>
                      <div style={{ width: `${c.health}%`, height: "100%", background: healthColor, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: healthColor }}>{c.health}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent log */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Agent Log</h2>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Last sync: {systemStats.lastSync}</span>
        </div>
        {mockSystemLogs.map((log, i) => {
          const tc: Record<string, { bg: string; color: string }> = {
            alert: { bg: "#fef2f2", color: "#dc2626" },
            ai: { bg: "#f5f3ff", color: "#7c3aed" },
            lead: { bg: "#f0fdf4", color: "#16a34a" },
            campaign: { bg: "#eff6ff", color: "#2563eb" },
            system: { bg: "#f3f4f6", color: "#6b7280" },
          };
          const c = tc[log.type] ?? tc.system;
          return (
            <div key={log.id} style={{ padding: "8px 14px", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < mockSystemLogs.length - 1 ? "1px solid #f9fafb" : "none" }}>
              <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, fontWeight: 700, background: c.bg, color: c.color, flexShrink: 0, textTransform: "uppercase", marginTop: 1 }}>
                {log.type}
              </span>
              <p style={{ fontSize: 12, color: "#374151", flex: 1, margin: 0 }}>{log.message}</p>
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>{log.time}</span>
                {log.cost && <span style={{ fontSize: 10, color: "#7c3aed" }}>{log.cost}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
