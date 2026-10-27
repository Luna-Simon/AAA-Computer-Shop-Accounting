import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getBalanceSheet } from "@/lib/accounting";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const asOfDate = searchParams.get("asOfDate");

    if (!asOfDate) {
      return NextResponse.json(
        { error: "asOfDate is required" },
        { status: 400 }
      );
    }

    const result = await getBalanceSheet(new Date(asOfDate));

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate balance sheet" },
      { status: 500 }
    );
  }
}
