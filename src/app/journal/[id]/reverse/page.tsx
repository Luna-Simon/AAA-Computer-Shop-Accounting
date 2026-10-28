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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A9C4A1]"></div>
        <p className="mt-3 text-[#A1A1AA]">Loading...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-6 bg-[#1E1E1E] rounded-lg border border-[#F87171]/30 text-[#F3F4F6]">
        <h2 className="text-lg font-semibold mb-2">Entry not found</h2>
        <p className="text-[#A1A1AA]">{error}</p>
      </div>
    );
  }

  if (entry.status !== "POSTED") {
    return (
      <div className="p-6 bg-[#1E1E1E] rounded-lg border border-[#FBBF24]/30 text-[#FBBF24]">
        <h2 className="text-lg font-semibold mb-2">Cannot reverse</h2>
        <p className="text-[#A1A1AA]">Only posted entries can be reversed. This entry is a draft.</p>
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
      <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
        <h1 className="text-2xl font-bold text-[#F3F4F6] mb-2">Reverse Journal Entry</h1>
        <p className="text-[#A1A1AA] mb-4">
          Reversing creates a new entry with opposite debits and credits. The
          original entry stays posted for audit purposes.
        </p>

        <div className="bg-[#141414] rounded-lg p-4 border border-[#303030] mb-6">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-3">Original Entry</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Reference:</span>
              <span className="font-mono text-[#F3F4F6]">{entry.referenceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Date:</span>
              <span className="text-[#F3F4F6]">
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Description:</span>
              <span className="text-[#F3F4F6]">{entry.description}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#303030]">
              <span className="text-[#A1A1AA]/50">Total Debits:</span>
              <span className="font-mono text-[#F3F4F6]">₱{totalDebits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Total Credits:</span>
              <span className="font-mono text-[#F3F4F6]">₱{totalCredits.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleReverse} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
              Reversal Date
            </label>
            <input
              type="date"
              value={reversalDate}
              onChange={(e) => setReversalDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
              Description (optional)
            </label>
            <textarea
              value={reversalDescription}
              onChange={(e) => setReversalDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Reversing accrued salaries at month start"
              className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
            />
          </div>

          <div className="bg-[#FBBF24]/20 rounded-lg p-3 border border-[#FBBF24]/30 text-[#FBBF24] text-sm">
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
            className="w-full px-4 py-2.5 bg-[#F87171] text-[#F3F4F6] font-semibold rounded-lg hover:bg-[#FCA5A5] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {submitting ? "Reversing..." : "Create Reversal Entry"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-[#F87171]/30 bg-[#F87171]/10 text-[#F87171] text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}
