"use client";

import { useEffect } from "react";
import { handleInviteFragment } from "@/lib/invite-fragment";

export function InviteFragmentHandler() {
  useEffect(() => {
    const handle = () => void handleInviteFragment({
      pathname: window.location.pathname,
      hash: window.location.hash,
      clearFragment: () => window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search),
      replace: (path) => window.location.replace(path),
      createAuth: async () => {
        const { createClient } = await import("@/lib/supabase/client");
        return createClient().auth;
      },
    });
    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);
  return null;
}
