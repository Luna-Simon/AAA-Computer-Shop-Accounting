"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { FileText, RotateCcw } from "lucide-react";

export default function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A9C4A1]"></div>
        <p className="mt-3 text-[#A1A1AA]">Loading entry...</p>
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

  const totalDebits = entry.lines.reduce((sum: number, l: any) => sum + parseFloat(l.debit), 0);
  const totalCredits = entry.lines.reduce((sum: number, l: any) => sum + parseFloat(l.credit), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#F3F4F6]">Journal Entry Details</h1>
          <p className="text-[#A1A1AA] mt-1">Reference: {entry.referenceNo}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/journal"
            className="px-4 py-2 text-[#A1A1AA] hover:text-[#A9C4A1] border border-[#303030] rounded-lg hover:bg-[#303030] transition-colors text-sm"
          >
            Back to Journal
          </a>
          {entry.status === "POSTED" && !entry.reversedFromId && (
            <a
              href={`/journal/${entry.id}/reverse`}
              className="px-4 py-2 bg-[#F87171]/20 text-[#F87171] rounded-lg hover:bg-[#F87171]/40 text-sm transition-colors border border-[#F87171]/30"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reverse Entry
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4">Entry Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Date</span>
              <span className="font-mono text-[#F3F4F6]">
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Reference No.</span>
              <span className="font-mono text-[#F3F4F6] font-medium">{entry.referenceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Description</span>
              <span className="text-[#F3F4F6]">{entry.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Status</span>
              <span className={`font-medium ${entry.status === "POSTED" ? "text-[#34D399]" : "text-[#FBBF24]"}`}>
                {entry.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Type</span>
              <span className="text-[#F3F4F6]">{entry.entryType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Total Debits</span>
              <span className="font-mono text-[#F3F4F6] font-medium">₱{totalDebits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Total Credits</span>
              <span className="font-mono text-[#F3F4F6] font-medium">₱{totalCredits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]/50">Balanced</span>
              <span className="text-[#34D399] font-medium">Yes</span>
            </div>
            {entry.reversals && entry.reversals.length > 0 && (
              <div className="pt-3 border-t border-[#303030]">
                <span className="text-[#A1A1AA]/50">Reversals</span>
                <div className="mt-1 text-sm text-[#A1A1AA]">
                  {entry.reversals.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="font-mono text-[#A1A1AA]">{r.referenceNo}</span>
                      <span className="text-[#A1A1AA]/50 text-xs">({new Date(r.date).toLocaleDateString()})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4">Journal Lines</h3>
          <table className="w-full text-sm">
            <thead className="bg-[#141414] text-[#A1A1AA]/60 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Account No.</th>
                <th className="px-4 py-3 text-left">Account Name</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303030]">
              {entry.lines.map((line: any, idx: number) => (
                <tr key={idx} className="hover:bg-[#303030]/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-[#A1A1AA]">{line.account.accountNo}</td>
                  <td className="px-4 py-3 text-[#F3F4F6]">{line.account.name}</td>
                  <td className="px-4 py-3 text-right font-mono">{parseFloat(line.debit) > 0 ? line.debit : "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{parseFloat(line.credit) > 0 ? line.credit : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#141414]">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right font-bold text-[#A1A1AA]">
                  Totals:
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[#F3F4F6]">₱{totalDebits.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[#F3F4F6]">₱{totalCredits.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
