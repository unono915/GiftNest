"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

/**
 * Centralizes the auth-state → route redirect rules so every page doesn't
 * re-implement them. Firebase Auth state lives client-side only (PRD 5.1's
 * suggested design: custom token + client-persisted session, no SSR
 * cookie), so gating happens here rather than in middleware.
 */
export function useAuthGuard(require: "signed-in" | "signed-out" | "profile-complete") {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "checking") return;

    if (require === "signed-out" && status !== "signed-out") {
      router.replace(status === "needs-profile" ? "/auth/profile" : "/gifticons");
      return;
    }
    if (require === "signed-in" && status === "signed-out") {
      router.replace("/auth");
      return;
    }
    if (require === "profile-complete") {
      if (status === "signed-out") router.replace("/auth");
      else if (status === "needs-profile") router.replace("/auth/profile");
    }
  }, [status, require, router]);

  return status;
}
