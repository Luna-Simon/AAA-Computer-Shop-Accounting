"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";

interface DashboardData {
  cashBalance: string;
  accountsReceivable: string;
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  totalRevenue: string;
  totalExpenses: string;
  netIncome: string;
  netIncomeIsPositive: boolean;
  draftCount: number;
  postedCount: number;
  equationBalanced: boolean;
  equationDifference: string;
}

export default function DashboardPage() {
  const { mode } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/dashboard", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A9C4A1]"></div>
        <p className="mt-3 text-[#A1A1AA]">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#1E1E1E] rounded-lg border border-[#4A4E69]/30 text-[#F3F4F6]">
        <h2 className="text-lg font-semibold mb-2">Unable to load dashboard</h2>
        <p className="text-[#A1A1AA]">{error}</p>
        <p className="mt-4 text-sm text-[#A1A1AA]">
          Make sure the database is configured and the server is running.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A9C4A1]"></div>
        <p className="mt-3 text-[#A1A1AA]">Loading dashboard...</p>
      </div>
    );
  }

  const {
    cashBalance,
    accountsReceivable,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalRevenue,
    totalExpenses,
    netIncome,
    netIncomeIsPositive,
    draftCount,
    postedCount,
    equationBalanced,
    equationDifference,
  } = data;

  // Mode-aware explanation text
  const modeExplanation =
    mode === "BEGINNER"
      ? "These totals are calculated from your posted journal entries. Each figure reflects actual transactions recorded in the system."
      : "All figures derive from posted journal entry lines. Drafts are excluded from balances and reports.";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#F3F4F6]">Dashboard</h1>
          <p className="text-[#A1A1AA] mt-1">
            Key accounting totals from your posted journal entries.
          </p>
          <p className="text-sm text-[#A9C4A1] mt-2">{modeExplanation}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#A1A1AA] font-mono">
            {postedCount} posted &bull; {draftCount} draft
          </p>
        </div>
      </div>

      {!equationBalanced && (
        <div className="p-4 rounded-lg bg-[#4A4E69]/20 border border-[#4A4E69]/30 text-[#A9C4A1] text-sm flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#A9C4A1]"></span>
          <span className="text-[#A9C4A1]">
            Accounting equation difference: {equationDifference}. This may be normal if accounts have unusual balances.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cash Balance"
          value={cashBalance || "0.00"}
          subtitle="Money in the bank and on hand"
          accentClass="border-[#A9C4A1]/30"
          valueClass="text-[#A9C4A1]"
          description="From the Cash account (101)."
        />
        <StatCard
          title="Accounts Receivable"
          value={accountsReceivable || "0.00"}
          subtitle="Customers owe you"
          accentClass="border-[#A9C4A1]/30"
          valueClass="text-[#A9C4A1]"
          description="From Accounts Receivable (102)."
        />
        <StatCard
          title="Total Assets"
          value={totalAssets || "0.00"}
          subtitle="Everything the business owns"
          accentClass="border-[#A9C4A1]/30"
          valueClass="text-[#A9C4A1]"
          description="Assets minus contra-assets."
        />
        <StatCard
          title="Total Liabilities"
          value={totalLiabilities || "0.00"}
          subtitle="What the business owes"
          accentClass="border-[#A9C4A1]/30"
          valueClass="text-[#A9C4A1]"
          description="All liability account balances."
        />
        <StatCard
          title="Owner's Equity"
          value={totalEquity || "0.00"}
          subtitle="Owner's stake in the business"
          accentClass="border-[#A9C4A1]/30"
          valueClass="text-[#A9C4A1]"
          description="Capital plus net income minus drawings."
        />
        <StatCard
          title="Total Revenue"
          value={totalRevenue || "0.00"}
          subtitle="Income earned this period"
          accentClass="border-[#A9C4A1]/30"
          valueClass="text-[#A9C4A1]"
          description="All revenue account balances."
        />
        <StatCard
          title="Total Expenses"
          value={totalExpenses || "0.00"}
          subtitle="Costs incurred this period"
          accentClass="border-[#A9C4A1]/30"
          valueClass="text-[#A9C4A1]"
          description="All expense account balances."
        />
        <StatCard
          title="Net Income / (Loss)"
          value={netIncome || "0.00"}
          subtitle={netIncomeIsPositive ? "Profit" : "Loss"}
          accentClass="border-[#A9C4A1]/30"
          valueClass={
            netIncomeIsPositive ? "text-[#A9C4A1]" : "text-[#F3F4F6]"
          }
          description="Revenue minus expenses."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
          <h2 className="text-lg font-semibold text-[#F3F4F6] mb-4">Recent Activity</h2>
          <p className="text-[#A1A1AA] text-sm mb-4">
            {postedCount} journal entries have been posted to the ledger.
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded border border-[#303030] bg-[#141414]/50">
              <span className="text-sm text-[#A1A1AA]">Posted entries</span>
              <span className="text-sm font-medium text-[#A9C4A1]">{postedCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded border border-[#303030] bg-[#141414]/50">
              <span className="text-sm text-[#A1A1AA]">Draft entries</span>
              <span className="text-sm font-medium text-[#A1A1AA]">{draftCount}</span>
            </div>
            {draftCount > 0 && (
              <div className="p-3 rounded bg-[#4A4E69]/20 border border-[#4A4E69]/30 text-[#A9C4A1] text-sm">
                You have {draftCount} unposted draft entries. These do not affect your financial statements until posted.
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
          <h2 className="text-lg font-semibold text-[#F3F4F6] mb-4">How Totals Are Calculated</h2>
          <ul className="text-[#A1A1AA] text-sm space-y-3 list-disc pl-5">
            <li>
              <strong className="text-[#F3F4F6]">Cash Balance:</strong> sum of all posted debit/credit lines in the Cash account (101).
            </li>
            <li>
              <strong className="text-[#F3F4F6]">Accounts Receivable:</strong> sum of posted lines in Accounts Receivable (102).
            </li>
            <li>
              <strong className="text-[#F3F4F6]">Total Assets:</strong> all Asset account balances minus Contra-asset balances.
            </li>
            <li>
              <strong className="text-[#F3F4F6]">Total Liabilities:</strong> all Liability account balances.
            </li>
            <li>
              <strong className="text-[#F3F4F6]">Owner's Equity:</strong> Equity balances minus Contra-equity (Drawings), plus current net income.
            </li>
            <li>
              <strong className="text-[#F3F4F6]">Net Income:</strong> Total Revenue minus Total Expenses.
            </li>
          </ul>
          <p className="text-xs text-[#A1A1AA] mt-4">
            All figures are calculated from actual posted journal entries in the database. Drafts are excluded.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  accentClass,
  valueClass,
  description,
}: {
  title: string;
  value: string;
  subtitle: string;
  accentClass: string;
  valueClass: string;
  description: string;
}) {
  return (
    <div className={`bg-[#1E1E1E] rounded-lg border border-[#303030] p-5 ${accentClass}`}>
      <p className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-1">
        {title}
      </p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl font-bold ${valueClass}`}>{value}</span>
      </div>
      <p className="text-xs text-[#A1A1AA]">{subtitle}</p>
      <p className="text-[10px] text-[#A1A1AA]/70 mt-1">{description}</p>
    </div>
  );
}
