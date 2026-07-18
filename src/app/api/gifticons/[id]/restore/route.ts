import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/verifyRequest";
import { getActor } from "@/server/auth/actor";
import { handleApiError } from "@/server/http";
import { restoreGifticonUse } from "@/server/gifticons/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = await requireAuth(request);
    const actor = await getActor(decoded.uid);
    const { id } = await params;

    const gifticon = await restoreGifticonUse(actor, id);
    return NextResponse.json({ success: true, gifticon });
  } catch (error) {
    return handleApiError(error);
  }
}
