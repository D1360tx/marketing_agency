"use client";

import { useActionState } from "react";
import { setInvitePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvitePasswordForm() {
  const [error, action, pending] = useActionState(setInvitePassword, null);
  return (
    <form action={action} className="space-y-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmation">Confirm password</Label>
        <Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </div>
      <p className="text-sm text-muted-foreground">Use 12–128 characters. This password is for your invited Booked Out account.</p>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Set password and continue"}</Button>
    </form>
  );
}
