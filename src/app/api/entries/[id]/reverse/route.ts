import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reverseJournalEntry } from "@/lib/accounting";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { reversalDate, description } = body;

    if (!reversalDate) {
      return NextResponse.json(
        { error: "Reversal date is required" },
        { status: 400 }
      );
    }

    const reversal = await reverseJournalEntry(
      id,
      new Date(reversalDate),
      description || "",
      user.id
    );

    return NextResponse.json({
      message: "Entry reversed successfully",
      reversal,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to reverse entry" },
      { status: 400 }
    );
  }
}
