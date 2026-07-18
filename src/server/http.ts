import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/server/auth/verifyRequest";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: "요청 형식이 올바르지 않습니다.", details: error.issues },
      { status: 400 }
    );
  }
  console.error("[api] unhandled error", error);
  return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
}
