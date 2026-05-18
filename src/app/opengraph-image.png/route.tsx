import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f172a",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "74px",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#fb923c",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Booked Out
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 0.95,
              maxWidth: 980,
            }}
          >
            Websites, reviews, and fast follow-up for local businesses.
          </div>
          <div
            style={{
              color: "#cbd5e1",
              display: "flex",
              fontSize: 30,
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            Get a free audit of your review gaps, ranking gaps, website leaks,
            and missed-call risks.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["Free audit", "Review gap", "Ranking gap", "Missed-call risk"].map(
            (label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  borderRadius: 999,
                  color: "#e2e8f0",
                  fontSize: 24,
                  fontWeight: 700,
                  padding: "16px 24px",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      height: 630,
      width: 1200,
    }
  );
}
