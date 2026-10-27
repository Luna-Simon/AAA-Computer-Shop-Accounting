import { NextResponse } from "next/server";
import { clearSessionCookieOnResponse } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  clearSessionCookieOnResponse(response);
  return response;
}
