import { z } from "zod";

export const pinLoginSchema = z.object({
  pin: z.string().min(4).max(64),
  deviceId: z.string().uuid(),
});

export type PinLoginInput = z.infer<typeof pinLoginSchema>;
