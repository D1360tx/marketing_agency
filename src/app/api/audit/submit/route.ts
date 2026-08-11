import { NextResponse } from "next/server";
import { PUBLIC_SUBMISSION_HEADERS } from "@/lib/public-submission-security";

export async function POST() {
  return NextResponse.json(
    { error: "The automated audit preview has been retired. Request a sourced audit instead." },
    { status: 410, headers: PUBLIC_SUBMISSION_HEADERS }
  );
}
