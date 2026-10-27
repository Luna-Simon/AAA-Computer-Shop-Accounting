import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { postJournalEntry } from "@/lib/accounting";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const updated = await postJournalEntry(id, user.id);

    return NextResponse.json({
      message: "Entry posted successfully",
      entry: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to post entry" },
      { status: 400 }
    );
  }
}
