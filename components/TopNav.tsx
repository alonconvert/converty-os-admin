"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { systemStats, operatorConfig, agencyHealthScore } from "@/lib/mock-data";

function ISTClock() {
  const [time, setTime] = useState("—");
  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("en-IL", {
          timeZone: "Asia/Jerusalem",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      className="mono"
      style={{ fontSize: 11, color: "#6B6760", letterSpacing: "0.06em" }}
    >
      {time}
    </span>
  );
}

const navItems = [
  { label: "DASHBOARD", href: "/" },
  { label: "CLIENTS", href: "/clients" },
  { label: "CONVOS", href: "/conversations", badgeKey: "pendingApprovals" as const },
  { label: "CAMPAIGNS", href: "/campaigns", badgeKey: "pendingCampaignChanges" as const },
  { label: "CREATIVE", href: "/creative" },
  { label: "REPORTS", href: "/reports" },
  { label: "PULSE", href: "/pulse" },
  { label: "SYSTEM", href: "/system", badgeKey: "criticalServices" as const, badgeAccent: true },
];

const modeSequence = ["supervised", "semiAuto", "autonomous"] as const;
type OperatorModeLocal = typeof modeSequence[number];

export default function TopNav() {
  const pathname = usePathname();
  const [operatorMode, setOperatorMode] = useState<OperatorModeLocal>(
    operatorConfig.mode === "vacation" ? "unavailable" as OperatorModeLocal : (operatorConfig.mode as OperatorModeLocal) ?? "semiAuto"
  );

  const hasT4 = systemStats.t4Active > 0;

  const modeLabel: Record<string, string> = {
    supervised: "SUPERVISED",
    semiAuto: "SEMI-AUTO",
    autonomous: "AUTONOMOUS",
    unavailable: "UNAVAILABLE",
  };
  const modeColor: Record<string, string> = {
    supervised: "#dc2626",
    semiAuto: "#d97706",
    autonomous: "#16a34a",
    unavailable: "#6B6760",
  };

  const cycleMode = () => {
    const idx = modeSequence.indexOf(operatorMode as typeof modeSequence[number]);
    const next = modeSequence[(idx + 1) % modeSequence.length];
    setOperatorMode(next);
  };

  const badgeValues: Record<string, number> = {
    pendingApprovals: systemStats.pendingApprovals,
    pendingCampaignChanges: (systemStats as { pendingCampaignChanges?: number }).pendingCampaignChanges ?? 0,
    criticalServices: (systemStats as { criticalServices?: number }).criticalServices ?? 0,
  };

  const healthColor =
    agencyHealthScore >= 70 ? "#16a34a" : agencyHealthScore >= 50 ? "#d97706" : "#dc2626";

  const metrics = [
    {
      label: "HEALTH",
      value: `${agencyHealthScore}`,
      unit: "/100",
      color: healthColor,
    },
    {
      label: "QUEUE",
      value: `${systemStats.pendingApprovals}`,
      unit: " pending",
      color: systemStats.pendingApprovals > 5 ? "#dc2626" : "var(--text-primary)",
    },
    {
      label: "LEADS",
      value: `${systemStats.leadsToday}`,
      unit: " today",
      color: "var(--text-primary)",
    },
    {
      label: "CPL",
      value: `₪${systemStats.monthlyCpl}`,
      unit: ` / ₪${systemStats.monthlyCplTarget}`,
      color:
        systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#16a34a" : "#d97706",
    },
    {
      label: "AI ₪",
      value: `₪${systemStats.aiSpendToday.toFixed(2)}`,
      unit: " today",
      color: "#7c3aed",
    },
    {
      label: "CLIENTS",
      value: `${systemStats.activeClients}`,
      unit: `/${systemStats.clientCapacity}`,
      color: "var(--text-primary)",
    },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--nav-bg)",
        borderBottom: "2px solid var(--border)",
      }}
    >
      {/* T4 crisis strip */}
      {hasT4 && (
        <div
          style={{
            background: "#E83320",
            padding: "5px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#fff",
              display: "inline-block",
              flexShrink: 0,
            }}
            className="pill-pulse"
          />
          <span
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.12em",
            }}
          >
            T4 CRISIS — HUMAN TAKEOVER REQUIRED
          </span>
          <Link
            href="/conversations"
            style={{
              marginLeft: "auto",
              fontFamily: "'Courier Prime', monospace",
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
              textDecoration: "none",
              letterSpacing: "0.06em",
            }}
          >
            VIEW →
          </Link>
        </div>
      )}

      {/* Main nav bar */}
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "stretch",
          padding: "0 20px",
          borderBottom: "1px solid #2A2520",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginRight: 28,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              fontSize: 22,
              color: "#fff",
              letterSpacing: "0.12em",
            }}
          >
            CONVERTY{" "}
            <span style={{ color: "var(--accent)" }}>OS</span>
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "stretch", flex: 1, gap: 0 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const badgeCount = item.badgeKey ? badgeValues[item.badgeKey] : 0;
            const showBadge = badgeCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 13px",
                  textDecoration: "none",
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontSize: 14,
                  letterSpacing: "0.07em",
                  color: isActive ? "#fff" : "#8B8780",
                  borderBottom: isActive
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
                  borderTop: "3px solid transparent",
                  transition: "color 0.12s",
                  position: "relative",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLAnchorElement).style.color = "#D0CDC6";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLAnchorElement).style.color = "#8B8780";
                }}
              >
                {item.label}
                {showBadge && (
                  <span
                    style={{
                      background: item.badgeAccent ? "#ef4444" : "var(--accent)",
                      color: "#fff",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 5px",
                      minWidth: 16,
                      textAlign: "center",
                      letterSpacing: 0,
                      lineHeight: "16px",
                      display: "inline-block",
                    }}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side — operator mode + clock */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexShrink: 0,
          }}
        >
          <button
            onClick={cycleMode}
            style={{
              background: "transparent",
              border: `1px solid ${modeColor[operatorMode]}`,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'Courier Prime', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: modeColor[operatorMode],
              transition: "all 0.15s",
            }}
          >
            {modeLabel[operatorMode]}
          </button>
          <ISTClock />
        </div>
      </div>

      {/* Metrics strip */}
      <div
        style={{
          height: 32,
          background: "var(--metrics-bg)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 0,
        }}
      >
        {metrics.map((m, i) => (
          <div
            key={m.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 16px",
              height: "100%",
              borderRight: i < metrics.length - 1 ? "1px solid var(--border-light)" : "none",
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 9,
                color: "var(--text-muted)",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
              }}
            >
              {m.label}
            </span>
            <span
              style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: 16,
                color: m.color,
                letterSpacing: "0.04em",
                lineHeight: 1,
              }}
            >
              {m.value}
            </span>
            {m.unit && (
              <span
                className="mono"
                style={{ fontSize: 9, color: "var(--text-secondary)" }}
              >
                {m.unit}
              </span>
            )}
          </div>
        ))}

        {/* Live indicator */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
            }}
            className="pill-pulse"
          />
          <span
            className="mono"
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
