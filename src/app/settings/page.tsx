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
        "This will delete ALL journal entries (posted and drafts). The Chart of Accounts and users will be preserved. This cannot be undone. Continue?"
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
        <h1 className="text-2xl font-bold text-slate-900">Settings & Data Management</h1>
        <p className="text-slate-600 mt-1">
          Initialize the database, load sample data, or reset transactions.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Seed Sample Data</h2>
        <p className="text-sm text-slate-600 mb-4">
          Load the AAA Computer Services sample exercises (December 2024
          transactions) into the database. You can reload sample data at any
          time without duplicating transactions.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => seedData("accounts")}
            disabled={loading || !isAdmin}
            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${!isAdmin
              ? "bg-slate-200 text-slate-500"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            }`}
          >
            <Database className="w-4 h-4 mr-3" />
            Seed Chart of Accounts
            <span className="ml-auto text-xs text-slate-400">
              {isAdmin ? "Creates all 17 required accounts" : "Admin required"}
            </span>
          </button>

          <button
            onClick={() => seedData("sample")}
            disabled={loading || !isAdmin}
            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${!isAdmin
              ? "bg-slate-200 text-slate-500"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            }`}
          >
            <Upload className="w-4 h-4 mr-3" />
            Seed Sample Transactions (Dec 2024)
            <span className="ml-auto text-xs text-slate-400">
              {isAdmin ? "11 sample business transactions" : "Admin required"}
            </span>
          </button>

          <button
            onClick={() => seedData("all")}
            disabled={loading || !isAdmin}
            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${!isAdmin
              ? "bg-slate-200 text-slate-500"
              : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-3" />
            Seed Everything (Accounts + Transactions)
            <span className="ml-auto text-xs text-slate-400">
              {isAdmin ? "Complete setup in one click" : "Admin required"}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Reset Data</h2>
        <p className="text-sm text-slate-600 mb-4">
          Clear all transaction data. The Chart of Accounts and user accounts
          are preserved.
        </p>

        <button
          onClick={resetTransactions}
          disabled={loading || !isAdmin}
          className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${!isAdmin
            ? "bg-slate-200 text-slate-500"
            : "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          }`}
        >
          <Trash2 className="w-4 h-4 mr-3" />
          Clear All Journal Entries
          <span className="ml-auto text-xs text-slate-400">
            {isAdmin ? "Deletes posted and draft entries" : "Admin required"}
          </span>
        </button>
      </div>

      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Important Notes</h2>
        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
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
        <div className="p-4 text-center text-slate-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}
    </div>
  );
}
