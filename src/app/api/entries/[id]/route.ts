import { NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: { include: { account: true }, orderBy: { lineNo: "asc" } },
        createdBy: { select: { name: true, email: true } },
        reversals: { select: { id: true, referenceNo: true, date: true, description: true } },
        reversedFrom: { select: { id: true, referenceNo: true, date: true } },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch journal entry" },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { date, description, referenceNo, lines } = body;

    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }

    if (existing.status === "POSTED") {
      return NextResponse.json(
        { error: "Cannot modify a posted entry. Use reverse instead." },
        { status: 409 }
      );
    }

    // Check for duplicate reference number (excluding current)
    if (referenceNo && referenceNo !== existing.referenceNo) {
      const conflict = await prisma.journalEntry.findUnique({ where: { referenceNo } });
      if (conflict) {
        return NextResponse.json(
          { error: `Reference number "${referenceNo}" already exists` },
          { status: 409 }
        );
      }
    }

    // Delete existing lines and recreate
    await prisma.journalLine.deleteMany({ where: { journalEntryId: id } });

    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        date: date ? new Date(date) : existing.date,
        description: description !== undefined ? description : existing.description,
        referenceNo: referenceNo !== undefined ? referenceNo : existing.referenceNo,
        lines: {
          create: (lines || []).map((l: any, i: number) => ({
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

    return NextResponse.json({ entry });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update journal entry" },
      { status: err.status || 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.journalEntry.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }

    if (existing.status === "POSTED") {
      return NextResponse.json(
        { error: "Cannot delete a posted entry. Use reverse instead." },
        { status: 409 }
      );
    }

    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ message: "Draft entry deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete journal entry" },
      { status: err.status || 500 }
    );
  }
}
