"use client";

import { useAuth } from "@/components/providers";
import { Sun, Moon, Monitor, Smartphone } from "lucide-react";

export function Topbar() {
  const { user, mode, setMode, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-800">AAA Computer Services</h1>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
          Accounting System
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setMode(mode === "BEGINNER" ? "EXPERIENCED" : "BEGINNER")}
          className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-2"
          title="Switch accounting mode"
        >
          <Monitor className="w-4 h-4" />
          {mode === "BEGINNER" ? "Experienced Mode" : "Beginner Mode"}
        </button>

        <div className="h-6 w-px bg-slate-300 mx-1"></div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200">
          <span className="hidden sm:inline">{user?.email}</span>
          <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
}
