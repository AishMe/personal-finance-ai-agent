import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finance Agent",
  description: "Your personal AI finance assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-900 text-zinc-100`}>
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden bg-zinc-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-zinc-900">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}