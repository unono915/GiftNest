"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldHint, Label } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type GifticonCategory } from "@/types/domain";
import { cn } from "@/lib/utils";

export type GifticonFormValues = {
  brand: string;
  productName: string;
  category: GifticonCategory;
  faceValue: string;
  quantity: string;
  expirationDate: string;
  memo: string;
};

export type GifticonFormFieldConfidence = Partial<Record<keyof GifticonFormValues, number | null>>;

const LOW_CONFIDENCE_THRESHOLD = 0.85;

export function isLowConfidence(confidence: number | null | undefined): boolean {
  return confidence != null && confidence < LOW_CONFIDENCE_THRESHOLD;
}

export function GifticonForm({
  initialValues,
  fieldConfidence,
  submitLabel,
  submitting,
  onSubmit,
}: {
  initialValues: GifticonFormValues;
  fieldConfidence?: GifticonFormFieldConfidence;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: GifticonFormValues) => void;
}) {
  const [values, setValues] = useState<GifticonFormValues>(initialValues);

  function set<K extends keyof GifticonFormValues>(key: K, value: GifticonFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  function labelWithFlag(text: string, field: keyof GifticonFormValues) {
    const low = isLowConfidence(fieldConfidence?.[field]);
    return (
      <span className="flex items-center gap-2">
        {text}
        {low ? <Badge tone="warning">확인 필요</Badge> : null}
      </span>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <Label htmlFor="brand">{labelWithFlag("브랜드", "brand")}</Label>
        <Input
          id="brand"
          value={values.brand}
          onChange={(e) => set("brand", e.target.value)}
          placeholder="예) 스타벅스"
          className={cn(isLowConfidence(fieldConfidence?.brand) && "border-amber-400 bg-amber-50")}
        />
      </Field>

      <Field>
        <Label htmlFor="productName">{labelWithFlag("상품명", "productName")}</Label>
        <Input
          id="productName"
          value={values.productName}
          onChange={(e) => set("productName", e.target.value)}
          placeholder="예) 아이스 아메리카노 T"
          className={cn(isLowConfidence(fieldConfidence?.productName) && "border-amber-400 bg-amber-50")}
        />
      </Field>

      <Field>
        <Label htmlFor="category">카테고리</Label>
        <Select id="category" value={values.category} onChange={(e) => set("category", e.target.value as GifticonCategory)}>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label htmlFor="faceValue">금액</Label>
          <Input
            id="faceValue"
            type="number"
            inputMode="numeric"
            min={0}
            value={values.faceValue}
            onChange={(e) => set("faceValue", e.target.value)}
            placeholder="선택"
          />
        </Field>
        <Field>
          <Label htmlFor="quantity">수량</Label>
          <Input
            id="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            placeholder="1"
          />
        </Field>
      </div>

      <Field>
        <Label htmlFor="expirationDate">{labelWithFlag("유효기간", "expirationDate")}</Label>
        <Input
          id="expirationDate"
          type="date"
          value={values.expirationDate}
          onChange={(e) => set("expirationDate", e.target.value)}
          className={cn(isLowConfidence(fieldConfidence?.expirationDate) && "border-amber-400 bg-amber-50")}
        />
        {values.expirationDate === "" ? (
          <FieldHint>날짜를 확인하지 못했습니다. 이미지를 보고 직접 입력해 주세요.</FieldHint>
        ) : null}
      </Field>

      <Field>
        <Label htmlFor="memo">메모</Label>
        <Textarea id="memo" value={values.memo} onChange={(e) => set("memo", e.target.value)} placeholder="선택 입력" />
      </Field>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "저장 중..." : submitLabel}
      </Button>
    </form>
  );
}
