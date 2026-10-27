"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

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

export default async function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Unable to load dashboard");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-3 text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200 text-red-700">
        <h2 className="text-lg font-semibold mb-2">Unable to load dashboard</h2>
        <p>{error}</p>
        <p className="mt-4 text-sm">
          Make sure the database is configured and the server is running.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-3 text-slate-600">Loading dashboard...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Key accounting totals from your posted journal entries.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-mono">
            {postedCount} posted &bull; {draftCount} draft
          </p>
        </div>
      </div>

      {!equationBalanced && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>
            Accounting equation difference: {equationDifference}. This may be
            normal if accounts have unusual balances.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cash Balance"
          value={cashBalance || "₱0.00"}
          subtitle="Money in the bank and on hand"
          bgClass="bg-blue-50"
          description="From the Cash account (101)."
        />
        <StatCard
          title="Accounts Receivable"
          value={accountsReceivable || "₱0.00"}
          subtitle="Customers owe you"
          bgClass="bg-green-50"
          description="From Accounts Receivable (102)."
        />
        <StatCard
          title="Total Assets"
          value={totalAssets || "₱0.00"}
          subtitle="Everything the business owns"
          bgClass="bg-indigo-50"
          description="Assets minus contra-assets."
        />
        <StatCard
          title="Total Liabilities"
          value={totalLiabilities || "₱0.00"}
          subtitle="What the business owes"
          bgClass="bg-orange-50"
          description="All liability account balances."
        />
        <StatCard
          title="Owner's Equity"
          value={totalEquity || "₱0.00"}
          subtitle="Owner's stake in the business"
          bgClass="bg-purple-50"
          description="Capital + net income - drawings."
        />
        <StatCard
          title="Total Revenue"
          value={totalRevenue || "₱0.00"}
          subtitle="Income earned this period"
          bgClass="bg-emerald-50"
          description="All revenue account balances."
        />
        <StatCard
          title="Total Expenses"
          value={totalExpenses || "₱0.00"}
          subtitle="Costs incurred this period"
          bgClass="bg-rose-50"
          description="All expense account balances."
        />
        <StatCard
          title="Net Income / (Loss)"
          value={netIncome || "₱0.00"}
          subtitle={netIncomeIsPositive ? "Profit" : "Loss"}
          bgClass={netIncomeIsPositive ? "bg-emerald-50" : "bg-rose-50"}
          description="Revenue minus expenses."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <p className="text-sm text-slate-500 mb-4">
            {postedCount} journal entries have been posted to the ledger.
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded border border-slate-100">
              <span className="text-sm text-slate-600">Posted entries</span>
              <span className="text-sm font-medium text-emerald-600">{postedCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded border border-slate-100">
              <span className="text-sm text-slate-600">Draft entries</span>
              <span className="text-sm font-medium text-amber-600">{draftCount}</span>
            </div>
            {draftCount > 0 && (
              <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                You have {draftCount} unposted draft entry/drafts. These do not
                affect your financial statements until posted.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How Totals Are Calculated</h2>
          <ul className="text-sm text-slate-600 space-y-3 list-disc pl-5">
            <li>
              <strong>Cash Balance:</strong> sum of all posted debit/credit
              lines in the Cash account (101).
            </li>
            <li>
              <strong>Accounts Receivable:</strong> sum of posted lines in
              Accounts Receivable (102).
            </li>
            <li>
              <strong>Total Assets:</strong> all Asset account balances minus
              Contra-asset balances.
            </li>
            <li>
              <strong>Total Liabilities:</strong> all Liability account
              balances.
            </li>
            <li>
              <strong>Owner's Equity:</strong> Equity balances minus
              Contra-equity (Drawings), plus current net income.
            </li>
            <li>
              <strong>Net Income:</strong> Total Revenue minus Total Expenses.
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-4">
            All figures are calculated from actual posted journal entries in the
            database. Drafts are excluded.
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
  bgClass,
  description,
}: {
  title: string;
  value: string;
  subtitle: string;
  bgClass: string;
  description: string;
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-5 ${bgClass}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
        {title}
      </p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <p className="text-[10px] text-slate-400 mt-1 italic">{description}</p>
    </div>
  );
}
