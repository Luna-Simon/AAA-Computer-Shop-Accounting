import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validateEntryBalances } from "@/lib/accounting";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const accountNo = searchParams.get("accountNo");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const entryType = searchParams.get("entryType");

    const where: any = {};
    if (status) where.status = status;
    if (entryType) where.entryType = entryType;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        lines: { include: { account: true }, orderBy: { lineNo: "asc" } },
        createdBy: { select: { name: true, email: true } },
        reversals: { select: { id: true, referenceNo: true, date: true } },
        reversedFrom: { select: { id: true, referenceNo: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    // Filter by account number if specified (check lines)
    let result = entries;
    if (accountNo) {
      result = entries.filter((e) =>
        e.lines.some((l) => l.account.accountNo === accountNo)
      );
    }

    return NextResponse.json({ entries: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch journal entries" },
      { status: err.status || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const {
      date,
      description,
      referenceNo,
      lines,
    } = body;

    if (!date || !description) {
      return NextResponse.json(
        { error: "Date and description are required" },
        { status: 400 }
      );
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: "At least one journal line is required" },
        { status: 400 }
      );
    }

    // Validate each line
    for (const line of lines) {
      if (!line.accountId) {
        return NextResponse.json(
          { error: "Every line must have an account" },
          { status: 400 }
        );
      }
      const d = parseFloat(line.debit || 0);
      const c = parseFloat(line.credit || 0);
      if (d === 0 && c === 0) {
        return NextResponse.json(
          { error: `Line for account ${line.accountId} has no amount` },
          { status: 400 }
        );
      }
      if (d > 0 && c > 0) {
        return NextResponse.json(
          { error: `Line cannot have both debit and credit amounts` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate reference number
    if (referenceNo) {
      const existing = await prisma.journalEntry.findUnique({
        where: { referenceNo },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Reference number "${referenceNo}" already exists` },
          { status: 409 }
        );
      }
    }

    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date(date),
        description,
        referenceNo: referenceNo || null,
        status: "DRAFT",
        entryType: "REGULAR",
        createdById: user.id,
        lines: {
          create: lines.map((l: any, i: number) => ({
            accountId: l.accountId,
            debit: parseFloat(l.debit || 0),
            credit: parseFloat(l.credit || 0),
            description: l.description || null,
            lineNo: i,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create journal entry" },
      { status: err.status || 500 }
    );
  }
}
