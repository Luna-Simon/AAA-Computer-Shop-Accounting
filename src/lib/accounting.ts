import Decimal from "decimal.js";
import prisma from "./prisma";
import { toDecimal, toMoney, parseMoney, isZero, isPositive, isNegative } from "./money";
import { EntryType, JournalStatus } from "@prisma/client";

type DecimalInstance = InstanceType<typeof Decimal>;

export type AccountClassification =
  | "ASSET"
  | "CONTRA_ASSET"
  | "LIABILITY"
  | "OWNERS_EQUITY"
  | "CONTRA_EQUITY"
  | "REVENUE"
  | "EXPENSE";

export type NormalBalance = "DEBIT" | "CREDIT";

// Map classification to normal balance
export function normalBalanceFor(classification: AccountClassification): NormalBalance {
  switch (classification) {
    case "ASSET":
    case "CONTRA_EQUITY":
    case "EXPENSE":
      return "DEBIT";
    case "CONTRA_ASSET":
    case "LIABILITY":
    case "OWNERS_EQUITY":
    case "REVENUE":
      return "CREDIT";
  }
}

/**
 * Compute the net balance (debit - credit) for an account from its posted lines.
 * Returns a Decimal where positive means debit-side net, negative means credit-side net.
 */
export async function computeAccountNetBalance(accountId: string): Promise<DecimalInstance> {
  const lines = await prisma.journalLine.findMany({
    where: {
      accountId,
      journalEntry: { status: "POSTED" },
    },
  });

  let debits = new Decimal(0);
  let credits = new Decimal(0);
  for (const line of lines) {
    debits = debits.plus(toDecimal(line.debit));
    credits = credits.plus(toDecimal(line.credit));
  }

  return debits.minus(credits);
}

/**
 * Get the displayed balance for an account based on its normal balance.
 * Returns { debitBalance, creditBalance } where only one is non-zero.
 */
export async function getAccountBalance(account: {
  id: string;
  classification: AccountClassification;
  normalBalance: NormalBalance;
}) {
  const net = await computeAccountNetBalance(account.id);
  const normal = account.normalBalance || normalBalanceFor(account.classification);

  let debitBalance = new Decimal(0);
  let creditBalance = new Decimal(0);

  if (normal === "DEBIT") {
    // Normal balance is debit: positive net = debit balance, negative = credit balance
    if (isPositive(net)) {
      debitBalance = net;
    } else if (isNegative(net)) {
      creditBalance = net.abs();
    }
  } else {
    // Normal balance is credit: negative net = credit balance, positive = debit balance
    if (isNegative(net)) {
      creditBalance = net.abs();
    } else if (isPositive(net)) {
      debitBalance = net;
    }
  }

  return { net, debitBalance, creditBalance, normal };
}

/**
 * Determine the effective balance sign for reporting.
 * For accounts with a DEBIT normal balance, a positive net is the "natural" balance.
 * For accounts with a CREDIT normal balance, a negative net is the "natural" balance.
 * Returns the balance as a positive number in its natural side.
 */
export async function getNaturalBalance(account: {
  id: string;
  classification: AccountClassification;
  normalBalance: NormalBalance;
}): Promise<{ balance: DecimalInstance; side: "DEBIT" | "CREDIT" }> {
  const net = await computeAccountNetBalance(account.id);
  const normal = account.normalBalance || normalBalanceFor(account.classification);

  if (normal === "DEBIT") {
    // Natural side is debit
    if (isPositive(net) || isZero(net)) {
      return { balance: net.abs(), side: "DEBIT" };
    }
    return { balance: net.abs(), side: "CREDIT" };
  } else {
    // Natural side is credit
    if (isNegative(net) || isZero(net)) {
      return { balance: net.abs(), side: "CREDIT" };
    }
    return { balance: net.abs(), side: "DEBIT" };
  }
}

/**
 * Validate that a journal entry balances (total debits === total credits).
 */
export function validateEntryBalances(lines: { debit: number | string | DecimalInstance; credit: number | string | DecimalInstance }[]): {
  balanced: boolean;
  totalDebits: DecimalInstance;
  totalCredits: DecimalInstance;
  difference: DecimalInstance;
} {
  let totalDebits = new Decimal(0);
  let totalCredits = new Decimal(0);
  for (const line of lines) {
    totalDebits = totalDebits.plus(toDecimal(line.debit));
    totalCredits = totalCredits.plus(toDecimal(line.credit));
  }
  const difference = totalDebits.minus(totalCredits);
  return {
    balanced: isZero(difference),
    totalDebits,
    totalCredits,
    difference,
  };
}

/**
 * Post a draft journal entry. Validates balance, sets status to POSTED,
 * generates a reference number if missing. Runs in a database transaction.
 */
