import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/verifyRequest";
import { getActor } from "@/server/auth/actor";
import { handleApiError } from "@/server/http";
import { saveGifticonSchema } from "@/lib/validation/gifticon";
import { saveGifticon } from "@/server/gifticons/service";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireAuth(request);
    const actor = await getActor(decoded.uid);
    const input = saveGifticonSchema.parse(await request.json());

    const result = await saveGifticon(actor, input);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
