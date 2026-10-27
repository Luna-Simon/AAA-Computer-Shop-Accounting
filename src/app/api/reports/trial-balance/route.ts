import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTrialBalance } from "@/lib/accounting";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const asOfDate = searchParams.get("asOfDate");

    const result = await getTrialBalance(
      asOfDate ? new Date(asOfDate) : undefined
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate trial balance" },
      { status: 500 }
    );
  }
}
