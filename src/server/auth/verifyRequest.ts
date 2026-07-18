import "server-only";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

export class UnauthorizedError extends Error {
  constructor(message = "인증이 필요합니다.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Verifies the `Authorization: Bearer <Firebase ID token>` header sent by
 * every authenticated client request. Returns the decoded token (uid ==
 * deviceId, see deviceId.ts) or throws UnauthorizedError.
 */
export async function requireAuth(request: NextRequest) {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const idToken = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!idToken) throw new UnauthorizedError();

  try {
    // checkRevoked=true so a device revoked via "비밀번호 변경 시 기존 기기
    // 로그아웃" (PRD 5.1) is rejected on its very next write, instead of
    // waiting for its short-lived ID token to expire naturally.
    return await getAdminAuth().verifyIdToken(idToken, true);
  } catch {
    throw new UnauthorizedError("인증 토큰이 유효하지 않습니다. 다시 로그인해 주세요.");
  }
}
