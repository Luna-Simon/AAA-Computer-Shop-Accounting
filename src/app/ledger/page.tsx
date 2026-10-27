"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { Search, BookOpen } from "lucide-react";

export default function LedgerPage() {
  const [ledger, setLedger] = useState<any>({ accounts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState("");
  const [asOfDate, setAsOfDate] = useState("");

  useEffect(() => {
    loadLedger();
  }, [accountFilter, asOfDate]);

  async function loadLedger() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (accountFilter) params.set("accountId", accountFilter);
      if (asOfDate) params.set("asOfDate", asOfDate);

      const res = await fetch(`/api/reports/ledger?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load ledger");
      const json = await res.json();
      setLedger(json);
    } catch (err: any) {
      setError(err.message || "Failed to load general ledger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            General Ledger
          </h1>
          <p className="text-slate-600 mt-1">
            All posted transactions grouped by account with running balances.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">
              Account
            </label>
            <input
              type="text"
              value={accountFilter}
              placeholder="e.g. 101"
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">
              As of date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setAccountFilter("");
                setAsOfDate("");
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading ledger...
          </div>
        ) : ledger.accounts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No ledger entries found. Post some transactions first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {ledger.accounts.map((acc: any) => (
              <div
                key={acc.accountNo}
                className="mb-6 border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-800">
                        {acc.accountNo}
                      </span>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">
                        {acc.classification}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {acc.finalBalance} {acc.finalSide}
                      </div>
                      <div className="text-xs text-slate-500">
                        Normal: {acc.normalBalance}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-slate-700 mt-1">
                    {acc.accountName}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Ref No.</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-right">Debit</th>
                        <th className="px-4 py-2 text-right">Credit</th>
                        <th className="px-4 py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {acc.entries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                            No posted entries
                          </td>
                        </tr>
                      ) : (
                        acc.entries.map((e: any) => (
                          <tr
                            key={`${acc.accountNo}-${e.date}-${e.referenceNo}`}
                          >
                            <td className="px-4 py-2 font-mono text-slate-600">
                              {new Date(e.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 font-mono text-slate-600">
                              {e.referenceNo}
                            </td>
                            <td className="px-4 py-2 text-slate-700 truncate max-w-xs">
                              {e.description}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-slate-700">
                              {e.debit !== "0.00" ? e.debit : "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-slate-700">
                              {e.credit !== "0.00" ? e.credit : "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-slate-800 font-medium">
                              {e.runningBalance} {e.side}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          How to read the ledger
        </h3>
        <p className="text-sm text-blue-800 mb-2">
          Each account shows all posted transactions affecting it, with a
          running balance after each line.
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
          <li>
            The running balance uses the account's normal balance. For Asset
            and Expense accounts, debits increase the balance. For Liability,
            Equity, and Revenue accounts, credits increase the balance.
          </li>
          <li>
            Contra accounts (like Accumulated Depreciation and Drawing) work in
            the opposite direction from their parent category.
          </li>
          <li>
            The ledger is derived directly from posted journal entries. It is
            never manually edited, so it always reconciles with the journal.
          </li>
        </ul>
      </div>
    </div>
  );
}
