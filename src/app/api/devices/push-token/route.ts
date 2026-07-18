import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/verifyRequest";
import { handleApiError } from "@/server/http";
import { registerPushTokenSchema } from "@/lib/validation/device";
import { disablePushNotifications, registerPushToken } from "@/server/devices/service";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireAuth(request);
    const { token } = registerPushTokenSchema.parse(await request.json());
    await registerPushToken(decoded.uid, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const decoded = await requireAuth(request);
    await disablePushNotifications(decoded.uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
