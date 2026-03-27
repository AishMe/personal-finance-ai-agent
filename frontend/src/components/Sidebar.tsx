"use client";
// frontend/src/components/Sidebar.tsx — Day 13: Budget Limits added

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, MessageCircle, ArrowLeftRight,
  Target, Lightbulb, Settings, LogOut,
  FileSpreadsheet, ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";

const navItems = [
  { label: "Dashboard",    href: "/",            icon: LayoutDashboard },
  { label: "Chat",         href: "/chat",        icon: MessageCircle   },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight  },
  { label: "Import CSV",   href: "/csv",         icon: FileSpreadsheet },  // Day 12
  { label: "Budget",       href: "/budget",      icon: ShieldCheck     },  // Day 13
  { label: "Goals",        href: "/goals",       icon: Target          },
  { label: "Insights",     href: "/insights",    icon: Lightbulb       },
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
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">FinanceAI</p>
            <p className="text-xs text-gray-400">Personal assistant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={18} />
              {label}
              {label === "Insights" && (
                <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 font-medium px-1.5 py-0.5 rounded-full">AI</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Settings size={18} /> Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );
}