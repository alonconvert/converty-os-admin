"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

function ISTClockMini() {
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

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile header */}
      <div
        className="mobile-only-flex"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          background: "#fff",
          borderBottom: "1px solid var(--card-border)",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 900,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="פתח תפריט"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span style={{ width: 20, height: 2, background: "#374151", borderRadius: 1, display: "block" }} />
          <span style={{ width: 20, height: 2, background: "#374151", borderRadius: 1, display: "block" }} />
          <span style={{ width: 20, height: 2, background: "#374151", borderRadius: 1, display: "block" }} />
        </button>

        {/* Title */}
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          Converty OS
        </span>

        {/* IST clock */}
        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
          <ISTClockMini />
          <span style={{ fontSize: 10 }}>IST</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
        className="main-content"
      >
        {/* Spacer for mobile fixed header */}
        <div className="mobile-only" style={{ display: "none", height: 48 }} />
        {children}
      </main>
    </>
  );
}
