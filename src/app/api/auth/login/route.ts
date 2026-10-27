import { NextResponse } from "next/server";
import { authenticateUser, createSessionToken, setSessionCookieOnResponse } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = createSessionToken(user);
    const response = NextResponse.json({
      message: "Logged in successfully",
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    setSessionCookieOnResponse(response, token);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Login failed" },
      { status: 500 }
    );
  }
}
