"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import {
  Plus,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";

interface Account {
  id: string;
  accountNo: string;
  name: string;
  classification: string;
  normalBalance: string;
  description: string | null;
  isActive: boolean;
  debitBalance: string;
  creditBalance: string;
  net: string;
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  ASSET: "Asset",
  CONTRA_ASSET: "Contra-Asset",
  LIABILITY: "Liability",
  OWNERS_EQUITY: "Owner's Equity",
  CONTRA_EQUITY: "Contra-Equity",
  REVENUE: "Revenue",
  EXPENSE: "Expense",
};

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formAccountNo, setFormAccountNo] = useState("");
  const [formName, setFormName] = useState("");
  const [formClassification, setFormClassification] = useState("ASSET");
  const [formNormalBalance, setFormNormalBalance] = useState("DEBIT");
  const [formDescription, setFormDescription] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load accounts");
      const json = await res.json();
      setAccounts(json.accounts || []);
    } catch (err: any) {
      setError(err.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const body: any = {
      accountNo: formAccountNo.trim(),
      name: formName.trim(),
      classification: formClassification,
      normalBalance: formNormalBalance,
      description: formDescription.trim() || null,
    };

    if (editingId) {
      body.id = editingId;
    }

    try {
      const res = await fetch("/api/accounts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Failed to save account");
        return;
      }
      setShowForm(false);
      setEditingId(null);
      loadAccounts();
    } catch (err: any) {
      setFormError(err.message || "Failed to save account");
    }
  }

  async function deleteAccount(id: string, accountNo: string) {
    if (
      !window.confirm(
        `Delete account ${accountNo}? This cannot be undone if the account has no posted transactions.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/accounts?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Cannot delete account");
        return;
      }
      loadAccounts();
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    }
  }

  function resetForm() {
    setFormAccountNo("");
    setFormName("");
    setFormClassification("ASSET");
    setFormNormalBalance("DEBIT");
    setFormDescription("");
  }

  function startEdit(acc: Account) {
    setEditingId(acc.id);
    setFormAccountNo(acc.accountNo);
    setFormName(acc.name);
    setFormClassification(acc.classification);
    setFormNormalBalance(acc.normalBalance);
    setFormDescription(acc.description || "");
    setShowForm(true);
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Chart of Accounts
          </h1>
          <p className="text-slate-600 mt-1">
            All accounts and their current balances from posted entries.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter accounts by number or name..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Account No.</th>
              <th className="px-4 py-3 font-medium">Account Name</th>
              <th className="px-4 py-3 font-medium">Classification</th>
              <th className="px-4 py-3 font-medium text-right">
                Normal Balance
              </th>
              <th className="px-4 py-3 font-medium text-right">
                Debit Balance
              </th>
              <th className="px-4 py-3 font-medium text-right">
                Credit Balance
              </th>
              {isAdmin && (
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Loading accounts...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No accounts found. Add accounts to get started.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr
                  key={acc.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {acc.accountNo}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {acc.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      acc.classification === "ASSET"
                        ? "bg-blue-100 text-blue-700 border-blue-100"
                        : acc.classification === "CONTRA_ASSET"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : acc.classification === "LIABILITY"
                        ? "bg-orange-100 text-orange-700 border-orange-100"
                        : acc.classification === "OWNERS_EQUITY"
                        ? "bg-purple-100 text-purple-700 border-purple-100"
                        : acc.classification === "CONTRA_EQUITY"
                        ? "bg-pink-100 text-pink-700 border-pink-100"
                        : acc.classification === "REVENUE"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-100"
                        : "bg-rose-100 text-rose-700 border-rose-100"
                    }`}
                    >
                      {CLASSIFICATION_LABELS[acc.classification] ||
                        acc.classification}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {acc.normalBalance === "DEBIT" ? "Debit" : "Credit"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {parseFloat(acc.debitBalance) > 0
                      ? acc.debitBalance
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {parseFloat(acc.creditBalance) > 0
                      ? acc.creditBalance
                      : "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => startEdit(acc)}
                          className="text-slate-600 hover:text-blue-600 p-1.5"
                          title="Edit account"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAccount(acc.id, acc.accountNo)}
                          className="text-slate-600 hover:text-red-600 p-1.5"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? "Edit Account" : "Add New Account"}
          </h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formAccountNo}
                onChange={(e) => setFormAccountNo(e.target.value)}
                placeholder="e.g. 101"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Unique number for this account (e.g. 101 for Cash).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Cash, Accounts Receivable"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Classification
                </label>
                <select
                  value={formClassification}
                  onChange={(e) =>
                    setFormClassification(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="ASSET">Asset</option>
                  <option value="CONTRA_ASSET">
                    Contra-Asset
                  </option>
                  <option value="LIABILITY">Liability</option>
                  <option value="OWNERS_EQUITY">
                    Owner's Equity
                  </option>
                  <option value="CONTRA_EQUITY">
                    Contra-Equity
                  </option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Normal Balance
                </label>
                <select
                  value={formNormalBalance}
                  onChange={(e) =>
                    setFormNormalBalance(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  The side where increases are recorded.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Cash on hand and in bank"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? "Save Changes" : "Add Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          How balances work
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
          <li>
            Balances are calculated from posted journal entries only. Drafts
            are excluded.
          </li>
          <li>
            Accounts used by posted transactions cannot be deleted (protects
            accounting history).
          </li>
          <li>
            Changing an account number or classification on an account used in
            posted entries is not allowed.
          </li>
        </ul>
      </div>
    </div>
  );
}
