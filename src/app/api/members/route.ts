import { NextResponse, type NextRequest } from "next/server";
import { createMemberSchema } from "@/lib/validation/members";
import { requireAuth } from "@/server/auth/verifyRequest";
import { createMember } from "@/server/members/service";
import { handleApiError } from "@/server/http";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = createMemberSchema.parse(await request.json());
    const member = await createMember(body);
    return NextResponse.json({ success: true, member });
  } catch (error) {
    return handleApiError(error);
  }
}
