import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDashboardTotals, getUnpostedEntries } from "@/lib/accounting";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const asOfDate = searchParams.get("asOfDate");

    const totals = await getDashboardTotals(
      asOfDate ? new Date(asOfDate) : undefined
    );
    const unposted = await getUnpostedEntries();

    return NextResponse.json({
      ...totals,
      unpostedCount: unposted.length,
      unposted: unposted.map((e) => ({
        id: e.id,
        referenceNo: e.referenceNo,
        date: e.date,
        description: e.description,
        lineCount: e.lines.length,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
