"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { BarChart3, FileText } from "lucide-react";

export default function BalanceSheetPage() {
  const [bs, setBs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState("");

  useEffect(() => {
    loadBalanceSheet();
  }, [asOfDate]);

  async function loadBalanceSheet() {
    if (!asOfDate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ asOfDate });
      const res = await fetch(`/api/reports/balance-sheet?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load balance sheet");
      const json = await res.json();
      setBs(json);
    } catch (err: any) {
      setError(err.message || "Failed to load balance sheet");
    } finally {
      setLoading(false);
    }
  }

  if (!asOfDate) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-slate-600 mt-1">
            Shows assets, liabilities, and equity as of a specific date.
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500 mb-6">
            Please select a date to generate the balance sheet.
          </p>
          <div className="flex justify-center">
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  const { totalAssets, totalLiabilities, totalEquity, totalLiabilitiesPlusEquity, balanced, difference, netIncome, assets, contraAssets, liabilities, equities, contraEquities } = bs || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-slate-600 mt-1">
            As of {asOfDate}. Assets = Liabilities + Owner's Equity.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading balance sheet...</div>
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
                <tr className="bg-blue-50 font-semibold border-b border-blue-100">
                  <td className="px-4 py-3">Assets</td>
                  <td className="px-4 py-3 text-right font-mono">{totalAssets}</td>
                </tr>
                {assets?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-slate-600 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}
                {contraAssets?.length && (
                  <>
                    <tr className="text-slate-500">
                      <td className="px-4 py-2 pl-8">Less: Contra-Assets</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-500"></td>
                    </tr>
                    {contraAssets.map((acc: any) => (
                      <tr key={acc.accountNo}>
                        <td className="px-4 py-2 text-slate-600 pl-8">{acc.accountName}</td>
                        <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                      </tr>
                    ))}
                  </>
                )}

                <tr className="bg-orange-50 font-semibold border-b border-orange-100 mt-4">
                  <td className="px-4 py-3">Liabilities</td>
                  <td className="px-4 py-3 text-right font-mono">{totalLiabilities}</td>
                </tr>
                {liabilities?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-slate-600 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}

                <tr className="bg-purple-50 font-semibold border-b border-purple-100 mt-4">
                  <td className="px-4 py-3">Owner's Equity</td>
                  <td className="px-4 py-3 text-right font-mono">{totalEquity}</td>
                </tr>
                {equities?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-slate-600 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}
                {contraEquities?.length && (
                  <tr key="contra">
                    <td className="px-4 py-2 text-slate-600 pl-8">{contraEquities[0]?.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{contraEquities[0]?.amount}</td>
                  </tr>
                )}
                {netIncome && (
                  <tr key="netIncome">
                    <td className="px-4 py-2 text-slate-600 pl-8">Current Net Income</td>
                    <td className="px-4 py-2 text-right font-mono">{netIncome}</td>
                  </tr>
                )}

                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td className="px-4 py-3 text-right">Total Liabilities + Equity</td>
                  <td className="px-4 py-3 text-right font-mono text-lg">{totalLiabilitiesPlusEquity}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 rounded-lg border">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Accounting Equation Check</h3>
                <p className="text-sm text-slate-600">Assets = Liabilities + Owner's Equity</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-mono font-bold ${balanced ? "text-emerald-600" : "text-red-600"}`}>
                  {balanced ? "BALANCED" : "OUT OF BALANCE"}
                </div>
                {!balanced && (
                  <div className="text-xs text-red-500 mt-1">Difference: {difference}</div>
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
              <li>Assets are what the business owns (Cash, Accounts Receivable, Office Supplies, Office Equipment).</li>
              <li>Contra-Assets (Accumulated Depreciation) reduce the carrying value of assets.</li>
              <li>Liabilities are what the business owes (Accounts Payable, Salaries Payable, Unearned Revenue, etc.).</li>
              <li>Owner's Equity is the owner's stake (Capital, plus net income, minus Drawings).</li>
              <li>Total Assets must equal Total Liabilities + Owner's Equity.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
