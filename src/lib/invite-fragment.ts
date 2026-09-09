type InviteFragmentBrowser = {
  pathname: string;
  hash: string;
  clearFragment: () => void;
  replace: (path: string) => void;
  createAuth: () => Promise<{
    setSession: (tokens: { access_token: string; refresh_token: string }) => Promise<{
      data: { session: unknown };
      error: unknown;
    }>;
  }>;
};

// Legacy Supabase ConfirmationURL invitations land on SiteURL with a fragment,
// which never reaches Next.js middleware or the server token-hash callback.
export async function handleInviteFragment(browser: InviteFragmentBrowser): Promise<boolean> {
  if (browser.pathname !== "/") return false;
  const params = new URLSearchParams(browser.hash.replace(/^#/, ""));
  if (!params.getAll("type").includes("invite")) return false;

  // Scrub before importing/initializing Supabase so its automatic URL detection
  // cannot race this explicit exchange. Never put bearer credentials in a query.
  browser.clearFragment();
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const valid = accessToken && refreshToken &&
    ["type", "access_token", "refresh_token", "token_type"].every((key) => params.getAll(key).length === 1) &&
    params.get("token_type") === "bearer" &&
    !["error", "error_code", "code", "token_hash"].some((key) => params.has(key));
  if (valid) {
    try {
      const auth = await browser.createAuth();
      const { data, error } = await auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (!error && data.session) {
        // Full navigation ensures the server password page reads the new cookies.
        // That page independently validates the user; the fragment is not auth.
        browser.replace("/auth/accept-invite");
        return true;
      }
    } catch {
      // Do not log auth errors or URLs containing credentials.
    }
  }
  browser.replace("/login?error=auth");
  return true;
}