export async function postJournalEntry(entryId: string, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: { include: { account: true } } },
    });

    if (!entry) throw new Error("Journal entry not found");
    if (entry.status === "POSTED") throw new Error("Entry is already posted");

    const lines = entry.lines;
    if (!lines || lines.length === 0) throw new Error("Entry has no lines");

    // Each line must have an account and at least one non-zero amount
    for (const line of lines) {
      if (!line.accountId) throw new Error("Every line must have an account");
      const d = toDecimal(line.debit);
      const c = toDecimal(line.credit);
      if (isZero(d) && isZero(c)) {
        throw new Error(`Line for account ${line.account.accountNo} has no amount`);
      }
      if (isPositive(d) && isPositive(c)) {
        throw new Error(`Line for account ${line.account.accountNo} cannot have both debit and credit`);
      }
    }

    const { balanced, totalDebits, totalCredits, difference } = validateEntryBalances(
      lines.map((l) => ({ debit: l.debit, credit: l.credit }))
    );
    if (!balanced) {
      throw new Error(
        `Entry is out of balance: debits ${toMoney(totalDebits)} != credits ${toMoney(totalCredits)} (diff ${toMoney(difference)})`
      );
    }

    // Generate reference number if missing
    let referenceNo = entry.referenceNo;
    if (!referenceNo) {
      const dateStr = new Date(entry.date).toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.journalEntry.count({ where: { date: entry.date } }) + 1;
      referenceNo = `JE-${dateStr}-${String(count).padStart(3, "0")}`;
      // Ensure uniqueness
      let existing = await tx.journalEntry.findUnique({ where: { referenceNo } });
      let suffix = 1;
      while (existing) {
        referenceNo = `JE-${dateStr}-${String(count).padStart(3, "0")}-${suffix}`;
        existing = await tx.journalEntry.findUnique({ where: { referenceNo } });
        suffix++;
      }
    }

    const updated = await tx.journalEntry.update({
      where: { id: entryId },
      data: {
        status: "POSTED",
        referenceNo,
        updatedAt: new Date(),
        ...(userId ? { createdById: userId } : {}),
      },
      include: { lines: { include: { account: true } } },
    });

    return updated;
  });
}

/**
 * Reverse a posted journal entry by creating a new entry with opposite debits/credits.
 * The original entry remains posted (audit trail preserved).
 */
export async function reverseJournalEntry(
  originalEntryId: string,
  reversalDate: Date,
  description: string,
  userId?: string
) {
  return prisma.$transaction(async (tx) => {
    const original = await tx.journalEntry.findUnique({
      where: { id: originalEntryId },
      include: { lines: { include: { account: true } } },
    });

    if (!original) throw new Error("Original journal entry not found");
    if (original.status !== "POSTED") throw new Error("Only posted entries can be reversed");

    // Check if already reversed
    const existingReversal = await tx.journalEntry.findFirst({
      where: { reversedFromId: originalEntryId, status: "POSTED" },
    });
    if (existingReversal) {
      throw new Error("This entry has already been reversed");
    }

    // Build reversal lines: swap debit and credit
    const reversalLines = original.lines.map((line) => ({
      accountId: line.accountId,
      debit: toDecimal(line.credit),   // original credit becomes reversal debit
      credit: toDecimal(line.debit),   // original debit becomes reversal credit
      description: line.description || `Reversal of ${original.referenceNo}`,
      lineNo: line.lineNo,
    }));

    // Validate reversal balances
    const { balanced } = validateEntryBalances(reversalLines);
    if (!balanced) {
      throw new Error("Reversal entry is out of balance (internal error)");
    }

    const dateStr = reversalDate.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await tx.journalEntry.count({ where: { date: reversalDate } }) + 1;
    let referenceNo = `REV-${dateStr}-${String(count).padStart(3, "0")}`;
    let existing = await tx.journalEntry.findUnique({ where: { referenceNo } });
    let suffix = 1;
    while (existing) {
      referenceNo = `REV-${dateStr}-${String(count).padStart(3, "0")}-${suffix}`;
      existing = await tx.journalEntry.findUnique({ where: { referenceNo } });
      suffix++;
    }

    const reversal = await tx.journalEntry.create({
      data: {
        referenceNo,
        date: reversalDate,
        description: description || `Reversal of journal entry ${original.referenceNo}`,
        status: "POSTED",
        entryType: "REVERSAL",
        reversedFromId: originalEntryId,
        createdById: userId,
        lines: {
          create: reversalLines.map((l, i) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
            lineNo: i,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });

    return reversal;
  });
}

/**
 * Get all accounts with their computed balances.
 */
export async function getAllAccountsWithBalances() {
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { accountNo: "asc" },
    include: {
      lines: {
        where: { journalEntry: { status: "POSTED" } },
        include: { journalEntry: true },
      },
    },
  });

  const result = [];
  for (const acc of accounts) {
    const balance = await getAccountBalance({
      id: acc.id,
      classification: acc.classification as AccountClassification,
      normalBalance: acc.normalBalance as NormalBalance,
    });
    result.push({
      id: acc.id,
      accountNo: acc.accountNo,
      name: acc.name,
      classification: acc.classification,
      normalBalance: acc.normalBalance,
      description: acc.description,
      isActive: acc.isActive,
      ...balance,
    });
  }
  return result;
}

/**
 * Trial Balance: list of accounts with debit and credit balances.
 */
export async function getTrialBalance(asOfDate?: Date) {
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { accountNo: "asc" },
  });

  const rows = [];
  let totalDebits = new Decimal(0);
  let totalCredits = new Decimal(0);

  for (const acc of accounts) {
    // Filter lines by date if asOfDate provided
    const where: any = {
      accountId: acc.id,
      journalEntry: { status: "POSTED" },
    };
    if (asOfDate) {
      where.journalEntry.date = { lte: asOfDate };
    }

    const lines = await prisma.journalLine.findMany({ where });
    let debits = new Decimal(0);
    let credits = new Decimal(0);
    for (const line of lines) {
      debits = debits.plus(toDecimal(line.debit));
      credits = credits.plus(toDecimal(line.credit));
    }

    const normal = acc.normalBalance as NormalBalance;
    let debitBalance = new Decimal(0);
    let creditBalance = new Decimal(0);

    if (normal === "DEBIT") {
      if (debits.greaterThan(credits)) {
        debitBalance = debits.minus(credits);
      } else if (credits.greaterThan(debits)) {
        creditBalance = credits.minus(debits);
      }
    } else {
      if (credits.greaterThan(debits)) {
        creditBalance = credits.minus(debits);
      } else if (debits.greaterThan(credits)) {
        debitBalance = debits.minus(credits);
      }
    }

    totalDebits = totalDebits.plus(debitBalance);
    totalCredits = totalCredits.plus(creditBalance);

    rows.push({
      accountNo: acc.accountNo,
      accountName: acc.name,
      classification: acc.classification,
      debitBalance: toMoney(debitBalance),
      creditBalance: toMoney(creditBalance),
      debitBalanceRaw: debitBalance,
      creditBalanceRaw: creditBalance,
    });
  }

  return {
    rows,
    totalDebits: toMoney(totalDebits),
    totalCredits: toMoney(totalCredits),
    totalDebitsRaw: totalDebits,
    totalCreditsRaw: totalCredits,
    balanced: totalDebits.minus(totalCredits).isZero(),
    asOfDate,
  };
}

