"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers";
import { Calculator, AlertCircle, CheckCircle, Save, Info, Clipboard, Monitor, DollarSign, FileText, CreditCard } from "lucide-react";

const ADJUSTMENTS = [
  { id: "officeSupplies", title: "A. Office Supplies Used", description: "Record office supplies consumed during the period.", icon: "Clipboard" },
  { id: "depreciation", title: "B. Depreciation on Office Equipment", description: "Record monthly depreciation expense for office equipment.", icon: "Monitor" },
  { id: "unearnedRevenue", title: "C. Unearned Computer Service Revenue", description: "Recognize revenue from advance payments.", icon: "DollarSign" },
  { id: "accruedRevenue", title: "D. Accrued Computer Service Revenue", description: "Record revenue earned but not yet collected.", icon: "FileText" },
  { id: "paidSalaries", title: "E. Paid Salaries", description: "Record salary payments (expense or liability settlement).", icon: "CreditCard" },
  { id: "servicesCash", title: "F. Computer Services Rendered for Cash", description: "Record cash received for services provided.", icon: "Monitor" },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Clipboard,
  Monitor,
  DollarSign,
  FileText,
  CreditCard,
};

function AdjustmentIcon({ iconName }: { iconName: string }) {
  const Icon = ICON_MAP[iconName];
  return <Icon className="text-[#A9C4A1]" />;
}

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
          <h1 className="text-2xl font-bold text-[#F3F4F6]">
            Adjusting Entries Practice
          </h1>
          <p className="text-[#A1A1AA] mt-1">
            Practice journalizing the required adjustments for AAA Computer
            Services. Select an adjustment below to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADJUSTMENTS.map((adj) => (
            <div
              key={adj.id}
              className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-5 hover:bg-[#303030]/30 transition-colors cursor-pointer group"
              onClick={() => startAdjustment(adj.id)}
            >
              <div className="text-2xl mb-3">
                <AdjustmentIcon iconName={adj.icon} />
              </div>
              <h3 className="text-lg font-bold text-[#F3F4F6] mb-2">
                {adj.title}
              </h3>
              <p className="text-[#A1A1AA] text-sm">{adj.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const adj = ADJUSTMENTS.find((a) => a.id === activeAdjustment);

  if (!adj) {
    return <div className="text-[#F3F4F6]">Adjustment not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => setActiveAdjustment(null)}
            className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#A9C4A1] mb-4"
          >
            ← Back to adjustments
          </button>
          <h1 className="text-2xl font-bold text-[#F3F4F6]">{adj.title}</h1>
          <p className="text-[#A1A1AA] mt-1">{adj.description}</p>
        </div>
      </div>

      <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6 max-w-3xl">
        <div className="space-y-6">
          {activeAdjustment === "officeSupplies" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Office Supplies Used (₱)
                </label>
                <div className="input-group flex items-center">
                  <span className="px-3 py-2 bg-[#141414] border-r-0 border-[#303030] rounded-l-lg text-[#A1A1AA]">
                    ₱
                  </span>
                  <input
                    type="text"
                    value={aAmount}
                    onChange={(e) => setAAmount(onlyDigitsAndDots(e.target.value))}
                    placeholder="500"
                    className="flex-1 px-3 py-2 border border-[#303030] rounded-r-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                  />
                </div>
                <p className="text-xs text-[#A1A1AA]/50 mt-1">
                  Enter the amount of office supplies consumed during the period.
                </p>
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("officeSupplies")}
                disabled={!aAmount || parseFloat(aAmount) <= 0}
                className="w-full px-4 py-2.5 bg-[#4A4E69] text-[#A9C4A1] font-semibold rounded-lg hover:bg-[#5A5E79] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                    Equipment Cost (₱)
                  </label>
                  <input
                    type="text"
                    value={bCost}
                    onChange={(e) => setBCost(onlyDigitsAndDots(e.target.value))}
                    placeholder="15000"
                    className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                    Salvage Rate (%)
                  </label>
                  <input
                    type="text"
                    value={bSalvageRate}
                    onChange={(e) => setBSalvageRate(onlyDigitsAndDots(e.target.value))}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                    Useful Life (years)
                  </label>
                  <input
                    type="text"
                    value={bUsefulLife}
                    onChange={(e) => setBUsefulLife(onlyDigits(e.target.value))}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                    Accum. Depreciation (₱)
                  </label>
                  <input
                    type="text"
                    value={bAccumulated}
                    onChange={(e) => setBAccumulated(onlyDigitsAndDots(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                  />
                  <p className="text-xs text-[#A1A1AA]/50 mt-1">
                    Prior depreciation already recorded (if any).
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("depreciation")}
                disabled={!bCost || parseFloat(bCost) <= 0}
                className="w-full px-4 py-2.5 bg-[#4A4E69] text-[#A9C4A1] font-semibold rounded-lg hover:bg-[#5A5E79] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Depreciation
              </button>
            </div>
          )}
          {activeAdjustment === "unearnedRevenue" && (
            <div className="space-y-4">
              <div className="bg-[#141414] rounded-lg p-4 border border-[#303030]">
                <p className="text-[#A1A1AA] text-sm mb-3">
                  Choose how you want to handle the unearned revenue:
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#4A4E69]/10 border-transparent hover:border-[#4A4E69]/30">
                    <input
                      type="radio"
                      name="cOption"
                      value="earned"
                      checked={cOption === "earned"}
                      onChange={() => setCOption("earned")}
                      className="w-4 h-4 text-[#A9C4A1]"
                    />
                    <div>
                      <span className="font-medium text-[#F3F4F6]">
                        ₱1,000 has been earned
                      </span>
                      <p className="text-xs text-[#A1A1AA]/50 mt-1">
                        Record the earned portion as revenue. Debit Unearned
                        Revenue, Credit Computer Service Revenue.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#4A4E69]/10 border-transparent hover:border-[#4A4E69]/30">
                    <input
                      type="radio"
                      name="cOption"
                      value="endingBalance"
                      checked={cOption === "endingBalance"}
                      onChange={() => setCOption("endingBalance")}
                      className="w-4 h-4 text-[#A9C4A1]"
                    />
                    <div>
                      <span className="font-medium text-[#F3F4F6]">
                        Ending unearned balance is a specific amount
                      </span>
                      <p className="text-xs text-[#A1A1AA]/50 mt-1">
                        Calculate the adjustment needed to reach a target ending
                        balance.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {cOption === "earned" && (
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                    Amount Earned (₱)
                  </label>
                  <input
                    type="text"
                    value={cEarnedAmount}
                    onChange={(e) => setCEarnedAmount(onlyDigitsAndDots(e.target.value))}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                  />
                </div>
              )}

              {cOption === "endingBalance" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                      Existing Unearned Balance (₱)
                    </label>
                    <input
                      type="text"
                      value={cExistingBalance}
                      onChange={(e) => setCExistingBalance(onlyDigitsAndDots(e.target.value))}
                      placeholder="2000"
                      className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                      Target Ending Balance (₱)
                    </label>
                    <input
                      type="text"
                      value={cTargetEnding}
                      onChange={(e) => setCTargetEnding(onlyDigitsAndDots(e.target.value))}
                      placeholder="1000"
                      className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("unearnedRevenue")}
                className="w-full px-4 py-2.5 bg-[#4A4E69] text-[#A9C4A1] font-semibold rounded-lg hover:bg-[#5A5E79] transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}
          {activeAdjustment === "accruedRevenue" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Accrued Revenue Amount (₱)
                </label>
                <input
                  type="text"
                  value={dAmount}
                  onChange={(e) => setDAmount(onlyDigitsAndDots(e.target.value))}
                  placeholder="7500"
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("accruedRevenue")}
                disabled={!dAmount || parseFloat(dAmount) <= 0}
                className="w-full px-4 py-2.5 bg-[#4A4E69] text-[#A9C4A1] font-semibold rounded-lg hover:bg-[#5A5E79] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}
          {activeAdjustment === "paidSalaries" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Salary Amount (₱)
                </label>
                <input
                  type="text"
                  value={eAmount}
                  onChange={(e) => setEAmount(onlyDigitsAndDots(e.target.value))}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Payment Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="p-3 border rounded-lg cursor-pointer hover:bg-[#4A4E69]/10 border-transparent hover:border-[#4A4E69]/30 flex items-center gap-2">
                    <input
                      type="radio"
                      name="eSalaryType"
                      value="expense"
                      checked={eSalaryType === "expense"}
                      onChange={() => setESalaryType("expense")}
                      className="w-4 h-4 text-[#A9C4A1]"
                    />
                    <span className="text-sm text-[#F3F4F6]">
                      Expense (paid immediately)
                    </span>
                  </label>
                  <label className="p-3 border rounded-lg cursor-pointer hover:bg-[#4A4E69]/10 border-transparent hover:border-[#4A4E69]/30 flex items-center gap-2">
                    <input
                      type="radio"
                      name="eSalaryType"
                      value="payable"
                      checked={eSalaryType === "payable"}
                      onChange={() => setESalaryType("payable")}
                      className="w-4 h-4 text-[#A9C4A1]"
                    />
                    <span className="text-sm text-[#F3F4F6]">
                      Payable (settling liability)
                    </span>
                  </label>
                </div>
                <p className="text-xs text-[#A1A1AA]/50 mt-1">
                  Expense: salary earned and paid now. Payable: paying a
                  previously accrued salary liability.
                </p>
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("paidSalaries")}
                disabled={!eAmount || parseFloat(eAmount) <= 0}
                className="w-full px-4 py-2.5 bg-[#4A4E69] text-[#A9C4A1] font-semibold rounded-lg hover:bg-[#5A5E79] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}
          {activeAdjustment === "servicesCash" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Cash Received for Services (₱)
                </label>
                <input
                  type="text"
                  value={fAmount}
                  onChange={(e) => setFAmount(onlyDigitsAndDots(e.target.value))}
                  placeholder="25000"
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none text-right font-mono bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <div className="flex gap-2">
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] outline-none bg-[#111111] text-[#F3F4F6]"
                />
              </div>
              <button
                onClick={() => calculateAdjustment("servicesCash")}
                disabled={!fAmount || parseFloat(fAmount) <= 0}
                className="w-full px-4 py-2.5 bg-[#4A4E69] text-[#A9C4A1] font-semibold rounded-lg hover:bg-[#5A5E79] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {calcError && (
        <div className="p-4 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {calcError}
        </div>
      )}

      {calcResult && (
        <div className="bg-[#1E1E1E] rounded-lg border border-[#303030] p-6 max-w-3xl">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-[#F3F4F6]">
              Calculated Entry
            </h2>
            <span className="text-xs font-mono text-[#A1A1AA]/50 bg-[#141414] px-2 py-1 rounded border border-[#303030]">
              Balanced: {calcResult.balanced ? "Yes" : "No"}
            </span>
          </div>

          {calcResult.explanation && (
            <div className="bg-[#4A4E69]/20 rounded-lg border border-[#4A4E69]/30 p-4 mb-6">
              <h3 className="text-sm font-semibold text-[#A9C4A1] mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Why this entry?
              </h3>
              <p className="text-[#A1A1AA] text-sm">{calcResult.explanation}</p>
            </div>
          )}

          {calcResult.calculation && (
            <div className="bg-[#141414] rounded-lg border border-[#303030] p-4 mb-6">
              <h3 className="text-sm font-semibold text-[#F3F4F6] mb-3">
                Calculation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries(calcResult.calculation as Record<string, string>).map(
                  ([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-[#A1A1AA]/50">{key}</span>
                      <span className="font-mono text-[#F3F4F6]">{value}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {calcResult.warning && (
            <div className="p-4 rounded-lg border border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24] text-sm mb-6">
              <p className="font-semibold mb-1">Review needed:</p>
              <p>{calcResult.explanation}</p>
            </div>
          )}

          {calcResult.entry && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#F3F4F6] mb-2">
                Journal Entry Preview
              </h3>
              <table className="w-full text-sm border border-[#303030]">
                <thead className="bg-[#141414]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-[#A1A1AA]/50">
                      Account No.
                    </th>
                    <th className="px-4 py-2 text-left text-xs text-[#A1A1AA]/50">
                      Account Name
                    </th>
                    <th className="px-4 py-2 text-right text-xs text-[#A1A1AA]/50">
                      Debit (₱)
                    </th>
                    <th className="px-4 py-2 text-right text-xs text-[#A1A1AA]/50">
                      Credit (₱)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#303030]">
                  {calcResult.entry.lines.map((l: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono text-[#A1A1AA]">
                        {l.accountNo}
                      </td>
                      <td className="px-4 py-2 text-[#F3F4F6]">
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
                  <tr className="bg-[#141414] font-bold">
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
              <div className="p-4 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399] text-sm">
                No adjustment needed. The existing balance already equals the target ending balance.
              </div>
            )}

          {calcResult.entry && (
            <div className="pt-6">
              <button
                onClick={() => postAdjustment(calcResult)}
                disabled={posting}
                className="w-full px-4 py-3 bg-[#10B981] text-[#064E3B] font-bold rounded-lg hover:bg-[#34D399] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {posting ? "Posting..." : "Post This Adjusting Entry"}
              </button>
            </div>
          )}
        </div>
      )}

      {postSuccess && (
        <div className="p-4 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399] text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          {postSuccess}
        </div>
      )}

      {postError && (
        <div className="p-4 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm">
          {postError}
        </div>
      )}
    </div>
  );
}
