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

const CLASSIFICATION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ASSET: { bg: "bg-[#4A4E69]/20", text: "text-[#A9C4A1]", border: "border-[#4A4E69]/30" },
  CONTRA_ASSET: { bg: "bg-[#303030]", text: "text-[#A1A1AA]", border: "border-[#303030]" },
  LIABILITY: { bg: "bg-[#7C3AED]/20", text: "text-[#C4B5FD]", border: "border-[#7C3AED]/30" },
  OWNERS_EQUITY: { bg: "bg-[#A9C4A1]/20", text: "text-[#A9C4A1]", border: "border-[#A9C4A1]/30" },
  CONTRA_EQUITY: { bg: "bg-[#DB2777]/20", text: "text-[#F472B6]", border: "border-[#DB2777]/30" },
  REVENUE: { bg: "bg-[#10B981]/20", text: "text-[#34D399]", border: "border-[#10B981]/30" },
  EXPENSE: { bg: "bg-[#EF4444]/20", text: "text-[#F87171]", border: "border-[#EF4444]/30" },
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
          <h1 className="text-2xl font-bold text-[#F3F4F6]">
            Chart of Accounts
          </h1>
          <p className="text-[#A1A1AA] mt-1">
            All accounts and their current balances from posted entries.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A4E69] text-[#A9C4A1] rounded-lg hover:bg-[#5A5E79] text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-[#A1A1AA]/50" />
        <input
          type="text"
          placeholder="Filter accounts by number or name..."
          className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-sm bg-[#111111] text-[#F3F4F6] placeholder-[#A1A1AA]/50"
        />
      </div>

      <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#141414] text-[#A1A1AA]/60 uppercase text-xs">
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
          <tbody className="divide-y divide-[#303030]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#A1A1AA]/50">
                  Loading accounts...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#A1A1AA]/50">
                  No accounts found. Add accounts to get started.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => {
                const style = CLASSIFICATION_STYLES[acc.classification] || CLASSIFICATION_STYLES.EXPENSE;
                return (
                  <tr
                    key={acc.id}
                    className="hover:bg-[#303030]/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[#F3F4F6]">
                      {acc.accountNo}
                    </td>
                    <td className="px-4 py-3 text-[#F3F4F6] font-medium">
                      {acc.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${style.border} ${style.bg} ${style.text}`}>
                        {CLASSIFICATION_LABELS[acc.classification] || acc.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F3F4F6]">
                      {acc.normalBalance === "DEBIT" ? "Debit" : "Credit"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F3F4F6]">
                      {parseFloat(acc.debitBalance) > 0
                        ? acc.debitBalance
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F3F4F6]">
                      {parseFloat(acc.creditBalance) > 0
                        ? acc.creditBalance
                        : "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => startEdit(acc)}
                            className="text-[#A1A1AA] hover:text-[#A9C4A1] p-1.5"
                            title="Edit account"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAccount(acc.id, acc.accountNo)}
                            className="text-[#A1A1AA] hover:text-[#F87171] p-1.5"
                            title="Delete account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6 max-w-md">
          <h2 className="text-lg font-semibold text-[#F3F4F6] mb-4">
            {editingId ? "Edit Account" : "Add New Account"}
          </h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formAccountNo}
                onChange={(e) => setFormAccountNo(e.target.value)}
                placeholder="e.g. 101"
                className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                required
              />
              <p className="text-xs text-[#A1A1AA]/50 mt-1">
                Unique number for this account (e.g. 101 for Cash).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Cash, Accounts Receivable"
                className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
                  Classification
                </label>
                <select
                  value={formClassification}
                  onChange={(e) =>
                    setFormClassification(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                >
                  <option value="ASSET">Asset</option>
                  <option value="CONTRA_ASSET">Contra-Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="OWNERS_EQUITY">Owner's Equity</option>
                  <option value="CONTRA_EQUITY">Contra-Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
                  Normal Balance
                </label>
                <select
                  value={formNormalBalance}
                  onChange={(e) =>
                    setFormNormalBalance(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>
                <p className="text-xs text-[#A1A1AA]/50 mt-1">
                  The side where increases are recorded.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Cash on hand and in bank"
                className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
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
                className="px-4 py-2 text-[#A1A1AA] bg-[#1E1E1E] rounded-lg hover:bg-[#303030] transition-colors border border-[#303030]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#4A4E69] text-[#A9C4A1] rounded-lg hover:bg-[#5A5E79] transition-colors"
              >
                {editingId ? "Save Changes" : "Add Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#4A4E69]/20 rounded-lg border border-[#4A4E69]/30 p-4">
        <h3 className="text-sm font-semibold text-[#A9C4A1] mb-2">
          How balances work
        </h3>
        <ul className="text-[#A1A1AA] text-sm space-y-1 list-disc pl-5">
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
