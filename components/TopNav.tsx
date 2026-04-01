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
    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>
      {time} IST
    </span>
  );
}

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Clients", href: "/clients" },
  { label: "Conversations", href: "/conversations", badgeKey: "pendingApprovals" as const },
  { label: "Campaigns", href: "/campaigns", badgeKey: "pendingCampaignChanges" as const },
  { label: "Creative", href: "/creative" },
  { label: "Reports", href: "/reports" },
  { label: "Pulse", href: "/pulse" },
  { label: "System", href: "/system", badgeKey: "criticalServices" as const, danger: true },
];

const modeSequence = ["supervised", "semiAuto", "autonomous"] as const;
type OperatorModeLocal = typeof modeSequence[number];

export default function TopNav() {
  const pathname = usePathname();
  const [operatorMode, setOperatorMode] = useState<OperatorModeLocal>(
    operatorConfig.mode === "vacation"
      ? "supervised" as OperatorModeLocal
      : (operatorConfig.mode as OperatorModeLocal) ?? "semiAuto"
  );

  const hasT4 = systemStats.t4Active > 0;

  const modeLabel: Record<string, string> = {
    supervised: "Supervised",
    semiAuto: "Semi-Auto",
    autonomous: "Autonomous",
  };
  const modeColor: Record<string, string> = {
    supervised: "#EF4444",
    semiAuto: "#F59E0B",
    autonomous: "#10B981",
  };
  const modeBg: Record<string, string> = {
    supervised: "rgba(239,68,68,0.15)",
    semiAuto: "rgba(245,158,11,0.15)",
    autonomous: "rgba(16,185,129,0.15)",
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
    agencyHealthScore >= 70 ? "#10B981" : agencyHealthScore >= 50 ? "#F59E0B" : "#EF4444";

  const metrics = [
    {
      label: "Agency Health",
      value: `${agencyHealthScore}%`,
      color: healthColor,
    },
    {
      label: "Queue",
      value: `${systemStats.pendingApprovals}`,
      color: systemStats.pendingApprovals > 5 ? "#EF4444" : "var(--text-primary)",
    },
    {
      label: "Leads today",
      value: `${systemStats.leadsToday}`,
      color: "var(--text-primary)",
    },
    {
      label: "CPL",
      value: `₪${systemStats.monthlyCpl}`,
      color: systemStats.monthlyCpl <= systemStats.monthlyCplTarget ? "#10B981" : "#F59E0B",
    },
    {
      label: "AI spend",
      value: `₪${systemStats.aiSpendToday.toFixed(2)}`,
      color: "#9B51E0",
    },
    {
      label: "Clients",
      value: `${systemStats.activeClients} / ${systemStats.clientCapacity}`,
      color: "var(--text-primary)",
    },
  ];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100 }}>
      {/* T4 crisis strip */}
      {hasT4 && (
        <div
          style={{
            background: "linear-gradient(90deg, #B91C1C, #EF4444)",
            padding: "6px 24px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: "100%",
          }}
        >
          <span
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block", flexShrink: 0 }}
            className="pill-pulse"
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>
            T4 CRISIS — HUMAN TAKEOVER REQUIRED
          </span>
          <Link href="/conversations" style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 600 }}>
            View →
          </Link>
        </div>
      )}

      {/* Main nav bar */}
      <div style={{ background: "var(--nav-bg)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", height: 56, display: "flex", alignItems: "center", padding: "0 24px", gap: 0 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 32, flexShrink: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "var(--gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              Y
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Converty <span style={{ fontWeight: 400, opacity: 0.55 }}>OS</span>
            </span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "stretch", flex: 1, height: "100%" }}>
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
                    gap: 5,
                    padding: "0 12px",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                    borderBottom: isActive ? "2px solid #C084FC" : "2px solid transparent",
                    transition: "color 0.15s, border-color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.85)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
                  }}
                >
                  {item.label}
                  {showBadge && (
                    <span
                      style={{
                        background: item.danger ? "#EF4444" : "#C084FC",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 20,
                        lineHeight: "16px",
                        minWidth: 18,
                        textAlign: "center",
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

          {/* Right: operator mode + clock */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <button
              onClick={cycleMode}
              style={{
                background: modeBg[operatorMode],
                border: `1px solid ${modeColor[operatorMode]}`,
                borderRadius: 20,
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                color: modeColor[operatorMode],
                transition: "all 0.15s",
                letterSpacing: "0.02em",
              }}
            >
              {modeLabel[operatorMode]}
            </button>
            <ISTClock />
          </div>
        </div>
      </div>

      {/* Metrics strip */}
      <div style={{ background: "var(--metrics-bg)", borderBottom: "1px solid var(--card-border)", boxShadow: "0 1px 4px rgba(107,33,168,0.07)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", height: 36, display: "flex", alignItems: "center", padding: "0 24px" }}>
          {metrics.map((m, i) => (
            <div
              key={m.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 18px",
                height: "100%",
                borderRight: i < metrics.length - 1 ? "1px solid var(--card-border)" : "none",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                {m.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums" }}>
                {m.value}
              </span>
            </div>
          ))}
          {/* Live indicator */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block" }} className="pill-pulse" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981" }}>Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
