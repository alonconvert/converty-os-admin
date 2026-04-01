"use client";

import { useState, useEffect } from "react";
import { systemStats, agencyHealthScore, operatorConfig, canaryDeployment } from "@/lib/mock-data";

function ISTTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-GB", {
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

function Pill({ label, value, color, urgent }: PillProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        background: urgent ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${urgent ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.1)"}`,
      }}
      className={urgent ? "pill-pulse" : ""}
    >
      <span style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: urgent ? "#fca5a5" : color,
          fontFamily: "DM Serif Display, serif",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function StatusBar() {
  const mode = operatorConfig.mode;

  return (
    <div
      style={{
        background: "#0f1117",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        height: 38,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 8,
        flexShrink: 0,
        overflowX: "auto",
      }}
    >
      {/* Agency health score */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginRight: 6,
          paddingRight: 14,
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Agency
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color:
              agencyHealthScore >= 70 ? "#34d399"
              : agencyHealthScore >= 50 ? "#fbbf24"
              : "#f87171",
            fontFamily: "DM Serif Display, serif",
          }}
        >
          {agencyHealthScore}
        </span>
      </div>

      <Pill label="Clients" value={`${systemStats.activeClients}/${systemStats.clientCapacity}`} color="#a5b4fc" />
      <Pill label="Queue" value={systemStats.pendingApprovals} color="#fbbf24" urgent={systemStats.pendingApprovals > 0} />
      <Pill label="T4" value={systemStats.t4Active} color="#f87171" urgent={systemStats.t4Active > 0} />
      <Pill label="Leads" value={systemStats.leadsToday} color="#6ee7b7" />
      <Pill label="CPL" value={`₪${systemStats.monthlyCpl}`} color={systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#6ee7b7" : "#fbbf24"} />
      <Pill label="AI Spend" value={`₪${systemStats.aiSpendToday.toFixed(2)}`} color="#c4b5fd" />

      {canaryDeployment.active && (
        <Pill label="Canary" value={`${canaryDeployment.version} ${canaryDeployment.hoursRemaining}h`} color="#a78bfa" />
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Operator mode */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          paddingLeft: 14,
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: mode === "normal" ? "#10b981" : "#f59e0b",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, color: mode === "normal" ? "#6ee7b7" : "#fcd34d", fontWeight: 600 }}>
          {mode === "normal" ? "Online" : mode === "vacation" ? "Vacation" : "Unavailable"}
        </span>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#374151",
          whiteSpace: "nowrap",
          paddingLeft: 10,
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <ISTTime />
      </div>
    </div>
  );
}
