"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { systemStats, agencyHealthScore, operatorConfig, canaryDeployment } from "@/lib/mock-data";

function ISTTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("he-IL", {
        timeZone: "Asia/Jerusalem",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 30000);
    return () => clearInterval(t);
  }, []);
  return <span dir="ltr">{time} IST</span>;
}

interface PillProps {
  label: string;
  value: string | number;
  color: string;
  urgent?: boolean;
  href?: string;
}

function Pill({ label, value, color, urgent, href }: PillProps) {
  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        background: urgent ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.10)",
        border: `1px solid ${urgent ? "rgba(220,38,38,0.35)" : "rgba(255,255,255,0.12)"}`,
        cursor: href ? "pointer" : "default",
        transition: href ? "background 0.15s" : undefined,
        whiteSpace: "nowrap",
      }}
      className={urgent ? "pill-pulse" : ""}
    >
      <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", fontWeight: 500 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: urgent ? "#fca5a5" : color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }} aria-label={`${label}: ${value}`}>
        {inner}
      </Link>
    );
  }
  return inner;
}

const modeLabel: Record<string, string> = {
  normal: "זמין",
  semiAuto: "חצי-אוטו",
  vacation: "חופשה",
  unavailable: "לא זמין",
};
const modeColor: Record<string, string> = {
  normal: "#10b981",
  semiAuto: "#f59e0b",
  vacation: "#f59e0b",
  unavailable: "#ef4444",
};
const modeTextColor: Record<string, string> = {
  normal: "#6ee7b7",
  semiAuto: "#fcd34d",
  vacation: "#fcd34d",
  unavailable: "#fca5a5",
};

export default function StatusBar() {
  const mode = operatorConfig.mode;

  return (
    <div
      role="status"
      aria-label="סטטוס סוכנות"
      style={{
        background: "#0f1117",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        height: 40,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 8,
        flexShrink: 0,
        overflowX: "auto",
        flexWrap: "wrap",
      }}
    >
      {/* Agency health score */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingInlineEnd: 14,
          borderInlineEnd: "1px solid rgba(255,255,255,0.10)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, whiteSpace: "nowrap" }}>
          סוכנות
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color:
              agencyHealthScore >= 70 ? "#34d399"
              : agencyHealthScore >= 50 ? "#fbbf24"
              : "#f87171",
            fontVariantNumeric: "tabular-nums",
          }}
          aria-label={`ציון בריאות סוכנות: ${agencyHealthScore}`}
        >
          {agencyHealthScore}
        </span>
      </div>

      <Pill label="לקוחות" value={`${systemStats.activeClients}/${systemStats.clientCapacity}`} color="#a5b4fc" href="/clients" />
      <Pill label="תור" value={systemStats.pendingApprovals} color="#fbbf24" urgent={systemStats.pendingApprovals > 0} href="/conversations" />
      <Pill label="T4" value={systemStats.t4Active} color="#f87171" urgent={systemStats.t4Active > 0} href="/conversations" />
      <Pill label="לידים" value={systemStats.leadsToday} color="#6ee7b7" />
      <Pill
        label="CPL"
        value={`₪${systemStats.monthlyCpl}`}
        color={systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#6ee7b7" : "#fbbf24"}
      />
      <span className="desktop-only" style={{ display: "inline-flex" }}>
        <Pill label="AI" value={`₪${systemStats.aiSpendToday.toFixed(2)}`} color="#c4b5fd" />
      </span>

      {canaryDeployment.active && (
        <span className="desktop-only" style={{ display: "inline-flex" }}>
          <Pill label="Canary" value={`${canaryDeployment.version} ${canaryDeployment.hoursRemaining}h`} color="#a78bfa" />
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Operator mode — dot + text label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingInlineStart: 14,
          borderInlineStart: "1px solid rgba(255,255,255,0.10)",
          flexShrink: 0,
        }}
        aria-label={`מצב מפעיל: ${modeLabel[mode] ?? mode}`}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: modeColor[mode] ?? "#9CA3AF",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, color: modeTextColor[mode] ?? "#9CA3AF", fontWeight: 600 }}>
          {modeLabel[mode] ?? mode}
        </span>
      </div>

      {/* IST clock */}
      <div
        style={{
          fontSize: 12,
          color: "#9CA3AF",
          whiteSpace: "nowrap",
          paddingInlineStart: 12,
          borderInlineStart: "1px solid rgba(255,255,255,0.10)",
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
          fontWeight: 500,
        }}
        aria-label="שעון ישראל"
      >
        <ISTTime />
      </div>
    </div>
  );
}
