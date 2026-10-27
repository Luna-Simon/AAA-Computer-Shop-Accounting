import { verify, sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

const SECRET = process.env.NEXTAUTH_SECRET;
if (!SECRET || SECRET.length < 16) {
  throw new Error("NEXTAUTH_SECRET environment variable is required (min 16 chars)");
}

const COOKIE_NAME = "aaa_session";
const TOKEN_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "VIEWER";
};

/**
 * Hash a plain-text password.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Compare a plain-text password against a hash.
 */
export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return compare(plain, hashed);
}

/**
 * Create a signed JWT session token.
 */
export function createSessionToken(user: SessionUser): string {
  return sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET!,
    { expiresIn: TOKEN_DURATION }
  );
}

/**
 * Set the session cookie on a NextResponse object.
 * Call this in route handlers and attach the returned response.
 */
export function setSessionCookieOnResponse(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_DURATION,
  });
  return response;
}

/**
 * Clear the session cookie on a NextResponse object.
 */
export function clearSessionCookieOnResponse(
  response: NextResponse
): NextResponse {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/**
 * Get the current session user from the request cookies.
 * Returns null if no valid session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verify(token, SECRET!) as unknown as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "VIEWER",
    };
  } catch {
    return null;
  }
}

/**
 * Require an authenticated session. Throws if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const error: any = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }
  return user;
}

/**
 * Require admin role. Throws if not authenticated or not admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    const error: any = new Error("Forbidden: admin required");
    error.status = 403;
    throw error;
  }
  return user;
}

/**
 * Authenticate a user by email and password.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) return null;

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "VIEWER",
  };
}

/**
 * Create the initial admin user if none exists.
 */
export async function ensureInitialAdmin() {
  const existing = await prisma.user.findFirst();
  if (existing) return existing;

  const adminEmail =
    process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword =
    process.env.ADMIN_PASSWORD || "Admin123!";

  const passwordHash = await hashPassword(adminPassword);

  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.appSetting.create({
    data: { userId: user.id },
  });

  return user;
}
