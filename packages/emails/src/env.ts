import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z
      .string()
      .email()
      .default("notifications@notifications.openstatus.dev"),
    POSTMARK_BROADCAST_STREAM: z.string().min(1).optional(),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    POSTMARK_BROADCAST_STREAM: process.env.POSTMARK_BROADCAST_STREAM,
  },
});
