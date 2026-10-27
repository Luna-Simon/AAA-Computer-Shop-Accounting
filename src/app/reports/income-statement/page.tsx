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
          <h1 className="text-2xl font-bold text-slate-900">Income Statement</h1>
          <p className="text-slate-600 mt-1">
            Shows revenue, expenses, and net income for a period.
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500 mb-6">
            Please select a date range to generate the income statement.
          </p>
          <div className="flex gap-2 justify-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
          <h1 className="text-2xl font-bold text-slate-900">Income Statement</h1>
          <p className="text-slate-600 mt-1">
            Revenue and expenses for the period {startDate} to {endDate}.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading income statement...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-slate-200 p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-emerald-50 font-semibold border-b border-emerald-100">
                  <td className="px-4 py-3">Computer Service Revenue</td>
                  <td className="px-4 py-3 text-right font-mono">{totalRevenue}</td>
                </tr>
                {revenueAccounts?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-slate-600 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-b border-slate-200">
                  <td className="px-4 py-3 text-right font-bold">Total Revenue</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{totalRevenue}</td>
                </tr>

                <tr className="bg-rose-50 font-semibold border-b border-rose-100">
                  <td className="px-4 py-3">Expenses</td>
                  <td className="px-4 py-3 text-right font-mono">{totalExpenses}</td>
                </tr>
                {expenseAccounts?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-slate-600 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-b border-slate-200">
                  <td className="px-4 py-3 text-right font-bold">Total Expenses</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{totalExpenses}</td>
                </tr>

                <tr className="bg-slate-100 font-bold">
                  <td className="px-4 py-3 text-right">{isProfit ? "Net Income" : "Net Loss"}</td>
                  <td className="px-4 py-3 text-right font-mono text-lg">
                    {isProfit ? "₱" + Math.abs(parseFloat(netIncome)).toFixed(2) : "(₱" + Math.abs(parseFloat(netIncome)).toFixed(2) + ")"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 rounded-lg border">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Summary</h3>
                <p className="text-sm text-slate-600">Net Income = Revenue − Expenses</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-mono font-bold ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>
                  {isProfit ? "Profit" : "Loss"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
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
