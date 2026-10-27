import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { clearTransactionData } from "@/lib/accounting";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { type } = body;

    if (type === "transactions") {
      await clearTransactionData();
      return NextResponse.json({
        message: "All transaction data cleared. Chart of accounts and users preserved.",
      });
    }

    return NextResponse.json(
      { error: "Invalid reset type. Use 'transactions'" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to reset data" },
      { status: 400 }
    );
  }
}
