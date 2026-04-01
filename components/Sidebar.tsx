"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { systemStats, operatorConfig, canaryDeployment } from "@/lib/mock-data";

const navItems = [
  { href: "/", label: "Dashboard", icon: "◈" },
  { href: "/clients", label: "Clients", icon: "⬡" },
  { href: "/conversations", label: "Conversations", icon: "◎", badgeKey: "pendingApprovals" as const },
  { href: "/pulse", label: "Pulse", icon: "◉" },
  { href: "/campaigns", label: "Campaigns", icon: "▲" },
  { href: "/creative", label: "Creative", icon: "✦" },
  { href: "/reports", label: "Reports", icon: "▦" },
  { href: "/system", label: "System", icon: "⚙" },
];

function ISTClock() {
  const [time, setTime] = useState<string>("—");
  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("he-IL", {
          timeZone: "Asia/Jerusalem",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);
  return <span dir="ltr">{time} IST</span>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [operatorMode, setOperatorMode] = useState<"normal" | "unavailable">(
    operatorConfig.mode === "vacation" ? "unavailable" : operatorConfig.mode
  );

  const hasT4 = systemStats.t4Active > 0;

  return (
    <aside
      style={{
        width: collapsed ? 56 : 224,
        minWidth: collapsed ? 56 : 224,
        background: "#0f1117",
        transition: "width 0.2s cubic-bezier(0.16,1,0.3,1)",
        overflow: "hidden",
      }}
      className="flex flex-col h-full relative"
    >
      {/* Logo */}
      <div
        className="flex items-center border-b"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          padding: collapsed ? "14px 14px" : "14px 16px",
          gap: 10,
          minHeight: 56,
        }}
      >
        <div
          style={{
            background: "#4F46E5",
            minWidth: 28,
            width: 28,
            height: 28,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
            letterSpacing: "-0.5px",
          }}
        >
          C
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div className="text-white font-semibold text-sm leading-tight whitespace-nowrap">
              Converty OS
            </div>
            <div style={{ color: "#4b5563", fontSize: 11 }} className="whitespace-nowrap">
              Agency Panel
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#4b5563",
              cursor: "pointer",
              padding: "4px",
              borderRadius: 4,
              display: "flex",
              flexShrink: 0,
            }}
            title="Collapse sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              position: "absolute",
              right: 8,
              top: 16,
              background: "none",
              border: "none",
              color: "#4b5563",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
            }}
            title="Expand sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* T4 Crisis Banner */}
      {hasT4 && (
        <div
          className="pill-pulse"
          style={{
            background: "#7f1d1d",
            borderBottom: "1px solid #991b1b",
            padding: collapsed ? "6px 0" : "6px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#f87171",
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          {!collapsed && (
            <span style={{ color: "#fca5a5", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
              T4 CRISIS — {systemStats.t4Active} active
            </span>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3" style={{ padding: collapsed ? "12px 8px" : "12px 8px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const badge = item.badgeKey ? systemStats[item.badgeKey] : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "space-between",
                padding: collapsed ? "9px 0" : "8px 10px",
                borderRadius: 7,
                marginBottom: 2,
                background: isActive ? "rgba(79,70,229,0.15)" : "transparent",
                color: isActive ? "#a5b4fc" : "#6b7280",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                gap: 10,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "#6b7280";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 10,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    lineHeight: 1,
                    fontFamily: "monospace",
                    width: 18,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                )}
              </div>
              {!collapsed && badge && badge > 0 && (
                <span
                  style={{
                    background: "#4F46E5",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 99,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Canary badge */}
        {!collapsed && canaryDeployment.active && (
          <div
            style={{
              margin: "8px 4px 0",
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: 7,
              padding: "8px 10px",
            }}
          >
            <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.04em" }}>
              ⚗ CANARY {canaryDeployment.version}
            </div>
            <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2 }}>
              {canaryDeployment.hoursRemaining}h remaining
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: collapsed ? "12px 8px" : "12px 14px",
        }}
      >
        {/* Operator mode toggle */}
        {!collapsed && (
          <button
            onClick={() => setOperatorMode((m) => (m === "normal" ? "unavailable" : "normal"))}
            style={{
              width: "100%",
              background: operatorMode === "normal" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.12)",
              border: `1px solid ${operatorMode === "normal" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.25)"}`,
              borderRadius: 7,
              padding: "7px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 10,
              transition: "all 0.2s",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: operatorMode === "normal" ? "#10b981" : "#f59e0b",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: operatorMode === "normal" ? "#6ee7b7" : "#fcd34d",
                whiteSpace: "nowrap",
              }}
            >
              {operatorMode === "normal" ? "Online" : "Unavailable"}
            </span>
          </button>
        )}

        {collapsed && (
          <button
            onClick={() => setOperatorMode((m) => (m === "normal" ? "unavailable" : "normal"))}
            title={operatorMode === "normal" ? "Go unavailable" : "Go online"}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: operatorMode === "normal" ? "#10b981" : "#f59e0b",
              }}
            />
          </button>
        )}

        {!collapsed && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#4b5563", fontSize: 11 }}>
                <ISTClock />
              </span>
            </div>
            <div style={{ color: "#374151", fontSize: 10, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              v{canaryDeployment.active ? canaryDeployment.version : "2.0"} · uptime {systemStats.uptime}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