/**
 * General Ledger: all posted lines grouped by account with running balance.
 */
export async function getGeneralLedger(accountId?: string, asOfDate?: Date) {
  const where: any = {
    journalEntry: { status: "POSTED" },
  };
  if (accountId) where.accountId = accountId;
  if (asOfDate) where.journalEntry = { ...where.journalEntry, date: { lte: asOfDate } };

  const lines = await prisma.journalLine.findMany({
    where,
    include: { account: true, journalEntry: true },
    orderBy: [
      { account: { accountNo: "asc" } },
      { journalEntry: { date: "asc" } },
      { journalEntry: { createdAt: "asc" } },
      { lineNo: "asc" },
    ],
  });

  // Group by account
  const byAccount = new Map<string, { account: any; entries: any[]; runningBalance: DecimalInstance }>();
  for (const line of lines) {
    if (!byAccount.has(line.accountId)) {
      byAccount.set(line.accountId, {
        account: line.account,
        entries: [],
        runningBalance: new Decimal(0),
      });
    }
    const group = byAccount.get(line.accountId)!;

    const normal = line.account.normalBalance as NormalBalance;
    const debit = toDecimal(line.debit);
    const credit = toDecimal(line.credit);

    // Effect on natural balance
    let effect: DecimalInstance;
    if (normal === "DEBIT") {
      effect = debit.minus(credit); // debit increases, credit decreases
    } else {
      effect = credit.minus(debit); // credit increases, debit decreases
    }

    group.runningBalance = group.runningBalance.plus(effect);

    group.entries.push({
      date: line.journalEntry.date,
      referenceNo: line.journalEntry.referenceNo,
      description: line.description || line.journalEntry.description,
      entryType: line.journalEntry.entryType,
      debit: toMoney(debit),
      credit: toMoney(credit),
      debitRaw: debit,
      creditRaw: credit,
      runningBalance: toMoney(group.runningBalance),
      runningBalanceRaw: group.runningBalance,
      side: isNegative(group.runningBalance) && normal === "DEBIT" ? "CREDIT" :
            isPositive(group.runningBalance) && normal === "CREDIT" ? "DEBIT" : normal,
    });
  }

  const accounts = Array.from(byAccount.values()).map((g) => {
    const last = g.entries[g.entries.length - 1];
    const finalBalanceRaw = last ? last.runningBalanceRaw : new Decimal(0);
    // Determine the side of the final balance
    let finalSide = g.account.normalBalance as "DEBIT" | "CREDIT";
    if (!isZero(finalBalanceRaw)) {
      // If running balance sign differs from normal balance side, it's an abnormal balance
      const normal = g.account.normalBalance as NormalBalance;
      if (normal === "DEBIT") {
        finalSide = isPositive(finalBalanceRaw) ? "DEBIT" : "CREDIT";
      } else {
        finalSide = isNegative(finalBalanceRaw) ? "CREDIT" : "DEBIT";
      }
    }
    return {
      accountNo: g.account.accountNo,
      accountName: g.account.name,
      classification: g.account.classification,
      normalBalance: g.account.normalBalance,
      finalBalance: toMoney(finalBalanceRaw.abs()),
      finalBalanceRaw: finalBalanceRaw,
      finalSide,
      entries: g.entries,
    };
  });

  return { accounts };
}

