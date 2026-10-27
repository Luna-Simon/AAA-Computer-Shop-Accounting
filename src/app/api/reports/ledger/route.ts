import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getGeneralLedger } from "@/lib/accounting";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId") || undefined;
    const asOfDate = searchParams.get("asOfDate");

    const result = await getGeneralLedger(
      accountId,
      asOfDate ? new Date(asOfDate) : undefined
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate general ledger" },
      { status: 500 }
    );
  }
}
