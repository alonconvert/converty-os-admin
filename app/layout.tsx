import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Converty OS",
  description: "Agency Operating System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "var(--page-bg)",
          margin: 0,
        }}
      >
        <TopNav />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
