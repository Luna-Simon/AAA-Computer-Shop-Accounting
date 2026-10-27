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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-3 text-slate-600">Loading entry...</p>
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

  const totalDebits = entry.lines.reduce((sum: number, l: any) => sum + parseFloat(l.debit), 0);
  const totalCredits = entry.lines.reduce((sum: number, l: any) => sum + parseFloat(l.credit), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Journal Entry Details</h1>
          <p className="text-slate-600 mt-1">Reference: {entry.referenceNo}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/journal"
            className="px-4 py-2 text-slate-600 hover:text-blue-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            Back to Journal
          </a>
          {entry.status === "POSTED" && !entry.reversedFromId && (
            <a
              href={`/journal/${entry.id}/reverse`}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reverse Entry
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Entry Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-mono text-slate-800">
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reference No.</span>
              <span className="font-mono text-slate-800 font-medium">{entry.referenceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Description</span>
              <span className="text-slate-800">{entry.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-medium ${entry.status === "POSTED" ? "text-emerald-600" : "text-amber-600"}`}>
                {entry.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="text-slate-800">{entry.entryType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Debits</span>
              <span className="font-mono text-slate-800 font-medium">₱{totalDebits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Credits</span>
              <span className="font-mono text-slate-800 font-medium">₱{totalCredits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Balanced</span>
              <span className="text-emerald-600 font-medium">Yes ✓</span>
            </div>
            {entry.reversals && entry.reversals.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-500">Reversals</span>
                <div className="mt-1 text-sm text-slate-700">
                  {entry.reversals.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="font-mono text-slate-600">{r.referenceNo}</span>
                      <span className="text-slate-500 text-xs">({new Date(r.date).toLocaleDateString()})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Journal Lines</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Account No.</th>
                <th className="px-4 py-3 text-left">Account Name</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entry.lines.map((line: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-700">{line.account.accountNo}</td>
                  <td className="px-4 py-3 text-slate-800">{line.account.name}</td>
                  <td className="px-4 py-3 text-right font-mono">{parseFloat(line.debit) > 0 ? line.debit : "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{parseFloat(line.credit) > 0 ? line.credit : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right font-bold text-slate-700">
                  Totals:
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₱{totalDebits.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₱{totalCredits.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
