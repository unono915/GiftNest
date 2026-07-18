import { z } from "zod";

export const changePinSchema = z.object({
  currentPin: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
  newPin: z.string().min(4, "새 비밀번호는 4자리 이상이어야 합니다.").max(64),
  logoutOtherDevices: z.boolean().default(false),
});

export type ChangePinInput = z.infer<typeof changePinSchema>;
