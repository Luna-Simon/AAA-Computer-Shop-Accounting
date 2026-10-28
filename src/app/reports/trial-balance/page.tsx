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
          <h1 className="text-2xl font-bold text-[#F3F4F6]">Trial Balance</h1>
          <p className="text-[#A1A1AA] mt-1">
            Verifies that total debits equal total credits across all accounts.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
        <div className="flex gap-4 items-end mb-6">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA]/50 mb-2 uppercase">As of date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-sm bg-[#111111] text-[#F3F4F6]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#A1A1AA]/50">Loading trial balance...</div>
        ) : !tb ? (
          <div className="p-8 text-center text-[#A1A1AA]/50">No data available.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#141414] text-[#A1A1AA]/60 uppercase text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left">Account No.</th>
                    <th className="px-4 py-3 text-left">Account Name</th>
                    <th className="px-4 py-3 text-left">Classification</th>
                    <th className="px-4 py-3 text-right">Debit Balance</th>
                    <th className="px-4 py-3 text-right">Credit Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#303030]">
                  {tb.rows.map((row: any) => (
                    <tr key={`${row.accountNo}-${row.debitBalance}-${row.creditBalance}`} className="hover:bg-[#303030]/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-[#A1A1AA]">{row.accountNo}</td>
                      <td className="px-4 py-3 text-[#F3F4F6]">{row.accountName}</td>
                      <td className="px-4 py-3 text-[#A1A1AA]/50 text-xs capitalize">{row.classification.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#F3F4F6]">
                        {parseFloat(row.debitBalance) > 0 ? row.debitBalance : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#F3F4F6]">
                        {parseFloat(row.creditBalance) > 0 ? row.creditBalance : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#141414] font-bold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right">Totals:</td>
                    <td className="px-4 py-3 text-right font-mono text-[#F3F4F6]">
                      {tb.totalDebits}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F3F4F6]">
                      {tb.totalCredits}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 p-4 rounded-lg border border-[#303030]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-[#F3F4F6] mb-1">Trial Balance Check</h3>
                  <p className="text-[#A1A1AA] text-sm">Total debits must equal total credits.</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-mono font-bold ${tb.balanced ? "text-[#34D399]" : "text-[#F87171]"}`}>
                    {tb.balanced ? "BALANCED" : "OUT OF BALANCE"}
                  </div>
                  {!tb.balanced && (
                    <div className="text-xs text-[#F87171] mt-1">
                      Difference: {Math.abs(parseFloat(tb.totalDebits) - parseFloat(tb.totalCredits)).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-[#4A4E69]/20 rounded-lg border border-[#4A4E69]/30 p-4">
              <h3 className="text-sm font-semibold text-[#A9C4A1] mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                How to read this report
              </h3>
              <ul className="text-[#A1A1AA] text-sm space-y-1 list-disc pl-5">
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
