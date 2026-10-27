"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  List,
  Calculator,
  Settings,
  BarChart3,
  Save,
  RotateCcw,
  LogOut,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chart of Accounts", href: "/accounts", icon: BookOpen },
  { name: "Transactions", href: "/transactions", icon: FileText },
  { name: "General Journal", href: "/journal", icon: List },
  { name: "General Ledger", href: "/ledger", icon: Calculator },
  { name: "Adjusting Entries", href: "/adjusting", icon: RotateCcw },
  { name: "Trial Balance", href: "/reports/trial-balance", icon: BarChart3 },
  { name: "Income Statement", href: "/reports/income-statement", icon: BarChart3 },
  { name: "Balance Sheet", href: "/reports/balance-sheet", icon: BarChart3 },
  { name: "Settings & Data", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-slate-200 flex flex-col z-40">
      <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
        <span className="text-lg font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          AAA Computer
        </span>
        <span className="text-xs text-slate-500 font-mono">
          {user?.role === "ADMIN" ? "Admin" : "Viewer"}
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-900/30 text-blue-300 border-l-2 border-blue-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="px-4 py-3 rounded-lg bg-slate-800/50 text-xs text-slate-400 font-mono border border-slate-700">
          Mode: <span className="text-slate-200 capitalize">beginner</span>
        </div>
        <button
          onClick={logout}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-300 bg-red-900/20 rounded-lg hover:bg-red-900/40 border border-red-900/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
