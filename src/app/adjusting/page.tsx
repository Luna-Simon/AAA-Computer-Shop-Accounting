"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers";
import { Calculator, AlertCircle, CheckCircle, Save, Info } from "lucide-react";

const ADJUSTMENTS = [
  { id: "officeSupplies", title: "A. Office Supplies Used", description: "Record office supplies consumed during the period.", icon: "📋" },
  { id: "depreciation", title: "B. Depreciation on Office Equipment", description: "Record monthly depreciation expense for office equipment.", icon: "💻" },
  { id: "unearnedRevenue", title: "C. Unearned Computer Service Revenue", description: "Recognize revenue from advance payments.", icon: "💰" },
  { id: "accruedRevenue", title: "D. Accrued Computer Service Revenue", description: "Record revenue earned but not yet collected.", icon: "📄" },
  { id: "paidSalaries", title: "E. Paid Salaries", description: "Record salary payments (expense or liability settlement).", icon: "💵" },
  { id: "servicesCash", title: "F. Computer Services Rendered for Cash", description: "Record cash received for services provided.", icon: "🖥️" },
];

function onlyDigitsAndDots(value: string): string {
  return value.replace(/[^0-9.]/g, "");
}

function onlyDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export default function AdjustingEntriesPage() {
  const { user } = useAuth();
  const [activeAdjustment, setActiveAdjustment] = useState<string | null>(null);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [formDate, setFormDate] = useState("");

  const [aAmount, setAAmount] = useState("500");
  const [bCost, setBCost] = useState("15000");
  const [bSalvageRate, setBSalvageRate] = useState("5");
  const [bUsefulLife, setBUsefulLife] = useState("5");
  const [bAccumulated, setBAccumulated] = useState("0");
  const [cOption, setCOption] = useState("earned");
  const [cExistingBalance, setCExistingBalance] = useState("");
  const [cEarnedAmount, setCEarnedAmount] = useState("1000");
  const [cTargetEnding, setCTargetEnding] = useState("1000");
  const [dAmount, setDAmount] = useState("7500");
  const [eAmount, setEAmount] = useState("");
  const [eSalaryType, setESalaryType] = useState("expense");
  const [fAmount, setFAmount] = useState("25000");

  useEffect(() => {
    setFormDate(new Date().toISOString().split("T")[0]);
  }, []);

  function startAdjustment(id: string) {
    setActiveAdjustment(id);
    setCalcResult(null);
    setCalcError(null);
    setPostSuccess(null);
    setPostError(null);
  }

  async function calculateAdjustment(type: string) {
    setCalcError(null);
    setPostSuccess(null);
    setPostError(null);

    try {
      const res = await fetch("/api/adjusting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          date: formDate,
          amount: aAmount,
          cost: bCost,
          salvageRate: bSalvageRate,
          usefulLifeYears: bUsefulLife,
          accumulatedDepreciation: bAccumulated,
          option: cOption,
          existingBalance: cExistingBalance,
          earnedAmount: cEarnedAmount,
          targetEndingBalance: cTargetEnding,
          dAmount: dAmount,
          eAmount: eAmount,
          salaryType: eSalaryType,
          fAmount: fAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setCalcError(json.error || "Calculation failed");
        return;
      }
      setCalcResult(json);
    } catch (err: any) {
      setCalcError(err.message || "Calculation failed");
    }
  }

  async function postAdjustment(calc: any) {
    if (!calc.entry) {
      setPostError("Nothing to post. Please review your inputs.");
      return;
    }

    setPosting(true);
    setPostError(null);
    setPostSuccess(null);

    try {
      const createRes = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: calc.entry.date,
          description: calc.entry.description,
          lines: calc.entry.lines.map((l: any) => ({
            accountNo: l.accountNo,
            debit: parseFloat(l.debit),
            credit: parseFloat(l.credit),
            description: l.description,
          })),
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok) {
        setPostError(createJson.error || "Failed to create entry");
        return;
      }

      const entryId = createJson.entry.id;

      const postRes = await fetch(`/api/entries/${entryId}/post`, {
        method: "POST",
        credentials: "include",
      });
      const postJson = await postRes.json();
      if (!postRes.ok) {
        setPostError(postJson.error || "Failed to post entry");
        return;
      }

      setPostSuccess(
        `Adjustment posted successfully! Reference: ${postJson.entry.referenceNo}`
      );
      setCalcResult(null);
    } catch (err: any) {
      setPostError(err.message || "Post failed");
    } finally {
      setPosting(false);
    }
  }

  if (!activeAdjustment) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Adjusting Entries Practice
          </h1>
          <p className="text-slate-600 mt-1">
            Practice journalizing the required adjustments for AAA Computer
            Services. Select an adjustment below to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADJUSTMENTS.map((adj) => (
            <div
              key={adj.id}
              className="bg-white rounded-lg border border-slate-200 p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
              onClick={() => startAdjustment(adj.id)}
            >
              <div className="text-2xl mb-3">{adj.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {adj.title}
              </h3>
              <p className="text-sm text-slate-600">{adj.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const adj = ADJUSTMENTS.find((a) => a.id === activeAdjustment);

  if (!adj) {
    return <div>Adjustment not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => setActiveAdjustment(null)}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            ← Back to adjustments
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{adj.title}</h1>
          <p className="text-slate-600 mt-1">{adj.description}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-3xl">
        <div className="space-y-6">
          {activeAdjustment === "officeSupplies" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Office Supplies Used (₱)
                </label>
                <div className="input-group flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border-r-0 border-slate-300 rounded-l-lg text-slate-700">
                    ₱
                  </span>
                  <input
                    type="text"
                    value={aAmount}
                    onChange={(e) => setAAmount(onlyDigitsAndDots(e.target.value))}
                    placeholder="500"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the amount of office supplies consumed during the period.
                </p>
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("officeSupplies")}
                disabled={!aAmount || parseFloat(aAmount) <= 0}
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}

          {activeAdjustment === "depreciation" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Equipment Cost (₱)
                  </label>
                  <input
                    type="text"
                    value={bCost}
                    onChange={(e) => setBCost(onlyDigitsAndDots(e.target.value))}
                    placeholder="15000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Salvage Rate (%)
                  </label>
                  <input
                    type="text"
                    value={bSalvageRate}
                    onChange={(e) => setBSalvageRate(onlyDigitsAndDots(e.target.value))}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Useful Life (years)
                  </label>
                  <input
                    type="text"
                    value={bUsefulLife}
                    onChange={(e) => setBUsefulLife(onlyDigits(e.target.value))}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Accum. Depreciation (₱)
                  </label>
                  <input
                    type="text"
                    value={bAccumulated}
                    onChange={(e) => setBAccumulated(onlyDigitsAndDots(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Prior depreciation already recorded (if any).
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("depreciation")}
                disabled={!bCost || parseFloat(bCost) <= 0}
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Depreciation
              </button>
            </div>
          )}

          {activeAdjustment === "unearnedRevenue" && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-3">
                  Choose how you want to handle the unearned revenue:
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 border-transparent hover:border-blue-100">
                    <input
                      type="radio"
                      name="cOption"
                      value="earned"
                      checked={cOption === "earned"}
                      onChange={() => setCOption("earned")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="font-medium text-slate-900">
                        ₱1,000 has been earned
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        Record the earned portion as revenue. Debit Unearned
                        Revenue, Credit Computer Service Revenue.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 border-transparent hover:border-blue-100">
                    <input
                      type="radio"
                      name="cOption"
                      value="endingBalance"
                      checked={cOption === "endingBalance"}
                      onChange={() => setCOption("endingBalance")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="font-medium text-slate-900">
                        Ending unearned balance is a specific amount
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        Calculate the adjustment needed to reach a target ending
                        balance.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {cOption === "earned" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount Earned (₱)
                  </label>
                  <input
                    type="text"
                    value={cEarnedAmount}
                    onChange={(e) => setCEarnedAmount(onlyDigitsAndDots(e.target.value))}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                  />
                </div>
              )}

              {cOption === "endingBalance" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Existing Unearned Balance (₱)
                    </label>
                    <input
                      type="text"
                      value={cExistingBalance}
                      onChange={(e) => setCExistingBalance(onlyDigitsAndDots(e.target.value))}
                      placeholder="2000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Target Ending Balance (₱)
                    </label>
                    <input
                      type="text"
                      value={cTargetEnding}
                      onChange={(e) => setCTargetEnding(onlyDigitsAndDots(e.target.value))}
                      placeholder="1000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("unearnedRevenue")}
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}

          {activeAdjustment === "accruedRevenue" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Accrued Revenue Amount (₱)
                </label>
                <input
                  type="text"
                  value={dAmount}
                  onChange={(e) => setDAmount(onlyDigitsAndDots(e.target.value))}
                  placeholder="7500"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                />
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("accruedRevenue")}
                disabled={!dAmount || parseFloat(dAmount) <= 0}
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}

          {activeAdjustment === "paidSalaries" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Salary Amount (₱)
                </label>
                <input
                  type="text"
                  value={eAmount}
                  onChange={(e) => setEAmount(onlyDigitsAndDots(e.target.value))}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 border-transparent hover:border-blue-100 flex items-center gap-2">
                    <input
                      type="radio"
                      name="eSalaryType"
                      value="expense"
                      checked={eSalaryType === "expense"}
                      onChange={() => setESalaryType("expense")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">
                      Expense (paid immediately)
                    </span>
                  </label>
                  <label className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 border-transparent hover:border-blue-100 flex items-center gap-2">
                    <input
                      type="radio"
                      name="eSalaryType"
                      value="payable"
                      checked={eSalaryType === "payable"}
                      onChange={() => setESalaryType("payable")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">
                      Payable (settling liability)
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Expense: salary earned and paid now. Payable: paying a
                  previously accrued salary liability.
                </p>
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("paidSalaries")}
                disabled={!eAmount || parseFloat(eAmount) <= 0}
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}

          {activeAdjustment === "servicesCash" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cash Received for Services (₱)
                </label>
                <input
                  type="text"
                  value={fAmount}
                  onChange={(e) => setFAmount(onlyDigitsAndDots(e.target.value))}
                  placeholder="25000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                />
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("servicesCash")}
                disabled={!fAmount || parseFloat(fAmount) <= 0}
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {calcError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {calcError}
        </div>
      )}

      {calcResult && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-3xl">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Calculated Entry
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Balanced: {calcResult.balanced ? "Yes" : "No"}
            </span>
          </div>

          {calcResult.explanation && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Why this entry?
              </h3>
              <p className="text-sm text-blue-800">{calcResult.explanation}</p>
            </div>
          )}

          {calcResult.calculation && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Calculation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries(calcResult.calculation as Record<string, string>).map(
                  ([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-500">{key}</span>
                      <span className="font-mono text-slate-800">{value}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {calcResult.warning && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
              <p className="font-semibold mb-1">Review needed:</p>
              <p>{calcResult.explanation}</p>
            </div>
          )}

          {calcResult.entry && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Journal Entry Preview
              </h3>
              <table className="w-full text-sm border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-slate-500">
                      Account No.
                    </th>
                    <th className="px-4 py-2 text-left text-xs text-slate-500">
                      Account Name
                    </th>
                    <th className="px-4 py-2 text-right text-xs text-slate-500">
                      Debit (₱)
                    </th>
                    <th className="px-4 py-2 text-right text-xs text-slate-500">
                      Credit (₱)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calcResult.entry.lines.map((l: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono text-slate-700">
                        {l.accountNo}
                      </td>
                      <td className="px-4 py-2 text-slate-800">
                        {l.accountNo === "101"
                          ? "Cash"
                          : l.accountNo === "102"
                          ? "Accounts Receivable"
                          : l.accountNo === "103"
                          ? "Office Supplies"
                          : l.accountNo === "104"
                          ? "Office Equipment"
                          : l.accountNo === "105"
                          ? "Accumulated Depreciation - Equipment"
                          : l.accountNo === "203"
                          ? "Unearned Computer Services Revenue"
                          : l.accountNo === "204"
                          ? "Salaries Payable"
                          : l.accountNo === "302"
                          ? "A, Drawing"
                          : l.accountNo === "401"
                          ? "Computer Service Revenue"
                          : l.accountNo === "501"
                          ? "Salaries Expense"
                          : l.accountNo === "502"
                          ? "Advertising Expense"
                          : l.accountNo === "503"
                          ? "Office Supplies Expense"
                          : l.accountNo === "504"
                          ? "Depreciation Expense - Equipment"
                          : l.accountNo}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {l.debit !== "0.00" ? l.debit : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {l.credit !== "0.00" ? l.credit : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="px-4 py-2 text-right">
                      Totals:
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      ₱{calcResult.totalDebits}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      ₱{calcResult.totalCredits}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {!calcResult.entry &&
            calcResult.option === "endingBalance" &&
            calcResult.adjustmentNeeded === "0.00" && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                No adjustment needed. The existing balance already equals the target ending balance.
              </div>
            )}

          {calcResult.entry && (
            <div className="pt-6">
              <button
                onClick={() => postAdjustment(calcResult)}
                disabled={posting}
                className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {posting ? "Posting..." : "Post This Adjusting Entry"}
              </button>
            </div>
          )}
        </div>
      )}

      {postSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          {postSuccess}
        </div>
      )}

      {postError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {postError}
        </div>
      )}
    </div>
  );
}
