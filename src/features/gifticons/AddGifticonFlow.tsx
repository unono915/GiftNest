"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePicker } from "./ImagePicker";
import { AnalysisProgress } from "./AnalysisProgress";
import { GifticonForm, type GifticonFormValues } from "./GifticonForm";
import { analyzeGifticonImage, saveGifticon } from "./api";
import { looksLikeHeic, convertHeicToJpeg } from "@/lib/image/heic";
import { prepareImageVariants } from "@/lib/image/resize";
import { computeFileHash } from "@/lib/image/hash";
import { createUploadId, uploadGifticonImages } from "@/lib/firebase/storageUpload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GifticonAnalysis } from "@/lib/gemini/schema";
import type { ReviewOutcome } from "@/lib/gemini/confidence";

const UPLOAD_NOTICE_KEY = "giftnest_upload_notice_ack";

type FlowState =
  | { step: "select" }
  | { step: "preview"; file: File; previewUrl: string }
  | { step: "processing"; previewUrl: string; stage: "uploading" | "analyzing" }
  | {
      step: "result";
      previewUrl: string;
      imagePath: string;
      thumbnailPath: string;
      imageHash: string;
      analysis: GifticonAnalysis;
      reviewOutcome: ReviewOutcome;
      model: string;
    }
  | {
      step: "manual";
      previewUrl: string;
      imagePath: string | null;
      thumbnailPath: string | null;
      imageHash: string | null;
      error: string | null;
    }
  | { step: "done" };

function toFormValues(analysis: GifticonAnalysis): GifticonFormValues {
  return {
    brand: analysis.brand ?? "",
    productName: analysis.productName ?? "",
    category: analysis.category,
    faceValue: analysis.faceValue != null ? String(analysis.faceValue) : "",
    quantity: analysis.quantity != null ? String(analysis.quantity) : "1",
    expirationDate: analysis.expirationDate ?? "",
    memo: "",
  };
}

const blankFormValues: GifticonFormValues = {
  brand: "",
  productName: "",
  category: "unknown",
  faceValue: "",
  quantity: "1",
  expirationDate: "",
  memo: "",
};

