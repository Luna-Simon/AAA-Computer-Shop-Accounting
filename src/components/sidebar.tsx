"use client";

import { useAuth } from "@/components/providers";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export function Sidebar() {
  const { user, mode, setMode, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#141414] text-[#F3F4F6] flex flex-col z-40 border-r border-[#303030]">
      <div className="flex items-center justify-between h-16 px-6 bg-[#141414] border-b border-[#303030]">
        <span className="text-lg font-bold tracking-tight flex items-center gap-2 text-[#F3F4F6]">
          AAA Computer
        </span>
        <span className="text-xs text-[#A1A1AA] font-mono">
          {user?.role === "ADMIN" ? "Admin" : "Viewer"}
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {[
          { name: "Dashboard", href: "/dashboard", iconName: "layout-dashboard" },
          { name: "Chart of Accounts", href: "/accounts", iconName: "book-open" },
          { name: "Transactions", href: "/transactions", iconName: "file-text" },
          { name: "General Journal", href: "/journal", iconName: "list" },
          { name: "General Ledger", href: "/ledger", iconName: "calculator" },
          { name: "Adjusting Entries", href: "/adjusting", iconName: "rotate-ccw" },
          { name: "Trial Balance", href: "/reports/trial-balance", iconName: "bar-chart-3" },
          { name: "Income Statement", href: "/reports/income-statement", iconName: "bar-chart-3" },
          { name: "Balance Sheet", href: "/reports/balance-sheet", iconName: "bar-chart-3" },
          { name: "Settings & Data", href: "/settings", iconName: "settings" },
        ].map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#4A4E69] text-[#A9C4A1] border-l-2 border-[#A9C4A1]"
                  : "text-[#A1A1AA] hover:bg-[#1E1E1E] hover:text-[#F3F4F6]"
              }`}
            >
              {item.name}
            </a>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#303030]">
        <div className="px-4 py-3 rounded-lg bg-[#1E1E1E] text-xs text-[#A1A1AA] font-mono border border-[#303030]">
          Mode: <span className="text-[#A9C4A1] capitalize">{mode.toLowerCase()}</span>
        </div>
        <button
          onClick={logout}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#F3F4F6] bg-[#4A4E69] rounded-lg hover:bg-[#5A5E79] border border-[#303030] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
