import { NextResponse, type NextRequest } from "next/server";
import { sendDailyNotifications } from "@/server/notifications/service";

/**
 * PRD 8.9: 외부 공개 금지 — Vercel Cron injects `Authorization: Bearer
 * ${CRON_SECRET}` automatically when the CRON_SECRET env var is set; any
 * other caller is rejected. Not wired through requireAuth() since this has
 * no Firebase end-user session at all (server-to-server only).
 */
function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await sendDailyNotifications();
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error("[notifications/daily] failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "알림 발송 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// Vercel Cron sends GET by default unless overridden; support both.
export const GET = POST;
