"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!checked) {
      setChecked(true);
      if (isLoading) return;
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, checked, router]);

  return null;
}
