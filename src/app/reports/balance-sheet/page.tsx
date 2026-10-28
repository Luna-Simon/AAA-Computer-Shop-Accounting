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
          <h1 className="text-2xl font-bold text-[#F3F4F6]">Balance Sheet</h1>
          <p className="text-[#A1A1AA] mt-1">
            Shows assets, liabilities, and equity as of a specific date.
          </p>
        </div>
        <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-8 text-center">
          <p className="text-[#A1A1AA]/50 mb-6">
            Please select a date to generate the balance sheet.
          </p>
          <div className="flex justify-center">
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
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
          <h1 className="text-2xl font-bold text-[#F3F4F6]">Balance Sheet</h1>
          <p className="text-[#A1A1AA] mt-1">
            As of {asOfDate}. Assets = Liabilities + Owner's Equity.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-[#A1A1AA]/50">Loading balance sheet...</div>
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
                <tr className="bg-[#4A4E69]/20 font-semibold border-b border-[#4A4E69]/30">
                  <td className="px-4 py-3">Assets</td>
                  <td className="px-4 py-3 text-right font-mono">{totalAssets}</td>
                </tr>
                {assets?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-[#A1A1AA]/50 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}
                {contraAssets?.length && (
                  <>
                    <tr className="text-[#A1A1AA]/50">
                      <td className="px-4 py-2 pl-8">Less: Contra-Assets</td>
                      <td className="px-4 py-2 text-right font-mono text-[#A1A1AA]/50"></td>
                    </tr>
                    {contraAssets.map((acc: any) => (
                      <tr key={acc.accountNo}>
                        <td className="px-4 py-2 text-[#A1A1AA]/50 pl-8">{acc.accountName}</td>
                        <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                      </tr>
                    ))}
                  </>
                )}

                <tr className="bg-[#FBBF24]/20 font-semibold border-b border-[#FBBF24]/30 mt-4">
                  <td className="px-4 py-3">Liabilities</td>
                  <td className="px-4 py-3 text-right font-mono">{totalLiabilities}</td>
                </tr>
                {liabilities?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-[#A1A1AA]/50 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}

                <tr className="bg-[#A9C4A1]/20 font-semibold border-b border-[#A9C4A1]/30 mt-4">
                  <td className="px-4 py-3">Owner's Equity</td>
                  <td className="px-4 py-3 text-right font-mono">{totalEquity}</td>
                </tr>
                {equities?.map((acc: any) => (
                  <tr key={acc.accountNo}>
                    <td className="px-4 py-2 text-[#A1A1AA]/50 pl-8">{acc.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{acc.amount}</td>
                  </tr>
                ))}
                {contraEquities?.length && (
                  <tr key="contra">
                    <td className="px-4 py-2 text-[#A1A1AA]/50 pl-8">{contraEquities[0]?.accountName}</td>
                    <td className="px-4 py-2 text-right font-mono">{contraEquities[0]?.amount}</td>
                  </tr>
                )}
                {netIncome && (
                  <tr key="netIncome">
                    <td className="px-4 py-2 text-[#A1A1AA]/50 pl-8">Current Net Income</td>
                    <td className="px-4 py-2 text-right font-mono">{netIncome}</td>
                  </tr>
                )}

                <tr className="bg-[#303030] font-bold border-t-2 border-[#F3F4F6]">
                  <td className="px-4 py-3 text-right">Total Liabilities + Equity</td>
                  <td className="px-4 py-3 text-right font-mono text-lg">{totalLiabilitiesPlusEquity}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 rounded-lg border border-[#303030]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-[#F3F4F6] mb-1">Accounting Equation Check</h3>
                <p className="text-[#A1A1AA] text-sm">Assets = Liabilities + Owner's Equity</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-mono font-bold ${balanced ? "text-[#34D399]" : "text-[#F87171]"}`}>
                  {balanced ? "BALANCED" : "OUT OF BALANCE"}
                </div>
                {!balanced && (
                  <div className="text-xs text-[#F87171] mt-1">Difference: {difference}</div>
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
