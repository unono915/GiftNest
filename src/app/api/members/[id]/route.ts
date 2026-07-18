import { NextResponse, type NextRequest } from "next/server";
import { updateMemberSchema } from "@/lib/validation/members";
import { requireAuth } from "@/server/auth/verifyRequest";
import { updateMember } from "@/server/members/service";
import { handleApiError } from "@/server/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const body = updateMemberSchema.parse(await request.json());
    const member = await updateMember(id, body);
    return NextResponse.json({ success: true, member });
  } catch (error) {
    return handleApiError(error);
  }
}
