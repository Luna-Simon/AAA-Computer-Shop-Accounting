import { NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth();
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { accountNo: "asc" },
    });
    return NextResponse.json({ accounts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch accounts" },
      { status: err.status || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin();
    const body = await req.json();
    const { accountNo, name, classification, normalBalance, description } = body;

    if (!accountNo || !name || !classification) {
      return NextResponse.json(
        { error: "Account number, name, and classification are required" },
        { status: 400 }
      );
    }

    // Check for duplicate account number
    const existing = await prisma.account.findUnique({ where: { accountNo } });
    if (existing) {
      return NextResponse.json(
        { error: `Account number "${accountNo}" already exists` },
        { status: 409 }
      );
    }

    const account = await prisma.account.create({
      data: {
        accountNo,
        name,
        classification,
        normalBalance: normalBalance || "DEBIT",
        description: description || null,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create account" },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAdmin();
    const body = await req.json();
    const { id, accountNo, name, classification, normalBalance, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Check if account exists
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Prevent changing account number if it's already used (handled by unique constraint)
    // Check if new accountNo conflicts with another account
    if (accountNo && accountNo !== existing.accountNo) {
      const conflict = await prisma.account.findUnique({ where: { accountNo } });
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: `Account number "${accountNo}" already exists` },
          { status: 409 }
        );
      }
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(accountNo !== undefined ? { accountNo } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(classification !== undefined ? { classification } : {}),
        ...(normalBalance !== undefined ? { normalBalance } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json({ account });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update account" },
      { status: err.status || 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        lines: {
          where: { journalEntry: { status: "POSTED" } },
          take: 1,
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Prevent deletion if account has posted lines
    if (account.lines && account.lines.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete account "${account.accountNo}" because it is used by posted journal entries. Deleting would destroy accounting history.`,
        },
        { status: 409 }
      );
    }

    await prisma.account.delete({ where: { id } });
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete account" },
      { status: err.status || 500 }
    );
  }
}
