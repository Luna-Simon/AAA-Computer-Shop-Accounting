import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { seedChartOfAccounts, seedSampleTransactions } from "@/lib/accounting";
import { ensureInitialAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { type, userId } = body;

    if (type === "accounts") {
      const accounts = await seedChartOfAccounts();
      return NextResponse.json({
        message: "Chart of accounts seeded",
        count: accounts.length,
      });
    }

    if (type === "sample") {
      // Ensure admin exists
      await ensureInitialAdmin();
      const admin = await requireAdmin();
      const count = await seedSampleTransactions(admin.id);
      return NextResponse.json({
        message: "Sample transactions seeded",
        count,
      });
    }

    if (type === "all") {
      const accounts = await seedChartOfAccounts();
      await ensureInitialAdmin();
      const admin = await requireAdmin();
      const count = await seedSampleTransactions(admin.id);
      return NextResponse.json({
        message: "All seed data created",
        accounts: accounts.length,
        transactions: count,
      });
    }

    return NextResponse.json(
      { error: "Invalid seed type. Use 'accounts', 'sample', or 'all'" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to seed data" },
      { status: 400 }
    );
  }
}
