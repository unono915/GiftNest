"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { FullScreenSpinner } from "@/components/ui/spinner";

export default function RootPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "checking") return;
    if (status === "signed-out") router.replace("/auth");
    else if (status === "needs-profile") router.replace("/auth/profile");
    else router.replace("/gifticons");
  }, [status, router]);

  return <FullScreenSpinner />;
}
