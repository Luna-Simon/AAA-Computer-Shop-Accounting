import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getGeneralJournal } from "@/lib/accounting";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const filters: any = {};
    if (searchParams.get("startDate")) filters.startDate = new Date(searchParams.get("startDate")!);
    if (searchParams.get("endDate")) filters.endDate = new Date(searchParams.get("endDate")!);
    if (searchParams.get("accountNo")) filters.accountNo = searchParams.get("accountNo");
    if (searchParams.get("status")) filters.status = searchParams.get("status");
    if (searchParams.get("entryType")) filters.entryType = searchParams.get("entryType");

    const result = await getGeneralJournal(filters);

    return NextResponse.json({ entries: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate journal report" },
      { status: 500 }
    );
  }
}
