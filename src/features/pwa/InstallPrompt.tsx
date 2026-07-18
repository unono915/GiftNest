"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Lazy initializers run once on first render (and safely return false
  // during SSR, since both helpers guard on `typeof window`) — no need to
  // set these from an effect.
  const [installed, setInstalled] = useState(isStandalone);
  const [ios] = useState(isIos);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed) {
    return <p className="text-sm text-neutral-500">이미 홈 화면에 설치되어 있습니다.</p>;
  }

  if (deferredPrompt) {
    return (
      <Button
        type="button"
        onClick={async () => {
          await deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          setDeferredPrompt(null);
        }}
      >
        홈 화면에 설치
      </Button>
    );
  }

  if (ios) {
    return (
      <p className="text-sm text-neutral-500">
        Safari 하단의 공유 버튼을 누른 뒤 &ldquo;홈 화면에 추가&rdquo;를 선택하세요.
      </p>
    );
  }

  return (
    <p className="text-sm text-neutral-500">
      브라우저 메뉴에서 &ldquo;홈 화면에 추가&rdquo; 또는 &ldquo;앱 설치&rdquo;를 선택하세요.
    </p>
  );
}