export function AddGifticonFlow() {
  const router = useRouter();
  const [state, setState] = useState<FlowState>({ step: "select" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(
    () => typeof window !== "undefined" && !window.localStorage.getItem(UPLOAD_NOTICE_KEY)
  );

  function acknowledgeNotice() {
    window.localStorage.setItem(UPLOAD_NOTICE_KEY, "1");
    setShowNotice(false);
  }

  function handleSelect(file: File) {
    const previewUrl = URL.createObjectURL(file);
    setState({ step: "preview", file, previewUrl });
  }

  function reset() {
    setSaveError(null);
    setState({ step: "select" });
  }

  async function startProcessing() {
    if (state.step !== "preview") return;
    const { file, previewUrl } = state;
    setState({ step: "processing", previewUrl, stage: "uploading" });

    try {
      const sourceFile = looksLikeHeic(file) ? await convertHeicToJpeg(file) : file;
      const [variants, imageHash] = await Promise.all([
        prepareImageVariants(sourceFile),
        computeFileHash(sourceFile),
      ]);

      const uploadId = createUploadId();
      const { imagePath, thumbnailPath } = await uploadGifticonImages(uploadId, {
        original: variants.original.blob,
        thumbnail: variants.thumbnail.blob,
      });

      setState({ step: "processing", previewUrl, stage: "analyzing" });
      const result = await analyzeGifticonImage(variants.analysis.blob);

      if (!result.success) {
        setState({
          step: "manual",
          previewUrl,
          imagePath,
          thumbnailPath,
          imageHash,
          error: result.error,
        });
        return;
      }

      if (!result.analysis.isGifticon) {
        setState({
          step: "manual",
          previewUrl,
          imagePath,
          thumbnailPath,
          imageHash,
          error: "이미지에서 기프티콘을 인식하지 못했습니다. 직접 입력해 주세요.",
        });
        return;
      }

      setState({
        step: "result",
        previewUrl,
        imagePath,
        thumbnailPath,
        imageHash,
        analysis: result.analysis,
        reviewOutcome: result.reviewOutcome,
        model: result.model,
      });
    } catch (error) {
      setState({
        step: "manual",
        previewUrl,
        imagePath: null,
        thumbnailPath: null,
        imageHash: null,
        error: error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.",
      });
    }
  }

  async function handleSave(
    values: GifticonFormValues,
    imagePath: string,
    thumbnailPath: string | null,
    imageHash: string | null,
    ai: { analysis: GifticonAnalysis; model: string } | null
  ) {
    setSaving(true);
    setSaveError(null);
    try {
      await saveGifticon({
        imagePath,
        thumbnailPath,
        imageHash,
        brand: values.brand.trim() || null,
        productName: values.productName.trim() || null,
        category: values.category,
        faceValue: values.faceValue.trim() === "" ? null : Number(values.faceValue),
        quantity: values.quantity.trim() === "" ? null : Number(values.quantity),
        expirationDate: values.expirationDate || null,
        memo: values.memo.trim() || null,
        ai: ai
          ? {
              model: ai.model,
              confidence: ai.analysis.confidence,
              warnings: ai.analysis.warnings,
              expirationRawText: ai.analysis.expirationRawText,
              expirationType: ai.analysis.expirationType,
            }
          : null,
      });
      setState({ step: "done" });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const fieldConfidence = useMemo(() => {
    if (state.step !== "result") return undefined;
    return {
      brand: state.analysis.confidence.brand,
      productName: state.analysis.confidence.productName,
      expirationDate: state.analysis.confidence.expirationDate,
    };
  }, [state]);

  if (state.step === "select") {
    return <ImagePicker onSelect={handleSelect} />;
  }

  if (state.step === "preview") {
    return (
      <div className="flex flex-col gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image adds no value here */}
        <img src={state.previewUrl} alt="선택한 기프티콘 미리보기" className="max-h-96 w-full rounded-2xl object-contain bg-neutral-100" />
        {showNotice ? (
          <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
            <p>업로드한 이미지는 기프티콘 정보 분석을 위해 Google Gemini API로 전송됩니다.</p>
            <p className="mt-1">분석 결과와 이미지는 가족 공유 기프티콘 관리를 위해 저장되며, 언제든 삭제할 수 있습니다.</p>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={acknowledgeNotice}>
              확인했습니다
            </Button>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={reset}>
            다시 선택
          </Button>
          <Button type="button" className="flex-1" size="lg" onClick={startProcessing}>
            분석 시작
          </Button>
        </div>
      </div>
    );
  }

  if (state.step === "processing") {
    return (
      <div className="flex flex-col gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image adds no value here */}
        <img src={state.previewUrl} alt="분석 중인 기프티콘" className="max-h-72 w-full rounded-2xl object-contain bg-neutral-100 opacity-60" />
        <AnalysisProgress uploadStage={state.stage === "uploading"} />
      </div>
    );
  }

  if (state.step === "result") {
    return (
      <div className="flex flex-col gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image adds no value here */}
        <img src={state.previewUrl} alt="등록할 기프티콘" className="max-h-72 w-full rounded-2xl object-contain bg-neutral-100" />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">자동 등록되었습니다 · 필요하면 수정 후 저장하세요</Badge>
          {state.reviewOutcome.needsReview ? <Badge tone="warning">확인 필요</Badge> : null}
        </div>
        {state.reviewOutcome.reviewReasons.length > 0 ? (
          <ul className="text-sm text-amber-700">
            {state.reviewOutcome.reviewReasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        ) : null}
        <GifticonForm
          initialValues={toFormValues(state.analysis)}
          fieldConfidence={fieldConfidence}
          submitLabel="등록 완료"
          submitting={saving}
          onSubmit={(values) =>
            handleSave(values, state.imagePath, state.thumbnailPath, state.imageHash, {
              analysis: state.analysis,
              model: state.model,
            })
          }
        />
        {saveError ? <p className="text-sm font-medium text-red-600">{saveError}</p> : null}
      </div>
    );
  }

  if (state.step === "manual") {
    return (
      <div className="flex flex-col gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image adds no value here */}
        <img src={state.previewUrl} alt="직접 입력할 기프티콘" className="max-h-72 w-full rounded-2xl object-contain bg-neutral-100" />
        {state.error ? <p className="text-sm font-medium text-amber-700">{state.error}</p> : null}
        {!state.imagePath ? (
          <p className="text-sm text-red-600">이미지 업로드에 실패했습니다. 처음부터 다시 시도해 주세요.</p>
        ) : (
          <GifticonForm
            initialValues={blankFormValues}
            submitLabel="등록 완료"
            submitting={saving}
            onSubmit={(values) => handleSave(values, state.imagePath!, state.thumbnailPath, state.imageHash, null)}
          />
        )}
        {saveError ? <p className="text-sm font-medium text-red-600">{saveError}</p> : null}
        <Button type="button" variant="ghost" onClick={reset}>
          처음부터 다시
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="text-2xl">✅</p>
      <p className="font-medium text-neutral-900">기프티콘이 등록되었습니다.</p>
      <Button type="button" size="lg" onClick={() => router.push("/gifticons")}>
        완료
      </Button>
    </div>
  );
}
