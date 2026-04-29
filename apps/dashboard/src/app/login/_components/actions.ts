"use server";

import { signIn } from "@/lib/auth";

export async function signInWithPostmarkAction(formData: FormData) {
  try {
    await signIn("postmark", formData);
  } catch (e) {
    console.error(e);
  }
}