/**
 * General Journal: all journal entries (draft + posted) with their lines.
 */
export async function getGeneralJournal(filters?: {
  startDate?: Date;
  endDate?: Date;
  accountNo?: string;
  status?: JournalStatus;
  entryType?: EntryType;
}) {
  const where: any = {};
  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }
  if (filters?.status) where.status = filters.status;
  if (filters?.entryType) where.entryType = filters.entryType;

  const entries = await prisma.journalEntry.findMany({
    where,
    include: {
      lines: { include: { account: true }, orderBy: { lineNo: "asc" } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  // Filter by account if specified
  let result = entries;
  if (filters?.accountNo) {
    result = entries.filter((e) =>
      e.lines.some((l) => l.account.accountNo === filters.accountNo)
    );
  }

  return result;
}

/**
 * Dashboard totals computed from posted journal entries.
 */
export async function getDashboardTotals(asOfDate?: Date) {
  const dateFilter: any = {};
  if (asOfDate) dateFilter.lte = asOfDate;

  const entries = await prisma.journalEntry.findMany({
    where: { status: "POSTED", ...(asOfDate ? { date: dateFilter } : {}) },
    include: { lines: { include: { account: true } } },
  });

  // Aggregate by account classification
  const totals: Record<string, { debit: DecimalInstance; credit: DecimalInstance }> = {};

  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!totals[line.account.classification]) {
        totals[line.account.classification] = { debit: new Decimal(0), credit: new Decimal(0) };
      }
      totals[line.account.classification].debit = totals[line.account.classification].debit.plus(toDecimal(line.debit));
      totals[line.account.classification].credit = totals[line.account.classification].credit.plus(toDecimal(line.credit));
    }
  }

  const get = (cls: string) => totals[cls] || { debit: new Decimal(0), credit: new Decimal(0) };

  const asset = get("ASSET");
  const contraAsset = get("CONTRA_ASSET");
  const liability = get("LIABILITY");
  const equity = get("OWNERS_EQUITY");
  const contraEquity = get("CONTRA_EQUITY");
  const revenue = get("REVENUE");
  const expense = get("EXPENSE");

  // Cash balance: find the Cash account specifically
  const cashAccount = await prisma.account.findFirst({ where: { accountNo: "101" } });
  let cashBalance = new Decimal(0);
  if (cashAccount) {
    const bal = await computeAccountNetBalance(cashAccount.id);
    cashBalance = isPositive(bal) ? bal : new Decimal(0);
  }

  // Accounts receivable
  const arAccount = await prisma.account.findFirst({ where: { accountNo: "102" } });
  let arBalance = new Decimal(0);
  if (arAccount) {
    const bal = await computeAccountNetBalance(arAccount.id);
    arBalance = isPositive(bal) ? bal : new Decimal(0);
  }

  // Total assets = assets - contra-assets
  const totalAssets = asset.debit.minus(asset.credit).plus(contraAsset.credit.minus(contraAsset.debit)).abs();
  // Actually: assets natural debit, contra-assets natural credit
  const totalAssetsNatural = asset.debit.minus(asset.credit).minus(contraAsset.credit.minus(contraAsset.debit));
  // Simpler: sum of natural balances for asset accounts
  const totalAssetsCalc = asset.debit.minus(asset.credit).minus(contraAsset.credit.minus(contraAsset.debit));

  // Total liabilities (natural credit)
  const totalLiabilities = liability.credit.minus(liability.debit);

  // Owner's equity = equity - drawings (contra-equity is debit, reduces equity) + net income
  const totalEquity = equity.credit.minus(equity.debit).minus(contraEquity.debit.minus(contraEquity.credit));

  // Total revenue (natural credit)
  const totalRevenue = revenue.credit.minus(revenue.debit);

  // Total expenses (natural debit)
  const totalExpenses = expense.debit.minus(expense.credit);

  const netIncome = totalRevenue.minus(totalExpenses);

  // Verify accounting equation: Assets = Liabilities + Equity
  // Assets should = Liabilities + (Equity + NetIncome - Drawings)
  // Check: Assets - Liabilities - Equity - NetIncome ≈ 0
  const equationCheck = totalAssetsCalc.minus(totalLiabilities).minus(totalEquity).minus(netIncome);

  const draftCount = await prisma.journalEntry.count({ where: { status: "DRAFT" } });
  const postedCount = await prisma.journalEntry.count({ where: { status: "POSTED" } });

  return {
    cashBalance: toMoney(cashBalance),
    cashBalanceRaw: cashBalance,
    accountsReceivable: toMoney(arBalance),
    arBalanceRaw: arBalance,
    totalAssets: toMoney(totalAssetsCalc.greaterThanOrEqualTo(0) ? totalAssetsCalc : new Decimal(0)),
    totalAssetsRaw: totalAssetsCalc,
    totalLiabilities: toMoney(totalLiabilities.greaterThanOrEqualTo(0) ? totalLiabilities : new Decimal(0)),
    totalLiabilitiesRaw: totalLiabilities,
    totalEquity: toMoney(totalEquity.greaterThanOrEqualTo(0) ? totalEquity : new Decimal(0)),
    totalEquityRaw: totalEquity,
    totalRevenue: toMoney(totalRevenue.greaterThanOrEqualTo(0) ? totalRevenue : new Decimal(0)),
    totalRevenueRaw: totalRevenue,
    totalExpenses: toMoney(totalExpenses.greaterThanOrEqualTo(0) ? totalExpenses : new Decimal(0)),
    totalExpensesRaw: totalExpenses,
    netIncome: toMoney(netIncome),
    netIncomeRaw: netIncome,
    netIncomeIsPositive: isPositive(netIncome) || isZero(netIncome),
    equationDifference: toMoney(equationCheck.abs()),
    equationBalanced: equationCheck.abs().lessThan(new Decimal("0.01")),
    draftCount,
    postedCount,
    totalEntries: entries.length,
  };
}

