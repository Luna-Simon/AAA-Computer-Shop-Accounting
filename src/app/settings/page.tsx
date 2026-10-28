"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/components/providers";
import { Save, Database, Trash2, Upload, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "success" as "success" | "error" });

  const isAdmin = user?.role === "ADMIN";

  async function seedData(type: "accounts" | "sample" | "all") {
    if (!isAdmin) return;
    setLoading(true);
    setMessage({ text: "", type: "success" });

    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ text: json.error || "Seed failed", type: "error" });
        return;
      }

      if (type === "all") {
        setMessage({
          text: `Seeded ${json.accounts} accounts and ${json.transactions} sample transactions.`,
          type: "success",
        });
      } else if (type === "accounts") {
        setMessage({
          text: `Created ${json.count} chart of accounts entries.`,
          type: "success",
        });
      } else {
        setMessage({
          text: `Created ${json.count} sample transactions.`,
          type: "success",
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Seed failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function resetTransactions() {
    if (!isAdmin) return;
    if (
      !window.confirm(
        "This will delete ALL journal entries (posted and drafts). The Chart of Accounts and user accounts will be preserved. This cannot be undone. Continue?"
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "success" });

    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "transactions" }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ text: json.error || "Reset failed", type: "error" });
        return;
      }
      setMessage({ text: json.message, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Reset failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F3F4F6]">Settings & Data Management</h1>
        <p className="text-[#A1A1AA] mt-1">
          Initialize the database, load sample data, or reset transactions.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg border ${message.type === "success" ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399]" : "border-[#F87171]/30 bg-[#F87171]/10 text-[#F87171]"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
        <h2 className="text-lg font-semibold text-[#F3F4F6] mb-6">Seed Sample Data</h2>
        <p className="text-[#A1A1AA] text-sm mb-4">
          Load the AAA Computer Services sample exercises (December 2024
          transactions) into the database. You can reload sample data at any
          time without duplicating transactions.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => seedData("accounts")}
            disabled={loading || !isAdmin}
            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors border ${!isAdmin
              ? "border-[#303030] bg-[#1E1E1E] text-[#A1A1AA]/50"
              : "border-[#4A4E69] bg-[#4A4E69] text-[#A9C4A1] hover:bg-[#5A5E79] disabled:opacity-50"
            }`}
          >
            <Database className="w-4 h-4 mr-3" />
            Seed Chart of Accounts
            <span className="ml-auto text-xs text-[#A1A1AA]/50">
              {isAdmin ? "Creates all 17 required accounts" : "Admin required"}
            </span>
          </button>

          <button
            onClick={() => seedData("sample")}
            disabled={loading || !isAdmin}
            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors border ${!isAdmin
              ? "border-[#303030] bg-[#1E1E1E] text-[#A1A1AA]/50"
              : "border-[#4A4E69] bg-[#4A4E69] text-[#A9C4A1] hover:bg-[#5A5E79] disabled:opacity-50"
            }`}
          >
            <Upload className="w-4 h-4 mr-3" />
            Seed Sample Transactions (Dec 2024)
            <span className="ml-auto text-xs text-[#A1A1AA]/50">
              {isAdmin ? "11 sample business transactions" : "Admin required"}
            </span>
          </button>

          <button
            onClick={() => seedData("all")}
            disabled={loading || !isAdmin}
            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors border ${!isAdmin
              ? "border-[#303030] bg-[#1E1E1E] text-[#A1A1AA]/50"
              : "border-[#7C3AED] bg-[#7C3AED] text-[#C4B5FD] hover:bg-[#8B5CF6] disabled:opacity-50"
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-3" />
            Seed Everything (Accounts + Transactions)
            <span className="ml-auto text-xs text-[#A1A1AA]/50">
              {isAdmin ? "Complete setup in one click" : "Admin required"}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
        <h2 className="text-lg font-semibold text-[#F3F4F6] mb-6">Reset Data</h2>
        <p className="text-[#A1A1AA] text-sm mb-4">
          Clear all transaction data. The Chart of Accounts and user accounts
          are preserved.
        </p>

        <button
          onClick={resetTransactions}
          disabled={loading || !isAdmin}
          className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors border ${!isAdmin
            ? "border-[#303030] bg-[#1E1E1E] text-[#A1A1AA]/50"
            : "border-[#F87171] bg-[#F87171]/20 text-[#F87171] hover:bg-[#F87171]/40 disabled:opacity-50"
          }`}
        >
          <Trash2 className="w-4 h-4 mr-3" />
          Clear All Journal Entries
          <span className="ml-auto text-xs text-[#A1A1AA]/50">
            {isAdmin ? "Deletes posted and draft entries" : "Admin required"}
          </span>
        </button>
      </div>

      <div className="bg-[#141414] rounded-lg border border-[#303030] p-6">
        <h2 className="text-lg font-semibold text-[#F3F4F6] mb-4">Important Notes</h2>
        <ul className="text-[#A1A1AA] text-sm space-y-2 list-disc pl-5">
          <li>
            Sample data is based on the AAA Computer Services exercise
            (December 2024). All amounts are editable.
          </li>
          <li>
            Reloading sample data will not duplicate transactions — it checks
            for existing entries first.
          </li>
          <li>
            All monetary calculations use exact decimal arithmetic (no
            floating-point errors).
          </li>
          <li>
            Posted entries cannot be deleted — only reversed through an
            auditable reversal process.
          </li>
          <li>
            The database is persistent. Data survives page refreshes and server
            restarts.
          </li>
        </ul>
      </div>

      {loading && (
        <div className="p-4 text-center text-[#A1A1AA]/50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#A9C4A1] mx-auto"></div>
        </div>
      )}
    </div>
  );
}
