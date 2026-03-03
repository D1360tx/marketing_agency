import { NextResponse } from "next/server";

const FALLBACK = { city: "", region: "" } as const;

function pickClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    // May be a comma-separated list. First is the original client.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = headers.get("x-real-ip")?.trim();
  if (xri) return xri;
  return null;
}

function isPrivateOrLocalhostIp(ipRaw: string): boolean {
  const ip = ipRaw.trim().toLowerCase();
  if (!ip) return true;

  // Remove IPv6 brackets and port, e.g. "[::1]:1234"
  const stripped = ip.replace(/^\[/, "").replace(/\]$/, "");
  const noPort = stripped.includes(":") && stripped.includes(".")
    ? stripped // likely IPv6-mapped or contains colons; leave as-is
    : stripped.split(":")[0] ?? stripped;

  const v = noPort;

  // Common localhost
  if (v === "127.0.0.1" || v === "::1" || v === "localhost") return true;

  // IPv4 private ranges
  if (/^10\./.test(v)) return true;
  if (/^192\.168\./.test(v)) return true;
  if (/^169\.254\./.test(v)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;

  // IPv6 local / private / link-local
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // fc00::/7
  if (v.startsWith("fe80:")) return true;

  return false;
}

export async function GET(request: Request) {
  try {
    const ip = pickClientIp(new Headers(request.headers));

    if (!ip || isPrivateOrLocalhostIp(ip)) {
      return NextResponse.json(FALLBACK);
    }

    const url = `https://ip-api.com/json/${encodeURIComponent(
      ip
    )}?fields=city,regionName,status`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "BookedOut/1.0 (+https://trybookedout.com)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(FALLBACK);
    }

    const data = (await res.json()) as {
      status?: string;
      city?: string;
      regionName?: string;
    };

    if (data?.status !== "success") {
      return NextResponse.json(FALLBACK);
    }

    const city = data.city?.trim() || FALLBACK.city;
    const region = data.regionName?.trim() || FALLBACK.region;

    return NextResponse.json({ city, region });
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
