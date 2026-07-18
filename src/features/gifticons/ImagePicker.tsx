"use client";

import { useRef, useState, type DragEvent } from "react";
import { Camera, ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ImagePicker({ onSelect }: { onSelect: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onSelect(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
        dragOver ? "border-brand-500 bg-brand-50" : "border-neutral-300"
      )}
    >
      <Upload className="h-10 w-10 text-neutral-400" aria-hidden />
      <div>
        <p className="font-medium text-neutral-900">기프티콘 이미지를 선택하세요</p>
        <p className="mt-1 text-sm text-neutral-500">PC에서는 이 영역에 드래그 앤 드롭할 수도 있습니다.</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button type="button" size="lg" onClick={() => galleryInputRef.current?.click()}>
          <ImageIcon className="h-5 w-5" aria-hidden />
          갤러리에서 선택
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => cameraInputRef.current?.click()}>
          <Camera className="h-5 w-5" aria-hidden />
          카메라로 촬영
        </Button>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