/**
 * Income Statement for a period.
 */
export async function getIncomeStatement(startDate: Date, endDate: Date) {
  const entries = await prisma.journalEntry.findMany({
    where: {
      status: "POSTED",
      date: { gte: startDate, lte: endDate },
    },
    include: { lines: { include: { account: true } } },
  });

  let totalRevenue = new Decimal(0);
  let totalExpenses = new Decimal(0);
  const revenueAccounts: any[] = [];
  const expenseAccounts: any[] = [];

  for (const entry of entries) {
    for (const line of entry.lines) {
      const cls = line.account.classification;
      const debit = toDecimal(line.debit);
      const credit = toDecimal(line.credit);

      if (cls === "REVENUE") {
        const net = credit.minus(debit);
        totalRevenue = totalRevenue.plus(net);
        revenueAccounts.push({
          accountNo: line.account.accountNo,
          accountName: line.account.name,
          amount: toMoney(net),
          amountRaw: net,
        });
      }
      if (cls === "EXPENSE") {
        const net = debit.minus(credit);
        totalExpenses = totalExpenses.plus(net);
        expenseAccounts.push({
          accountNo: line.account.accountNo,
          accountName: line.account.name,
          amount: toMoney(net),
          amountRaw: net,
        });
      }
    }
  }

  const netIncome = totalRevenue.minus(totalExpenses);

  return {
    startDate,
    endDate,
    revenueAccounts,
    expenseAccounts,
    totalRevenue: toMoney(totalRevenue),
    totalRevenueRaw: totalRevenue,
    totalExpenses: toMoney(totalExpenses),
    totalExpensesRaw: totalExpenses,
    netIncome: toMoney(netIncome),
    netIncomeRaw: netIncome,
    isProfit: isPositive(netIncome) || isZero(netIncome),
  };
}

/**
 * Balance Sheet as of a date.
 */
