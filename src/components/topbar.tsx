"use client";

import { useAuth } from "@/components/providers";
import { Monitor } from "lucide-react";

export function Topbar() {
  const { user, mode, setMode } = useAuth();

  return (
    <header className="h-16 border-b border-[#303030] bg-[#141414]/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-[#F3F4F6]">AAA Computer Services</h1>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#4A4E69] text-[#A9C4A1] border border-[#303030]">
          Accounting System
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setMode(mode === "BEGINNER" ? "EXPERIENCED" : "BEGINNER")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            mode === "BEGINNER"
              ? "text-[#A9C4A1] bg-[#4A4E69]/20 border border-[#4A4E69]/30"
              : "text-[#A1A1AA] bg-[#1E1E1E] border border-[#303030]"
          }`}
          title="Switch accounting mode"
        >
          <Monitor className="w-4 h-4" />
          {mode === "BEGINNER" ? "Switch to Experienced Mode" : "Switch to Beginner Mode"}
        </button>

        <div className="h-6 w-px bg-[#303030] mx-1"></div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#A1A1AA] bg-[#1E1E1E] border border-[#303030]">
          <span className="hidden sm:inline text-[#F3F4F6]">{user?.email}</span>
          <span className="text-xs text-[#A9C4A1] bg-[#4A4E69]/20 px-1.5 py-0.5 rounded border border-[#4A4E69]/30">
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
}
