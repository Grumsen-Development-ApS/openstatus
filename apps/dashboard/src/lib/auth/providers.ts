import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Postmark from "next-auth/providers/postmark";

export const GitHubProvider = GitHub({
  allowDangerousEmailAccountLinking: true,
});

export const GoogleProvider = Google({
  allowDangerousEmailAccountLinking: true,
  authorization: {
    params: {
      // See https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
      prompt: "select_account",
      // scope:
      //   "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
    },
  },
});

export const PostmarkProvider = Postmark({
  apiKey: process.env.RESEND_API_KEY,
  from:
    process.env.EMAIL_FROM ?? "notifications@notifications.openstatus.dev",
});
