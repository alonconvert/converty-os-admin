import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Converty OS",
  description: "Agency Operating System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--page-bg)",
          margin: 0,
        }}
      >
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
