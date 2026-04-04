"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { systemStats, operatorConfig } from "@/lib/mock-data";

// SVG icon components for nav items
const NavIcon = {
  dashboard: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  clients: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  conversations: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  pulse: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  onboarding: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  campaigns: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  creative: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  metaCreative: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  searchTerms: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="8" y1="8" x2="14" y2="8"/><line x1="8" y1="11" x2="12" y2="11"/>
    </svg>
  ),
  landingPages: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
      <circle cx="7" cy="6" r="1" fill={active ? "#7C3AED" : "#9CA3AF"}/><circle cx="10" cy="6" r="1" fill={active ? "#7C3AED" : "#9CA3AF"}/>
    </svg>
  ),
  reports: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  referrals: (active: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#7C3AED" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/><path d="M20 12H4"/>
    </svg>
  ),
  system: (active: boolean, danger?: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={danger ? "#EF4444" : (active ? "#7C3AED" : "#9CA3AF")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

const navSections = [
  {
    label: "פעולות",
    items: [
      { href: "/", label: "לוח בקרה", iconKey: "dashboard" as const },
      { href: "/clients", label: "לקוחות", iconKey: "clients" as const },
      { href: "/conversations", label: "שיחות", iconKey: "conversations" as const, badgeKey: "pendingApprovals" as const },
      { href: "/pulse", label: "Pulse", iconKey: "pulse" as const },
      { href: "/onboarding", label: "קליטת לקוח", iconKey: "onboarding" as const },
    ],
  },
  {
    label: "שיווק",
    items: [
      { href: "/campaigns", label: "קמפיינים", iconKey: "campaigns" as const, badgeKey: "pendingCampaignChanges" as const },
      { href: "/creative", label: "קריאייטיב", iconKey: "creative" as const },
      { href: "/creatives", label: "Meta קריאייטיב", iconKey: "metaCreative" as const },
      { href: "/search-terms", label: "מונחי חיפוש", iconKey: "searchTerms" as const },
      { href: "/landing-pages", label: "דפי נחיתה", iconKey: "landingPages" as const },
      { href: "/reports", label: "דוחות", iconKey: "reports" as const },
    ],
  },
  {
    label: "צמיחה",
    items: [
      { href: "/referrals", label: "הפניות", iconKey: "referrals" as const },
    ],
  },
  {
    label: "מערכת",
    items: [
      { href: "/system", label: "מערכת", iconKey: "system" as const, badgeKey: "criticalServices" as const, danger: true },
    ],
  },
];

type BadgeKey = "pendingApprovals" | "pendingCampaignChanges" | "criticalServices";
type IconKey = keyof typeof NavIcon;

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

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
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

  const handleNavClick = () => {
    // Auto-close sidebar on mobile when a nav link is clicked
    if (onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "var(--sidebar-bg)",
        borderInlineEnd: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        flexShrink: 0,
      }}
    >
      {/* T4 crisis strip */}
      {hasT4 && (
        <Link
          href="/conversations"
          onClick={handleNavClick}
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

      {/* Logo + close button on mobile */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #F3F4F6",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Image src="/converty-logo.svg" alt="Converty" width={36} height={36} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>Converty</div>
          <div style={{ fontSize: 11, color: "var(--text-placeholder)" }}>מנהל מערכת</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="סגור תפריט"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "#9CA3AF",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
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
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = (item as { badgeKey?: BadgeKey }).badgeKey ? badgeValues[(item as { badgeKey: BadgeKey }).badgeKey] : 0;
              const isDanger = (item as { danger?: boolean }).danger;
              const iconKey = (item as { iconKey: IconKey }).iconKey;
              const renderIcon = iconKey === "system"
                ? NavIcon.system(isActive, isDanger)
                : NavIcon[iconKey]?.(isActive);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    textDecoration: "none",
                    background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                    color: isActive ? "var(--sidebar-active-color)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                    marginBottom: 2,
                    transition: "background 0.12s, color 0.12s",
                    borderInlineStart: isActive ? "2px solid var(--sidebar-active-border)" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "#F5F3FF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {renderIcon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badgeCount > 0 && (
                    <span
                      style={{
                        background: isDanger ? "#EF4444" : "var(--brand)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 20,
                        minWidth: 20,
                        textAlign: "center",
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
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
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

  // Mobile overlay mode
  if (typeof isMobileOpen !== "undefined") {
    if (!isMobileOpen) return null;
    return (
      <>
        {/* Backdrop */}
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
        {/* Sidebar overlay */}
        <div
          className="sidebar-overlay"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            width: 280,
            maxWidth: "85vw",
          }}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop mode — sticky sidebar
  return (
    <div className="desktop-only" style={{ position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
      {sidebarContent}
    </div>
  );
}
