"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { Search, Filter, Clock, RotateCcw, FileText } from "lucide-react";

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    accountNo: "",
    startDate: "",
    endDate: "",
    entryType: "",
  });

  useEffect(() => {
    loadEntries();
  }, [
    filters.status,
    filters.accountNo,
    filters.startDate,
    filters.endDate,
    filters.entryType,
  ]);

  async function loadEntries() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.accountNo) params.set("accountNo", filters.accountNo);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.entryType) params.set("entryType", filters.entryType);

      const res = await fetch(`/api/entries?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load journal entries");
      const json = await res.json();
      setEntries(json.entries || []);
    } catch (err: any) {
      setError(err.message || "Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    POSTED: "Posted",
  };

  const TYPE_LABELS: Record<string, string> = {
    REGULAR: "Regular",
    REVERSAL: "Reversal",
    ADJUSTING: "Adjusting",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            General Journal
          </h1>
          <p className="text-slate-600 mt-1">
            All journal entries in chronological order.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">
              Account
            </label>
            <input
              type="text"
              value={filters.accountNo}
              placeholder="e.g. 101"
              onChange={(e) =>
                setFilters({ ...filters, accountNo: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">
              From date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">
              To date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Ref No.</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Lines</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading entries...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No journal entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const lineCount = entry.lines?.length || 0;
                  const statusColor =
                    entry.status === "POSTED"
                      ? "text-emerald-600"
                      : "text-amber-600";
                  const typeColor =
                    entry.entryType === "REVERSAL"
                      ? "text-purple-600"
                      : "text-slate-600";
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {entry.referenceNo || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-800 truncate max-w-xs">
                        {entry.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                          entry.entryType === "REVERSAL"
                            ? "bg-purple-100 text-purple-700 border-purple-100"
                            : entry.entryType === "ADJUSTING"
                            ? "bg-blue-100 text-blue-700 border-blue-100"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                        >
                          {TYPE_LABELS[entry.entryType] || entry.entryType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${statusColor}`}>
                          {STATUS_LABELS[entry.status] || entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {lineCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1">
                          <a
                            href={`/journal/${entry.id}`}
                            className="text-slate-600 hover:text-blue-600 p-1.5"
                            title="View details"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                          {entry.status === "POSTED" && !entry.reversedFromId && (
                            <a
                              href={`/journal/${entry.id}/reverse`}
                              className="text-slate-600 hover:text-red-600 p-1.5"
                              title="Reverse entry"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
