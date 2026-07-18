import { NextResponse, type NextRequest } from "next/server";
import { registerDeviceSchema } from "@/lib/validation/members";
import { requireAuth } from "@/server/auth/verifyRequest";
import { registerDevice } from "@/server/members/service";
import { handleApiError } from "@/server/http";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireAuth(request);
    const body = registerDeviceSchema.parse(await request.json());
    const device = await registerDevice(decoded.uid, body);
    return NextResponse.json({ success: true, device });
  } catch (error) {
    return handleApiError(error);
  }
}
