"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { BarChart3, FileText } from "lucide-react";

export default function IncomeStatementPage() {
  const [isData, setIsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadIncomeStatement();
  }, [startDate, endDate]);

  async function loadIncomeStatement() {
    if (!startDate || !endDate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/reports/income-statement?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load income statement");
      const json = await res.json();
      setIsData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load income statement");
    } finally {
      setLoading(false);
    }
  }

  if (!startDate || !endDate) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F3F4F6]">Income Statement</h1>
          <p className="text-[#A1A1AA] mt-1">
            Shows revenue, expenses, and net income for a period.
          </p>
        </div>
        <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-8 text-center">
          <p className="text-[#A1A1AA]/50 mb-6">
            Please select a date range to generate the income statement.
          </p>
          <div className="flex gap-2 justify-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
            />
            <span className="text-[#A1A1AA]/50">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
            />
          </div>
        </div>
      </div>
    );
  }

  const { totalRevenue, totalExpenses, netIncome, isProfit, revenueAccounts, expenseAccounts } = isData || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#F3F4F6]">Income Statement</h1>
          <p className="text-[#A1A1AA] mt-1">
            Revenue and expenses for the period {startDate} to {endDate}.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-[#A1A1AA]/50">Loading income statement...</div>
      ) : (
        <>
          <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#141414] text-[#A1A1AA]/60 uppercase text-xs sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#10B981]/20 font-semibold border-b border-[#10B981]/30">
                  <td className="px-4 py-3">Computer Service Revenue</td>
                  <td className="px-4 py-3 text-right font-mono">{totalRevenue}</td>
                </tr>
                {revenueAccounts?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-[#A1A1AA]/50 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}
                <tr className="bg-[#141414] border-b border-[#303030]">
                  <td className="px-4 py-3 text-right font-bold">Total Revenue</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{totalRevenue}</td>
                </tr>

                <tr className="bg-[#F87171]/20 font-semibold border-b border-[#F87171]/30">
                  <td className="px-4 py-3">Expenses</td>
                  <td className="px-4 py-3 text-right font-mono">{totalExpenses}</td>
                </tr>
                {expenseAccounts?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-[#A1A1AA]/50 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}
                <tr className="bg-[#141414] border-b border-[#303030]">
                  <td className="px-4 py-3 text-right font-bold">Total Expenses</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{totalExpenses}</td>
                </tr>

                <tr className="bg-[#303030] font-bold">
                  <td className="px-4 py-3 text-right">{isProfit ? "Net Income" : "Net Loss"}</td>
                  <td className="px-4 py-3 text-right font-mono text-lg">
                    {isProfit ? "₱" + Math.abs(parseFloat(netIncome)).toFixed(2) : "(₱" + Math.abs(parseFloat(netIncome)).toFixed(2) + ")"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 rounded-lg border border-[#303030]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-[#F3F4F6] mb-1">Summary</h3>
                <p className="text-[#A1A1AA] text-sm">Net Income = Revenue − Expenses</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-mono font-bold ${isProfit ? "text-[#34D399]" : "text-[#F87171]"}`}>
                  {isProfit ? "Profit" : "Loss"}
                </div>
                <div className="text-xs text-[#A1A1AA]/50 mt-1">
                  ₱{Math.abs(parseFloat(netIncome || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
