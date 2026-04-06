import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Converty OS",
  description: "Agency Operating System",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
  },
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
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
