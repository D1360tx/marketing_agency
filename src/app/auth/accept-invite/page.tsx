import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitePasswordForm } from "./password-form";

export const metadata = { title: "Accept invitation | Booked Out", robots: { index: false, follow: false } };

export default async function AcceptInvitePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept your invitation</CardTitle>
          <CardDescription>Set a password for your internal Booked Out account.</CardDescription>
        </CardHeader>
        <CardContent>
          {user && !error ? <InvitePasswordForm /> : (
            <div className="space-y-3">
              <p role="alert">Open the invitation link from your email first. If it has expired or was already used, ask your administrator for a new invitation.</p>
              <Link href="/login" className="text-primary underline">Already set a password? Sign in</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
