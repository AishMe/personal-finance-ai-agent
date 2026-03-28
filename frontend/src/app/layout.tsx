import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adulting.ai — Your AI Financial Copilot",
  description: "Track spending, get AI insights, and actually understand your money.",
};

// The root layout is intentionally minimal — it just provides
// the HTML shell and global CSS. Each page group handles its
// own shell (the landing page has no sidebar; app pages use AppShell).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}