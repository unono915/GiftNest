import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/verifyRequest";
import { getActor } from "@/server/auth/actor";
import { handleApiError } from "@/server/http";
import { updateGifticonSchema } from "@/lib/validation/gifticon";
import { updateGifticon } from "@/server/gifticons/service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = await requireAuth(request);
    const actor = await getActor(decoded.uid);
    const { id } = await params;
    const patch = updateGifticonSchema.parse(await request.json());

    const gifticon = await updateGifticon(actor, id, patch);
    return NextResponse.json({ success: true, gifticon });
  } catch (error) {
    return handleApiError(error);
  }
}
