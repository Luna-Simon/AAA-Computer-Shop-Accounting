"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { Search, FileText, BarChart3 } from "lucide-react";

export default function TrialBalancePage() {
  const [tb, setTb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState("");

  useEffect(() => {
    loadTrialBalance();
  }, [asOfDate]);

  async function loadTrialBalance() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (asOfDate) params.set("asOfDate", asOfDate);

      const res = await fetch(`/api/reports/trial-balance?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load trial balance");
      const json = await res.json();
      setTb(json);
    } catch (err: any) {
      setError(err.message || "Failed to load trial balance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trial Balance</h1>
          <p className="text-slate-600 mt-1">
            Verifies that total debits equal total credits across all accounts.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex gap-4 items-end mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">As of date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading trial balance...</div>
        ) : !tb ? (
          <div className="p-8 text-center text-slate-500">No data available.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left">Account No.</th>
                    <th className="px-4 py-3 text-left">Account Name</th>
                    <th className="px-4 py-3 text-left">Classification</th>
                    <th className="px-4 py-3 text-right">Debit Balance</th>
                    <th className="px-4 py-3 text-right">Credit Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tb.rows.map((row: any) => (
                    <tr key={`${row.accountNo}-${row.debitBalance}-${row.creditBalance}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-700">{row.accountNo}</td>
                      <td className="px-4 py-3 text-slate-800">{row.accountName}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs capitalize">{row.classification.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {parseFloat(row.debitBalance) > 0 ? row.debitBalance : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {parseFloat(row.creditBalance) > 0 ? row.creditBalance : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right">Totals:</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">
                      {tb.totalDebits}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">
                      {tb.totalCredits}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 p-4 rounded-lg border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Trial Balance Check</h3>
                  <p className="text-sm text-slate-600">Total debits must equal total credits.</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-mono font-bold ${tb.balanced ? "text-emerald-600" : "text-red-600"}`}>
                    {tb.balanced ? "BALANCED" : "OUT OF BALANCE"}
                  </div>
                  {!tb.balanced && (
                    <div className="text-xs text-red-500 mt-1">
                      Difference: {Math.abs(parseFloat(tb.totalDebits) - parseFloat(tb.totalCredits)).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                How to read this report
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
                <li>Accounts with a debit normal balance (Assets, Expenses) show their balance in the Debit column.</li>
                <li>Accounts with a credit normal balance (Liabilities, Equity, Revenue) show their balance in the Credit column.</li>
                <li>Total Debits must equal Total Credits. If not, there is an error in the journal entries.</li>
                <li>Only posted entries are included. Drafts are excluded.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
