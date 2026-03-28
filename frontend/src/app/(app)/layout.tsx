// frontend/src/app/(app)/layout.tsx
// All app pages (dashboard, chat, transactions, etc.) live under this route group.
// They share the sidebar shell.

import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}