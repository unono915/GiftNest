import { z } from "zod";

export const AVATAR_EMOJI_OPTIONS = [
  "😀",
  "😎",
  "🧑",
  "👩",
  "👨",
  "👧",
  "👦",
  "🐶",
  "🐱",
  "🐻",
  "🦊",
  "🐰",
] as const;

export const createMemberSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(20),
  avatarEmoji: z.string().min(1).max(8).default("🙂"),
});

export const updateMemberSchema = z.object({
  name: z.string().trim().min(1).max(20).optional(),
  avatarEmoji: z.string().min(1).max(8).optional(),
  isActive: z.boolean().optional(),
});

export const registerDeviceSchema = z.object({
  memberId: z.string().min(1),
  deviceName: z.string().trim().min(1, "기기 이름을 입력해 주세요.").max(30),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
