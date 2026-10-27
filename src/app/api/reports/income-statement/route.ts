import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getIncomeStatement } from "@/lib/accounting";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const result = await getIncomeStatement(
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate income statement" },
      { status: 500 }
    );
  }
}
