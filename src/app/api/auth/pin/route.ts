import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { devicesPath } from "@/lib/firebase/paths";
import { pinLoginSchema } from "@/lib/validation/auth";
import { checkRateLimit, clearRateLimit, recordFailedAttempt } from "@/server/auth/rateLimit";
import { getEffectivePinHash } from "@/server/settings/service";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = pinLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const { pin, deviceId } = parsed.data;

  const rateLimit = await checkRateLimit(deviceId);
  if (rateLimit.locked) {
    return NextResponse.json(
      {
        success: false,
        error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429 }
    );
  }

  const pinHash = await getEffectivePinHash();
  if (!pinHash) {
    console.error("[auth/pin] FAMILY_PIN_HASH is not configured");
    return NextResponse.json({ success: false, error: "서버 설정 오류입니다." }, { status: 500 });
  }

  const isValid = await bcrypt.compare(pin, pinHash);
  if (!isValid) {
    const result = await recordFailedAttempt(deviceId);
    if (result.locked) {
      return NextResponse.json(
        {
          success: false,
          error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
          retryAfterMs: result.retryAfterMs,
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ success: false, error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await clearRateLimit(deviceId);

  const deviceRef = getAdminDb().doc(`${devicesPath()}/${deviceId}`);
  const deviceSnap = await deviceRef.get();
  const requiresProfile = !deviceSnap.exists || !deviceSnap.data()?.memberId;

  const customToken = await getAdminAuth().createCustomToken(deviceId);

  return NextResponse.json({ success: true, customToken, requiresProfile });
}
