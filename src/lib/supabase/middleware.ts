import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Close public agency registration before creating an auth client. Do not
  // forward query parameters; invitation callbacks have their own /auth route.
  if (request.nextUrl.pathname === "/signup" || request.nextUrl.pathname === "/signup/") {
    return NextResponse.redirect(new URL("/login", request.url), 307);
  }

  // Root / serves landing_opus content but keeps URL as trybookedout.com
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing_opus";
    return NextResponse.rewrite(url);
  }

  if (
    request.nextUrl.pathname.startsWith("/onboarding/") ||
    request.nextUrl.pathname.startsWith("/api/onboarding/") ||
    request.nextUrl.pathname.startsWith("/api/client-leads/")
  ) {
    const response = NextResponse.next({ request });
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }

  // Public routes should not require Supabase env vars during local QA.
  const publicRoutes = [
    "/auth",
    "/landing",
    "/landing_opus",
    "/landing_gemini",
    "/landing_gpt1",
    "/es",
    "/go",
    "/api/geo",
    "/api/leads/inbound",
    "/api/track",
    "/api/unsubscribe",
    "/robots.txt",
    "/sitemap.xml",
    "/opengraph-image.png",
    "/twitter-image.png",
    "/privacy",
    "/terms",
    "/unsubscribe",
    "/preview",
    "/sites",
    "/onboarding",
    "/api/onboarding",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // /app routes require auth
  if (request.nextUrl.pathname.startsWith("/app")) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Invited team members already signed in go to their dashboard.
  if (request.nextUrl.pathname.startsWith("/login")) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}
