"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import {
  Plus,
  Trash2,
  Save,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calculator,
  FileText,
} from "lucide-react";

interface JournalLine {
  id: string;
  accountId: string;
  accountNo: string;
  accountName: string;
  debit: string;
  credit: string;
  description: string;
}

interface AccountOption {
  id: string;
  accountNo: string;
  name: string;
  classification: string;
}

export default function TransactionsPage() {
  const { user, mode } = useAuth();
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [lines, setLines] = useState<JournalLine[]>([
    {
      id: "1",
      accountId: "",
      accountNo: "",
      accountName: "",
      debit: "0",
      credit: "0",
      description: "",
    },
  ]);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);

  useEffect(() => {
    loadAccounts();
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  async function loadAccounts() {
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

  function addLine() {
    setLines([
      ...lines,
      {
        id: Date.now().toString(),
        accountId: "",
        accountNo: "",
        accountName: "",
        debit: "0",
        credit: "0",
        description: "",
      },
    ]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) {
      alert("At least one journal line is required.");
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof JournalLine, value: string) {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  }

  function selectAccount(index: number, accountId: string) {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      accountId: acc.id,
      accountNo: acc.accountNo,
      accountName: acc.name,
    };
    setLines(newLines);
  }

  function computeTotals() {
    let totalDebits = 0;
    let totalCredits = 0;
    for (const line of lines) {
      totalDebits += parseFloat(line.debit) || 0;
      totalCredits += parseFloat(line.credit) || 0;
    }
    return {
      totalDebits,
      totalCredits,
      balanced: Math.abs(totalDebits - totalCredits) < 0.005,
    };
  }

  const { totalDebits, totalCredits, balanced } = computeTotals();

  function validateLines(): string | null {
    for (const line of lines) {
      if (!line.accountId) return "Every line must have an account selected.";
      const d = parseFloat(line.debit) || 0;
      const c = parseFloat(line.credit) || 0;
      if (d === 0 && c === 0) return `Line "${line.accountName}" has no amount.`;
      if (d > 0 && c > 0)
        return `Line "${line.accountName}" cannot have both debit and credit.`;
    }
    if (!balanced)
      return `Entry is out of balance: debits ₱${totalDebits.toFixed(2)} ≠ credits ₱${totalCredits.toFixed(2)}.`;
    return null;
  }

  async function handleSave(asDraft: boolean) {
    const validationError = validateLines();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const createRes = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date,
          description,
          referenceNo: referenceNo || undefined,
          lines: lines.map((l) => ({
            accountId: l.accountId,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            description: l.description || undefined,
          })),
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok) {
        setError(createJson.error || "Failed to save entry");
        return;
      }

      const entryId = createJson.entry.id;

      if (!asDraft) {
        const postRes = await fetch(`/api/entries/${entryId}/post`, {
          method: "POST",
          credentials: "include",
        });
        const postJson = await postRes.json();
        if (!postRes.ok) {
          setError(postJson.error || "Failed to post entry");
          return;
        }
        setSuccess(
          `Entry posted successfully! Reference: ${postJson.entry.referenceNo}`
        );
      } else {
        setSuccess("Draft saved successfully. Post it when ready.");
      }

      setLines([
        {
          id: "1",
          accountId: "",
          accountNo: "",
          accountName: "",
          debit: "0",
          credit: "0",
          description: "",
        },
      ]);
      setDescription("");
      setReferenceNo("");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#F3F4F6]">
            {mode === "BEGINNER" ? "New Journal Entry" : "Journal Entry"}
          </h1>
          <p className="text-[#A1A1AA] mt-1">
            Enter a transaction with one or more debit/credit lines.
            {mode === "BEGINNER"
              ? " Every entry must balance (total debits = total credits)."
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-[#4A4E69]/20 text-[#A9C4A1] rounded-lg hover:bg-[#4A4E69]/30 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2 border border-[#4A4E69]/30"
          >
            <Save className="w-4 h-4" /> {isDraft ? "Save Draft" : "Save as Draft"}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !balanced}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              !balanced
                ? "bg-[#303030] text-[#A1A1AA]/50 disabled border border-[#303030]"
                : "bg-[#4A4E69] text-[#A9C4A1] hover:bg-[#5A5E79] border border-transparent"
            }`}
          >
            <Send className="w-4 h-4" />
            {balanced ? "Post Entry" : "Fix Balance First"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399] text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Paid office supplies with cash"
              className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
              Reference No. (optional)
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. INV-001"
              className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#141414] text-[#A1A1AA]/60 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Account</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303030]">
              {lines.map((line, index) => {
                const selectedAccount = accounts.find((a) => a.id === line.accountId);
                return (
                  <tr
                    key={line.id}
                    className="hover:bg-[#303030]/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={line.accountId}
                          onChange={(e) => selectAccount(index, e.target.value)}
                          className="w-full px-2 py-1.5 border border-[#303030] rounded focus:ring-2 focus:ring-[#A9C4A1] outline-none text-sm bg-[#111111] text-[#F3F4F6]"
                        >
                          <option value="">Select account...</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountNo} - {acc.name} ({acc.classification})
                            </option>
                          ))}
                        </select>
                        {!line.accountId && (
                          <span className="text-[10px] text-[#A1A1AA]/50 italic">
                            required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="text"
                        value={line.debit}
                        onChange={(e) => updateLine(index, "debit", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 border border-[#303030] rounded text-right focus:ring-2 focus:ring-[#A9C4A1] outline-none text-sm font-mono bg-[#111111] text-[#F3F4F6]"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="text"
                        value={line.credit}
                        onChange={(e) => updateLine(index, "credit", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 border border-[#303030] rounded text-right focus:ring-2 focus:ring-[#A9C4A1] outline-none text-sm font-mono bg-[#111111] text-[#F3F4F6]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(index, "description", e.target.value)
                        }
                        placeholder="Line description (optional)"
                        className="w-full px-2 py-1.5 border border-[#303030] rounded focus:ring-2 focus:ring-[#A9C4A1] outline-none text-sm bg-[#111111] text-[#F3F4F6]"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeLine(index)}
                        className="text-[#F3F4F6] hover:text-[#F87171] p-1.5"
                        disabled={lines.length <= 1}
                        title={
                          lines.length <= 1
                            ? "At least one line required"
                            : "Remove line"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-[#303030] flex justify-between items-center">
          <button
            onClick={addLine}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#A9C4A1] hover:bg-[#4A4E69]/20 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Line
          </button>
          <div className="text-right">
            <div className="text-xs text-[#A1A1AA]/50">Totals</div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-sm text-[#F3F4F6]">
                Dr: ₱{totalDebits.toFixed(2)}
              </span>
              <span className="font-mono text-sm text-[#F3F4F6]">
                Cr: ₱{totalCredits.toFixed(2)}
              </span>
            </div>
            {!balanced && (
              <p className="text-xs text-[#F87171] mt-1">
                Out of balance by ₱{
                  Math.abs(totalDebits - totalCredits).toFixed(2)
                }
              </p>
            )}
            {balanced && (
              <p className="text-xs text-[#34D399] mt-1">
                Entry is balanced
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#4A4E69]/20 rounded-lg border border-[#4A4E69]/30 p-4">
        <h3 className="text-sm font-semibold text-[#A9C4A1] mb-2 flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Beginner's Guide
        </h3>
        <p className="text-[#A1A1AA] text-sm mb-2">
          A journal entry records a transaction using double-entry bookkeeping.
          Every transaction affects at least two accounts: one is debited, one
          is credited.
        </p>
        <ul className="text-[#A1A1AA] text-sm space-y-1 list-disc pl-5">
          <li>
            <strong className="text-[#F3F4F6]">Debit:</strong> increases assets and expenses; decreases
            liabilities, equity, and revenue.
          </li>
          <li>
            <strong className="text-[#F3F4F6]">Credit:</strong> increases liabilities, equity, and
            revenue; decreases assets and expenses.
          </li>
          <li>
            Total debits must equal total credits before you can post.
          </li>
          <li>
            Save as draft to work on it later. Drafts don't affect your
            financial statements.
          </li>
          <li>
            Post when balanced. Posted entries update the ledger and reports.
          </li>
        </ul>
      </div>
    </div>
  );
}