export async function getBalanceSheet(asOfDate: Date) {
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { accountNo: "asc" },
  });

  const assets: any[] = [];
  const contraAssets: any[] = [];
  const liabilities: any[] = [];
  const equities: any[] = [];
  const contraEquities: any[] = [];

  let totalAssets = new Decimal(0);
  let totalLiabilities = new Decimal(0);
  let totalEquity = new Decimal(0);

  for (const acc of accounts) {
    const bal = await getAccountBalance({
      id: acc.id,
      classification: acc.classification as AccountClassification,
      normalBalance: acc.normalBalance as NormalBalance,
    });
    const amount = bal.debitBalance.plus(bal.creditBalance); // absolute balance

    const row = {
      accountNo: acc.accountNo,
      accountName: acc.name,
      classification: acc.classification,
      amount: toMoney(amount),
      amountRaw: amount,
      debitBalance: toMoney(bal.debitBalance),
      creditBalance: toMoney(bal.creditBalance),
    };

    switch (acc.classification) {
      case "ASSET":
        assets.push(row);
        totalAssets = totalAssets.plus(bal.debitBalance).minus(bal.creditBalance);
        break;
      case "CONTRA_ASSET":
        contraAssets.push(row);
        totalAssets = totalAssets.minus(bal.creditBalance).plus(bal.debitBalance);
        break;
      case "LIABILITY":
        liabilities.push(row);
        totalLiabilities = totalLiabilities.plus(bal.creditBalance).minus(bal.debitBalance);
        break;
      case "OWNERS_EQUITY":
        equities.push(row);
        totalEquity = totalEquity.plus(bal.creditBalance).minus(bal.debitBalance);
        break;
      case "CONTRA_EQUITY":
        contraEquities.push(row);
        totalEquity = totalEquity.minus(bal.debitBalance).plus(bal.creditBalance);
        break;
    }
  }

  // Add current period net income to equity (from start of year to asOfDate)
  // For simplicity, net income = all revenue - all expense up to asOfDate not already in equity accounts
  // Since revenue/expense are temporary accounts closed to equity, we compute net income separately
  const incomeStatement = await getIncomeStatement(
    new Date(asOfDate.getFullYear(), 0, 1),
    asOfDate
  );
  totalEquity = totalEquity.plus(incomeStatement.netIncomeRaw);

  const totalLiabilitiesPlusEquity = totalLiabilities.plus(totalEquity);
  const difference = totalAssets.minus(totalLiabilitiesPlusEquity);

  return {
    asOfDate,
    assets,
    contraAssets,
    liabilities,
    equities,
    contraEquities,
    totalAssets: toMoney(totalAssets.greaterThanOrEqualTo(0) ? totalAssets : new Decimal(0)),
    totalAssetsRaw: totalAssets,
    totalLiabilities: toMoney(totalLiabilities.greaterThanOrEqualTo(0) ? totalLiabilities : new Decimal(0)),
    totalLiabilitiesRaw: totalLiabilities,
    totalEquity: toMoney(totalEquity.greaterThanOrEqualTo(0) ? totalEquity : new Decimal(0)),
    totalEquityRaw: totalEquity,
    totalLiabilitiesPlusEquity: toMoney(totalLiabilitiesPlusEquity.greaterThanOrEqualTo(0) ? totalLiabilitiesPlusEquity : new Decimal(0)),
    totalLiabilitiesPlusEquityRaw: totalLiabilitiesPlusEquity,
    difference: toMoney(difference.abs()),
    balanced: difference.abs().lessThan(new Decimal("0.01")),
    netIncome: incomeStatement.netIncome,
    netIncomeRaw: incomeStatement.netIncomeRaw,
  };
}

/**
 * Check if a reference number already exists (for duplicate prevention).
 */
export async function referenceExists(referenceNo: string): Promise<boolean> {
  const existing = await prisma.journalEntry.findUnique({ where: { referenceNo } });
  return !!existing;
}

/**
 * Create a draft journal entry with lines.
 */
export async function createDraftEntry(data: {
  date: Date;
  description: string;
  referenceNo?: string;
  lines: { accountId: string; debit: number | string; credit: number | string; description?: string }[];
  createdById?: string;
}) {
  // Validate no duplicate reference for drafts too (optional)
  if (data.referenceNo) {
    const exists = await referenceExists(data.referenceNo);
    if (exists) throw new Error(`Reference number "${data.referenceNo}" already exists`);
  }

  const entry = await prisma.journalEntry.create({
    data: {
      date: data.date,
      description: data.description || "",
      referenceNo: data.referenceNo || null,
      status: "DRAFT",
      entryType: "REGULAR",
      createdById: data.createdById,
      lines: {
        create: data.lines.map((l, i) => ({
          accountId: l.accountId,
          debit: toDecimal(l.debit),
          credit: toDecimal(l.credit),
          description: l.description,
          lineNo: i,
        })),
      },
    },
    include: { lines: { include: { account: true } } },
  });

  return entry;
}

/**
 * Get unposted/draft entries count and list (for dashboard warnings).
 */
