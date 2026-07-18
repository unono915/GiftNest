"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const STAGES = ["이미지 업로드 중", "기프티콘 확인 중", "브랜드와 상품명 분석 중", "유효기간 확인 중", "등록 중"];
const STAGE_INTERVAL_MS = 900;

/**
 * Gemini analysis is a single request/response — there's no real per-field
 * progress to report. PRD 6.3 still wants the user to see these stages, so
 * this cycles through them purely for perceived progress on a timer.
 *
 * Mount this component only while actually processing (the caller should
 * conditionally render it, not pass an `active` flag) — that way the
 * initial stage is naturally fresh on every run via lazy useState instead
 * of needing an effect to "reset" state, and the interval only ever
 * updates state from its own callback, not synchronously in the effect
 * body.
 */
export function AnalysisProgress({ uploadStage }: { uploadStage: boolean }) {
  const [stageIndex, setStageIndex] = useState(() => (uploadStage ? 0 : 1));

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <Spinner className="h-8 w-8" />
      <p className="font-medium text-neutral-900">{STAGES[stageIndex]}...</p>
      <ul className="flex flex-col gap-1 text-sm text-neutral-400">
        {STAGES.map((stage, i) => (
          <li key={stage} className={i <= stageIndex ? "text-neutral-600" : undefined}>
            {i < stageIndex ? "✓" : i === stageIndex ? "•" : "○"} {stage}
          </li>
        ))}
      </ul>
    </div>
  );
}
