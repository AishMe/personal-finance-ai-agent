"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, MessageCircle, ArrowLeftRight,
  Target, Lightbulb, Settings, LogOut,
  FileSpreadsheet, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Chat",         href: "/chat",         icon: MessageCircle   },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight  },
  { label: "Import CSV",   href: "/csv",          icon: FileSpreadsheet, badge: "new" },
  { label: "Budget",       href: "/budget",       icon: ShieldCheck     },
  { label: "Goals",        href: "/goals",        icon: Target          },
  { label: "Insights",     href: "/insights",     icon: Lightbulb,      badge: "ai"  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    sessionStorage.removeItem("is_demo");
    sessionStorage.removeItem("demo_user_id");
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sidebar-logo">
        <div className="sidebar-logo-mark">F</div>
        <div className="sidebar-logo-text">
          <p className="sidebar-logo-name">Adulting AI</p>
          <p className="sidebar-logo-sub">Personal assistant</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon size={16} />
              {label}
              {badge === "ai"  && <span className="nav-badge nav-badge-ai ml-auto">AI</span>}
              {badge === "new" && <span className="nav-badge nav-badge-new ml-auto">new</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/settings" className="nav-item">
          <Settings size={16} />
          Settings
        </Link>
        <button onClick={handleLogout} className="nav-item nav-item-danger">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}