"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { RotateCcw, AlertCircle } from "lucide-react";

export default function ReverseEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reversalDate, setReversalDate] = useState("");
  const [reversalDescription, setReversalDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadEntry() {
      const { id } = await params;
      try {
        const res = await fetch(`/api/entries/${id}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Entry not found");
        const json = await res.json();
        if (!cancelled) setEntry(json.entry);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load entry");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadEntry();
    setReversalDate(new Date().toISOString().split("T")[0]);
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-3 text-slate-600">Loading...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200 text-red-700">
        <h2 className="text-lg font-semibold mb-2">Entry not found</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (entry.status !== "POSTED") {
    return (
      <div className="p-6 bg-white rounded-lg border border-amber-200 text-amber-700">
        <h2 className="text-lg font-semibold mb-2">Cannot reverse</h2>
        <p>Only posted entries can be reversed. This entry is a draft.</p>
      </div>
    );
  }

  const totalDebits = entry.lines.reduce((sum: number, l: any) => sum + parseFloat(l.debit), 0);
  const totalCredits = entry.lines.reduce((sum: number, l: any) => sum + parseFloat(l.credit), 0);

  async function handleReverse(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/entries/${entry.id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reversalDate,
          description: reversalDescription || `Reversal of journal entry ${entry.referenceNo}`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to reverse entry");
        return;
      }

      window.location.href = `/journal/${json.reversal.id}`;
    } catch (err: any) {
      setError(err.message || "Failed to reverse entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reverse Journal Entry</h1>
        <p className="text-slate-600 mb-4">
          Reversing creates a new entry with opposite debits and credits. The
          original entry stays posted for audit purposes.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Original Entry</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono text-slate-800">{entry.referenceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="text-slate-800">
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Description:</span>
              <span className="text-slate-800">{entry.description}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Total Debits:</span>
              <span className="font-mono text-slate-800">₱{totalDebits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Credits:</span>
              <span className="font-mono text-slate-800">₱{totalCredits.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleReverse} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reversal Date
            </label>
            <input
              type="date"
              value={reversalDate}
              onChange={(e) => setReversalDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={reversalDescription}
              onChange={(e) => setReversalDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Reversing accrued salaries at month start"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-amber-800 text-sm">
            <p className="font-semibold mb-1">What happens when you reverse:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>A new entry is created with debits and credits swapped.</li>
              <li>The original entry remains posted (audit trail preserved).</li>
              <li>Account balances are updated automatically.</li>
              <li>The reversal links back to the original entry.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {submitting ? "Reversing..." : "Create Reversal Entry"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}