export async function getUnpostedEntries() {
  return prisma.journalEntry.findMany({
    where: { status: "DRAFT" },
    include: { lines: { include: { account: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Seed: clear all transaction data (journal entries, lines) but keep accounts/users.
 */
export async function clearTransactionData() {
  await prisma.journalLine.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.dataResetLog.create({
    data: { action: "CLEAR_ALL", details: "Cleared all journal entries and lines" },
  });
}

/**
 * Seed: insert chart of accounts (upsert, no duplicates).
 */
export async function seedChartOfAccounts() {
  const accounts: Array<{
    accountNo: string;
    name: string;
    classification: AccountClassification;
    normalBalance: NormalBalance;
    description?: string;
  }> = [
    { accountNo: "101", name: "Cash", classification: "ASSET", normalBalance: "DEBIT", description: "Cash on hand and in bank" },
    { accountNo: "102", name: "Accounts Receivable", classification: "ASSET", normalBalance: "DEBIT", description: "Amounts due from customers" },
    { accountNo: "103", name: "Office Supplies", classification: "ASSET", normalBalance: "DEBIT", description: "Office supplies on hand" },
    { accountNo: "104", name: "Office Equipment", classification: "ASSET", normalBalance: "DEBIT", description: "Office equipment at cost" },
    { accountNo: "105", name: "Accumulated Depreciation - Equipment", classification: "CONTRA_ASSET", normalBalance: "CREDIT", description: "Contra-asset for office equipment depreciation" },
    { accountNo: "201", name: "Accounts Payable", classification: "LIABILITY", normalBalance: "CREDIT", description: "Amounts owed to suppliers" },
    { accountNo: "202", name: "Notes Payable", classification: "LIABILITY", normalBalance: "CREDIT", description: "Promissory notes owed" },
    { accountNo: "203", name: "Unearned Computer Services Revenue", classification: "LIABILITY", normalBalance: "CREDIT", description: "Services paid in advance but not yet rendered" },
    { accountNo: "204", name: "Salaries Payable", classification: "LIABILITY", normalBalance: "CREDIT", description: "Salaries earned by employees but not yet paid" },
    { accountNo: "205", name: "Advertising Payable", classification: "LIABILITY", normalBalance: "CREDIT", description: "Advertising services received but not yet paid" },
    { accountNo: "301", name: "A, Capital", classification: "OWNERS_EQUITY", normalBalance: "CREDIT", description: "Owner's capital investment" },
    { accountNo: "302", name: "A, Drawing", classification: "CONTRA_EQUITY", normalBalance: "DEBIT", description: "Owner's withdrawals" },
    { accountNo: "401", name: "Computer Service Revenue", classification: "REVENUE", normalBalance: "CREDIT", description: "Revenue from computer services" },
    { accountNo: "501", name: "Salaries Expense", classification: "EXPENSE", normalBalance: "DEBIT", description: "Salaries and wages expense" },
    { accountNo: "502", name: "Advertising Expense", classification: "EXPENSE", normalBalance: "DEBIT", description: "Advertising expense" },
    { accountNo: "503", name: "Office Supplies Expense", classification: "EXPENSE", normalBalance: "DEBIT", description: "Office supplies used expense" },
    { accountNo: "504", name: "Depreciation Expense - Equipment", classification: "EXPENSE", normalBalance: "DEBIT", description: "Depreciation expense on office equipment" },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { accountNo: acc.accountNo },
      update: {
        name: acc.name,
        classification: acc.classification,
        normalBalance: acc.normalBalance,
        description: acc.description,
        isActive: true,
      },
      create: acc,
    });
  }

  return accounts;
}

/**
 * Seed sample transactions for AAA Computer Services (December 2024).
 * Creates journal entries for the sample business transactions.
 */
export async function seedSampleTransactions(userId?: string) {
  // Check if sample data already exists (look for a reference marker)
  const existing = await prisma.journalEntry.findFirst({
    where: { description: { contains: "AAA Computer Services - Sample" } },
  });
  if (existing) {
    throw new Error("Sample transactions already exist. Clear data first.");
  }

  const txs: Array<{
    date: Date;
    description: string;
    referenceNo: string;
    entryType: EntryType;
    lines: { accountNo: string; debit: number; credit: number; description?: string }[];
  }> = [
    // Dec 1: Owner invests ₱100,000 cash
    {
      date: new Date(2024, 11, 1),
      description: "AAA Computer Services - Sample: Owner invested ₱100,000 cash to start the business",
      referenceNo: "SAMPLE-2024-12-01",
      entryType: "REGULAR",
      lines: [
        { accountNo: "101", debit: 100000, credit: 0, description: "Cash investment" },
        { accountNo: "301", debit: 0, credit: 100000, description: "Owner's capital" },
      ],
    },
    // Dec 2: Purchased office equipment for ₱15,000 cash
    {
      date: new Date(2024, 11, 2),
      description: "AAA Computer Services - Sample: Purchased office equipment for ₱15,000 cash",
      referenceNo: "SAMPLE-2024-12-02",
      entryType: "REGULAR",
      lines: [
        { accountNo: "104", debit: 15000, credit: 0, description: "Office equipment purchase" },
        { accountNo: "101", debit: 0, credit: 15000, description: "Cash payment" },
      ],
    },
    // Dec 5: Received ₱2,000 in advance for services
    {
      date: new Date(2024, 11, 5),
      description: "AAA Computer Services - Sample: Received ₱2,000 advance for computer services",
      referenceNo: "SAMPLE-2024-12-05",
      entryType: "REGULAR",
      lines: [
        { accountNo: "101", debit: 2000, credit: 0, description: "Cash received in advance" },
        { accountNo: "203", debit: 0, credit: 2000, description: "Unearned revenue" },
      ],
    },
    // Dec 6: Provided services, billed ₱3,500
    {
      date: new Date(2024, 11, 6),
      description: "AAA Computer Services - Sample: Provided computer services and billed client ₱3,500",
      referenceNo: "SAMPLE-2024-12-06",
      entryType: "REGULAR",
      lines: [
        { accountNo: "102", debit: 3500, credit: 0, description: "Services billed on account" },
        { accountNo: "401", debit: 0, credit: 3500, description: "Revenue earned" },
      ],
    },
    // Dec 7: Provided services, received ₱5,500 cash
    {
      date: new Date(2024, 11, 7),
      description: "AAA Computer Services - Sample: Provided computer services for ₱5,500 cash",
      referenceNo: "SAMPLE-2024-12-07",
      entryType: "REGULAR",
      lines: [
        { accountNo: "101", debit: 5500, credit: 0, description: "Cash received for services" },
        { accountNo: "401", debit: 0, credit: 5500, description: "Revenue earned" },
      ],
    },
    // Dec 7: Received ₱1,000 from client on account (Dec 6)
    {
      date: new Date(2024, 11, 7),
      description: "AAA Computer Services - Sample: Received ₱1,000 from client on account",
      referenceNo: "SAMPLE-2024-12-07b",
      entryType: "REGULAR",
      lines: [
        { accountNo: "101", debit: 1000, credit: 0, description: "Collection on account" },
        { accountNo: "102", debit: 0, credit: 1000, description: "Reduced accounts receivable" },
      ],
    },
    // Dec 8: Paid ₱1,500 for office supplies
    {
      date: new Date(2024, 11, 8),
      description: "AAA Computer Services - Sample: Paid ₱1,500 for office supplies",
      referenceNo: "SAMPLE-2024-12-08",
      entryType: "REGULAR",
      lines: [
        { accountNo: "103", debit: 1500, credit: 0, description: "Office supplies purchased" },
        { accountNo: "101", debit: 0, credit: 1500, description: "Cash payment" },
      ],
    },
    // Dec 8: Performed services for ₱1,800 cash
    {
      date: new Date(2024, 11, 8),
      description: "AAA Computer Services - Sample: Performed computer services for ₱1,800 cash",
      referenceNo: "SAMPLE-2024-12-08b",
      entryType: "REGULAR",
      lines: [
        { accountNo: "101", debit: 1800, credit: 0, description: "Cash received for services" },
        { accountNo: "401", debit: 0, credit: 1800, description: "Revenue earned" },
      ],
    },
    // Dec 10: Hired employee, salary ₱10,000 payable at end of month
    {
      date: new Date(2024, 11, 10),
      description: "AAA Computer Services - Sample: Salary expense earned, ₱10,000 payable at end of month",
      referenceNo: "SAMPLE-2024-12-10",
      entryType: "REGULAR",
      lines: [
        { accountNo: "501", debit: 10000, credit: 0, description: "Salaries expense (earned)" },
        { accountNo: "204", debit: 0, credit: 10000, description: "Salaries payable (liability)" },
      ],
    },
    // Dec 11: Received ₱5,500 advertising bill
    {
      date: new Date(2024, 11, 11),
      description: "AAA Computer Services - Sample: Received advertising bill of ₱5,500 to be paid later",
      referenceNo: "SAMPLE-2024-12-11",
      entryType: "REGULAR",
      lines: [
        { accountNo: "502", debit: 5500, credit: 0, description: "Advertising expense incurred" },
        { accountNo: "205", debit: 0, credit: 5500, description: "Advertising payable" },
      ],
    },
    // Dec 15: Owner withdrew ₱3,000 cash
    {
      date: new Date(2024, 11, 15),
      description: "AAA Computer Services - Sample: Owner withdrew ₱3,000 cash for personal use",
      referenceNo: "SAMPLE-2024-12-15",
      entryType: "REGULAR",
      lines: [
        { accountNo: "302", debit: 3000, credit: 0, description: "Owner's drawing" },
        { accountNo: "101", debit: 0, credit: 3000, description: "Cash withdrawn" },
      ],
    },
  ];

  // Look up accounts once
  const allAccounts = await prisma.account.findMany();
  const accountByNo = new Map<string, string>();
  for (const acc of allAccounts) {
    accountByNo.set(acc.accountNo, acc.id);
  }

  for (const tx of txs) {
    const { balanced } = validateEntryBalances(
      tx.lines.map((l) => ({ debit: l.debit, credit: l.credit }))
    );
    if (!balanced) {
      throw new Error(`Sample transaction ${tx.referenceNo} is out of balance`);
    }

    await prisma.journalEntry.create({
      data: {
        referenceNo: tx.referenceNo,
        date: tx.date,
        description: tx.description,
        status: "POSTED",
        entryType: tx.entryType,
        createdById: userId,
        lines: {
          create: tx.lines.map((l, i) => {
            const accountId = accountByNo.get(l.accountNo);
            if (!accountId) {
              throw new Error(`Account ${l.accountNo} not found in chart of accounts`);
            }
            return {
              accountId,
              debit: toDecimal(l.debit),
              credit: toDecimal(l.credit),
              description: l.description,
              lineNo: i,
            };
          }),
        },
      },
      include: { lines: true },
    });
  }

  await prisma.dataResetLog.create({
    data: { action: "SEED_SAMPLE", details: "Seeded AAA Computer Services sample transactions (December 2024)" },
  });

  return txs.length;
}
