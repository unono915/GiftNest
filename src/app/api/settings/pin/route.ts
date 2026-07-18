import { NextResponse, type NextRequest } from "next/server";
import { changePinSchema } from "@/lib/validation/settings";
import { requireAuth } from "@/server/auth/verifyRequest";
import { changeFamilyPin } from "@/server/settings/service";
import { handleApiError } from "@/server/http";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireAuth(request);
    const body = changePinSchema.parse(await request.json());
    await changeFamilyPin(decoded.uid, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
