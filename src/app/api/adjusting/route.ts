import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import Decimal from "decimal.js";
import prisma from "@/lib/prisma";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { type } = body;

    // ------------------------------------------------------------------
    // Adjustment A: Office supplies used
    // ------------------------------------------------------------------
    if (type === "officeSupplies") {
      const { amount } = body;
      if (!amount || parseFloat(amount) <= 0) {
        return NextResponse.json(
          { error: "Please enter a positive amount for office supplies used" },
          { status: 400 }
        );
      }
      const amt = new Decimal(amount);
      return NextResponse.json({
        type: "officeSupplies",
        explanation:
          "Office supplies were consumed during the period. Office Supplies Expense increases (debit) because it is an expense. Office Supplies (asset) decreases (credit) because supplies on hand have been used.",
        entry: {
          date: body.date || new Date().toISOString(),
          description: "Office supplies used during the period",
          lines: [
            { accountNo: "503", debit: amt.toFixed(2), credit: "0.00", description: "Office supplies expense" },
            { accountNo: "103", debit: "0.00", credit: amt.toFixed(2), description: "Office supplies (asset) reduced" },
          ],
          totalDebits: amt.toFixed(2),
          totalCredits: amt.toFixed(2),
          balanced: true,
        },
      });
    }

    // ------------------------------------------------------------------
    // Adjustment B: Depreciation
    // ------------------------------------------------------------------
    if (type === "depreciation") {
      const { cost, salvageRate, usefulLifeYears, date, equipmentId } = body;
      if (!cost || parseFloat(cost) <= 0) {
        return NextResponse.json({ error: "Equipment cost is required" }, { status: 400 });
      }
      const costDec = new Decimal(cost);
      const salvageRateDec = salvageRate ? new Decimal(salvageRate) : new Decimal("0.05");
      const usefulLife = usefulLifeYears ? parseInt(usefulLifeYears, 10) : 5;

      const salvageValue = costDec.mul(salvageRateDec);
      const depreciableAmount = costDec.minus(salvageValue);
      const annualDepreciation = depreciableAmount.div(usefulLife);
      const monthlyDepreciation = annualDepreciation.div(12);

      // Check not depreciating below salvage value
      // For simplicity, assume no prior depreciation unless accumulated provided
      const accumulated = body.accumulatedDepreciation ? new Decimal(body.accumulatedDepreciation) : new Decimal("0");
      const carryingValue = costDec.minus(accumulated);
      if (carryingValue.lessThanOrEqualTo(salvageValue)) {
        return NextResponse.json({
          error: `Asset has already reached or fallen below its salvage value (₱${salvageValue.toFixed(2)}). No further depreciation.`,
        }, { status: 400 });
      }

      const monthlyDep = monthlyDepreciation.greaterThan(carryingValue.minus(salvageValue))
        ? carryingValue.minus(salvageValue)
        : monthlyDepreciation;

      return NextResponse.json({
        type: "depreciation",
        explanation:
          "Office equipment loses value over time. Depreciation Expense increases (debit) because it is an expense. Accumulated Depreciation increases (credit) because it is a contra-asset that reduces the equipment's book value.",
        calculation: {
          cost: costDec.toFixed(2),
          salvageRate: salvageRateDec.mul(100).toFixed(2) + "%",
          salvageValue: salvageValue.toFixed(2),
          depreciableAmount: depreciableAmount.toFixed(2),
          usefulLifeYears: usefulLife,
          annualDepreciation: annualDepreciation.toFixed(2),
          monthlyDepreciation: monthlyDep.toFixed(2),
        },
        entry: {
          date: date || new Date().toISOString(),
          description: "Monthly depreciation expense - equipment",
          lines: [
            { accountNo: "504", debit: monthlyDep.toFixed(2), credit: "0.00", description: "Depreciation expense" },
            { accountNo: "105", debit: "0.00", credit: monthlyDep.toFixed(2), description: "Accumulated depreciation" },
          ],
          totalDebits: monthlyDep.toFixed(2),
          totalCredits: monthlyDep.toFixed(2),
          balanced: true,
        },
      });
    }

    // ------------------------------------------------------------------
    // Adjustment C: Unearned revenue
    // ------------------------------------------------------------------
    if (type === "unearnedRevenue") {
      const { option, existingBalance, earnedAmount, targetEndingBalance, date } = body;

      if (option === "earned") {
        // Option: ₱1,000 has been earned
        if (!earnedAmount || parseFloat(earnedAmount) <= 0) {
          return NextResponse.json({ error: "Enter the earned amount" }, { status: 400 });
        }
        const amt = new Decimal(earnedAmount);
        return NextResponse.json({
          type: "unearnedRevenue",
          option: "earned",
          explanation:
            "Services were provided that were previously paid in advance. Unearned Computer Services Revenue decreases (debit) because the liability is being settled. Computer Service Revenue increases (credit) because revenue is now earned.",
          entry: {
            date: date || new Date().toISOString(),
            description: "Unearned revenue earned during the period",
            lines: [
              { accountNo: "203", debit: amt.toFixed(2), credit: "0.00", description: "Unearned revenue recognized" },
              { accountNo: "401", debit: "0.00", credit: amt.toFixed(2), description: "Service revenue recognized" },
            ],
            totalDebits: amt.toFixed(2),
            totalCredits: amt.toFixed(2),
            balanced: true,
          },
        });
      }

      if (option === "endingBalance") {
        // Option: ending unearned balance is ₱1,000
        if (!existingBalance || parseFloat(existingBalance) < 0) {
          return NextResponse.json({ error: "Enter the existing unearned revenue balance" }, { status: 400 });
        }
        if (!targetEndingBalance || parseFloat(targetEndingBalance) < 0) {
          return NextResponse.json({ error: "Enter the target ending unearned balance" }, { status: 400 });
        }
        const existing = new Decimal(existingBalance);
        const target = new Decimal(targetEndingBalance);

        // Adjustment needed = existing - target (amount to move from unearned to earned)
        // If existing > target, we earned the difference (debit unearned, credit revenue)
        // If existing < target, we need to add more to unearned (debit revenue, credit unearned) - unusual
        // If equal, no adjustment needed
        const diff = existing.minus(target);

        if (diff.isZero()) {
          return NextResponse.json({
            type: "unearnedRevenue",
            option: "endingBalance",
            explanation:
              "The existing unearned revenue balance already equals the target ending balance. No adjustment needed.",
            entry: null,
            adjustmentNeeded: "0.00",
          });
        }

        if (diff.isPositive()) {
          // Earned = existing - target
          const earned = diff;
          return NextResponse.json({
            type: "unearnedRevenue",
            option: "endingBalance",
            explanation:
              "You started with an unearned revenue balance and want a specific ending balance. The difference is the amount of services earned during the period. Unearned Computer Services Revenue decreases (debit). Computer Service Revenue increases (credit).",
            calculation: {
              existingBalance: existing.toFixed(2),
              targetEndingBalance: target.toFixed(2),
              earnedAmount: earned.toFixed(2),
              formula: "Existing balance − Target ending balance = Amount earned",
            },
            entry: {
              date: date || new Date().toISOString(),
              description: "Adjust unearned revenue to target ending balance",
              lines: [
                { accountNo: "203", debit: earned.toFixed(2), credit: "0.00", description: "Unearned revenue reduced" },
                { accountNo: "401", debit: "0.00", credit: earned.toFixed(2), description: "Service revenue recognized" },
              ],
              totalDebits: earned.toFixed(2),
              totalCredits: earned.toFixed(2),
              balanced: true,
            },
          });
        } else {
          // existing < target, need to increase unearned (unusual - means more unearned than before)
          const additional = diff.abs();
          return NextResponse.json({
            type: "unearnedRevenue",
            option: "endingBalance",
            explanation:
              "The target ending balance is higher than the existing balance, which means unearned revenue increased. This is unusual for an adjusting entry. Please review your inputs.",
            warning: true,
            calculation: {
              existingBalance: existing.toFixed(2),
              targetEndingBalance: target.toFixed(2),
              difference: additional.toFixed(2),
            },
            entry: null,
          });
        }
      }

      return NextResponse.json({ error: "Invalid option. Use 'earned' or 'endingBalance'" }, { status: 400 });
    }

    // ------------------------------------------------------------------
    // Adjustment D: Accrued revenue
    // ------------------------------------------------------------------
    if (type === "accruedRevenue") {
      const { amount, date } = body;
      if (!amount || parseFloat(amount) <= 0) {
        return NextResponse.json({ error: "Enter the accrued revenue amount" }, { status: 400 });
      }
      const amt = new Decimal(amount);
      return NextResponse.json({
        type: "accruedRevenue",
        explanation:
          "Services were provided but not yet billed or paid. Accounts Receivable increases (debit) because the customer owes you money. Computer Service Revenue increases (credit) because revenue is earned.",
        entry: {
          date: date || new Date().toISOString(),
          description: "Accrued computer service revenue",
          lines: [
            { accountNo: "102", debit: amt.toFixed(2), credit: "0.00", description: "Accounts receivable (customer owes)" },
            { accountNo: "401", debit: "0.00", credit: amt.toFixed(2), description: "Service revenue earned" },
          ],
          totalDebits: amt.toFixed(2),
          totalCredits: amt.toFixed(2),
          balanced: true,
        },
      });
    }

    // ------------------------------------------------------------------
    // Adjustment E: Paid salaries
    // ------------------------------------------------------------------
    if (type === "paidSalaries") {
      const { amount, date, type: salaryType } = body;
      if (!amount || parseFloat(amount) <= 0) {
        return NextResponse.json({ error: "Enter the salary amount" }, { status: 400 });
      }
      const amt = new Decimal(amount);

      if (salaryType === "expense") {
        // New salary expense paid immediately
        return NextResponse.json({
          type: "paidSalaries",
          salaryType: "expense",
          explanation:
            "Salaries were earned and paid immediately. Salaries Expense increases (debit) because it is an expense. Cash decreases (credit) because cash was paid out.",
          entry: {
            date: date || new Date().toISOString(),
            description: "Salaries paid (expense recognized immediately)",
            lines: [
              { accountNo: "501", debit: amt.toFixed(2), credit: "0.00", description: "Salaries expense" },
              { accountNo: "101", debit: "0.00", credit: amt.toFixed(2), description: "Cash payment" },
            ],
            totalDebits: amt.toFixed(2),
            totalCredits: amt.toFixed(2),
            balanced: true,
          },
        });
      }

      if (salaryType === "payable") {
        // Paying an existing salary liability
        return NextResponse.json({
          type: "paidSalaries",
          salaryType: "payable",
          explanation:
            "Salaries were previously accrued as a liability (Salaries Payable). Now they are being paid. Salaries Payable decreases (debit) because the liability is being settled. Cash decreases (credit) because cash was paid out. No new expense is recognized because it was already recorded when accrued.",
          entry: {
            date: date || new Date().toISOString(),
            description: "Salaries paid (settling existing liability)",
            lines: [
              { accountNo: "204", debit: amt.toFixed(2), credit: "0.00", description: "Salaries payable settled" },
              { accountNo: "101", debit: "0.00", credit: amt.toFixed(2), description: "Cash payment" },
            ],
            totalDebits: amt.toFixed(2),
            totalCredits: amt.toFixed(2),
            balanced: true,
          },
        });
      }

      return NextResponse.json({ error: "Specify salary type: 'expense' or 'payable'" }, { status: 400 });
    }

    // ------------------------------------------------------------------
    // Adjustment F: Computer services rendered for cash
    // ------------------------------------------------------------------
    if (type === "servicesCash") {
      const { amount, date } = body;
      if (!amount || parseFloat(amount) <= 0) {
        return NextResponse.json({ error: "Enter the cash amount received" }, { status: 400 });
      }
      const amt = new Decimal(amount);
      return NextResponse.json({
        type: "servicesCash",
        explanation:
          "Computer services were provided and cash was received immediately. Cash increases (debit) because cash was received. Computer Service Revenue increases (credit) because revenue is earned.",
        entry: {
          date: date || new Date().toISOString(),
          description: "Computer services rendered for cash",
          lines: [
            { accountNo: "101", debit: amt.toFixed(2), credit: "0.00", description: "Cash received" },
            { accountNo: "401", debit: "0.00", credit: amt.toFixed(2), description: "Service revenue earned" },
          ],
          totalDebits: amt.toFixed(2),
          totalCredits: amt.toFixed(2),
          balanced: true,
        },
      });
    }

    return NextResponse.json({ error: "Unknown adjustment type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to calculate adjustment" },
      { status: 500 }
    );
  }
}
