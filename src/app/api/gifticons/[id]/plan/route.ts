import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/verifyRequest";
import { getActor } from "@/server/auth/actor";
import { handleApiError } from "@/server/http";
import { planGifticonSchema } from "@/lib/validation/gifticonActions";
import { clearGifticonPlan, planGifticon } from "@/server/gifticons/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = await requireAuth(request);
    const actor = await getActor(decoded.uid);
    const { id } = await params;
    const input = planGifticonSchema.parse(await request.json());

    const gifticon = await planGifticon(actor, id, input);
    return NextResponse.json({ success: true, gifticon });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = await requireAuth(request);
    const actor = await getActor(decoded.uid);
    const { id } = await params;

    const gifticon = await clearGifticonPlan(actor, id);
    return NextResponse.json({ success: true, gifticon });
  } catch (error) {
    return handleApiError(error);
  }
}
