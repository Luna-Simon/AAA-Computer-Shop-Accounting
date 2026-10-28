"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Mail, Lock, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
      <div className="w-full max-w-md p-6 bg-[#1E1E1E] rounded-xl border border-[#303030] shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#4A4E69] text-[#A9C4A1] mx-auto mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#F3F4F6]">Sign In</h1>
          <p className="text-[#A1A1AA] mt-2">AAA Computer Services Accounting</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-[#4A4E69]/30 bg-[#4A4E69]/10 text-[#A9C4A1] text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] focus:border-[#A9C4A1] outline-none transition-all bg-[#111111] text-[#F3F4F6] placeholder-[#A1A1AA]/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#A1A1AA] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-[#303030] rounded-lg focus:ring-2 focus:ring-[#A9C4A1] focus:border-[#A9C4A1] outline-none transition-all bg-[#111111] text-[#F3F4F6] placeholder-[#A1A1AA]/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-[#4A4E69] text-[#A9C4A1] font-semibold rounded-lg hover:bg-[#5A5E79] disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-[#A9C4A1]"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#303030] text-center">
          <p className="text-sm text-[#A1A1AA] mb-3">Demo credentials:</p>
          <div className="text-xs text-[#A1A1AA]/60 bg-[#111111] p-3 rounded inline-block border border-[#303030]">
            Email: admin@example.com<br />
            Password: (check .env ADMIN_PASSWORD or use "Admin123!")
          </div>
          <p className="text-sm text-[#A1A1AA] mt-4">
            First time? Set up your admin account in <code className="font-mono text-[#A9C4A1]">.env</code> then seed the database.
          </p>
        </div>
      </div>
    </div>
  );
}
