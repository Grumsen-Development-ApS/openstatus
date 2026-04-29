"use client";

import { useFormStatus } from "react-dom";

import { Input } from "@openstatus/ui/components/ui/input";
import { Label } from "@openstatus/ui/components/ui/label";
import { toast } from "sonner";
import { signInWithPostmarkAction } from "./actions";
import { LoginButton } from "./login-button";

export default function MagicLinkForm() {
  const { pending } = useFormStatus();

  return (
    <form
      action={async (formData) => {
        try {
          await signInWithPostmarkAction(formData);
          toast.success("Check your inbox for the magic link.");
        } catch (e) {
          console.error(e);
          toast.error("Error sending magic link.");
        }
      }}
      className="grid gap-2"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <LoginButton provider="email">
        {pending ? "Sending..." : "Send Magic Link"}
      </LoginButton>
    </form>
  );
}
