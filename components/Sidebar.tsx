"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { systemStats, operatorConfig } from "@/lib/mock-data";

const navSections = [
  {
    label: "פעולות",
    items: [
      { href: "/", label: "לוח בקרה", icon: "◈" },
      { href: "/clients", label: "לקוחות", icon: "⬡" },
      { href: "/conversations", label: "שיחות", icon: "◎", badgeKey: "pendingApprovals" as const },
      { href: "/pulse", label: "Pulse", icon: "◉" },
    ],
  },
  {
    label: "שיווק",
    items: [
      { href: "/campaigns", label: "קמפיינים", icon: "▲", badgeKey: "pendingCampaignChanges" as const },
      { href: "/creative", label: "קריאייטיב", icon: "✦" },
      { href: "/reports", label: "דוחות", icon: "▦" },
    ],
  },
  {
    label: "מערכת",
    items: [
      { href: "/system", label: "מערכת", icon: "⚙", badgeKey: "criticalServices" as const, danger: true },
    ],
  },
];

type BadgeKey = "pendingApprovals" | "pendingCampaignChanges" | "criticalServices";

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
  return <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{time}</span>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [operatorMode, setOperatorMode] = useState<"normal" | "semiAuto" | "unavailable">(
    operatorConfig.mode === "vacation" ? "unavailable" : (operatorConfig.mode === "normal" ? "normal" : "semiAuto")
  );

  const hasT4 = systemStats.t4Active > 0;

  const badgeValues: Record<BadgeKey, number> = {
    pendingApprovals: systemStats.pendingApprovals,
    pendingCampaignChanges: (systemStats as { pendingCampaignChanges?: number }).pendingCampaignChanges ?? 0,
    criticalServices: (systemStats as { criticalServices?: number }).criticalServices ?? 0,
  };

  const modeCycle = ["normal", "semiAuto", "unavailable"] as const;
  const modeLabel: Record<string, string> = { normal: "רגיל", semiAuto: "חצי-אוטו", unavailable: "לא זמין" };
  const modeColor: Record<string, string> = { normal: "#10B981", semiAuto: "#F59E0B", unavailable: "#EF4444" };

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "var(--sidebar-bg)",
        borderInlineEnd: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* T4 crisis strip */}
      {hasT4 && (
        <Link
          href="/conversations"
          style={{
            background: "#FEF2F2",
            borderBottom: "1px solid #FECACA",
            padding: "8px 16px",
            display: "flex",
            gap: 8,
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <span
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }}
            className="pill-pulse"
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C" }}>T4 CRISIS — לחץ לפרטים</span>
        </Link>
      )}

      {/* Logo */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #F3F4F6",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--brand-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          Y
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>Converty</div>
          <div style={{ fontSize: 11, color: "var(--text-placeholder)", fontFamily: "'Heebo', sans-serif" }}>מנהל מערכת</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 22 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-placeholder)",
                letterSpacing: "0.06em",
                padding: "0 8px",
                marginBottom: 4,
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = item.badgeKey ? badgeValues[item.badgeKey] : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    borderRadius: 7,
                    textDecoration: "none",
                    background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                    color: isActive ? "var(--sidebar-active-color)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                    marginBottom: 2,
                    transition: "background 0.1s, color 0.1s",
                    borderInlineStart: isActive ? "2px solid var(--sidebar-active-border)" : "2px solid transparent",
                    fontFamily: "'Heebo', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "#F9FAFB";
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      width: 18,
                      textAlign: "center",
                      flexShrink: 0,
                      opacity: isActive ? 1 : 0.5,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badgeCount > 0 && (
                    <span
                      style={{
                        background: (item as { danger?: boolean }).danger ? "#EF4444" : "var(--brand)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 20,
                        minWidth: 18,
                        textAlign: "center",
                        lineHeight: "16px",
                        display: "inline-block",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer: operator mode + clock */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #F3F4F6",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          onClick={() => {
            const idx = modeCycle.indexOf(operatorMode as typeof modeCycle[number]);
            setOperatorMode(modeCycle[(idx + 1) % modeCycle.length]);
          }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 7,
            width: "100%",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: modeColor[operatorMode],
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, fontFamily: "'Heebo', sans-serif" }}>
            {modeLabel[operatorMode]}
          </span>
        </button>
        <div style={{ fontSize: 11, color: "var(--text-placeholder)", display: "flex", alignItems: "center", gap: 4 }}>
          <ISTClock />
          <span>IST</span>
        </div>
      </div>
    </aside>
  );
}
