"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setInvitePassword(_state: string | null, formData: FormData): Promise<string | null> {
  const password = formData.get("password");
  const confirmation = formData.get("confirmation");
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return "Use a password between 12 and 128 characters.";
  }
  if (password !== confirmation) return "Passwords do not match.";

  const supabase = await createClient();
  // Never authorize password changes from a query parameter or an unverified session.
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return "Your session has expired. Ask your administrator for a new invitation.";

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return "Unable to set your password. Check the password requirements or ask your administrator for help.";
  redirect("/app");
}
