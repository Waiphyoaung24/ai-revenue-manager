"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { isAuthenticated } from "@/lib/auth";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) router.replace("/dashboard");
  }, [router]);

  return <AuthGate onAuthenticated={() => router.replace("/dashboard")} />;
}
