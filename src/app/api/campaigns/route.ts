import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { campaignCreateSchema } from "@/types";

const createWithRecipientsSchema = campaignCreateSchema
  .extend({
    recipient_ids: z
      .array(z.string().uuid())
      .min(1)
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Duplicate recipients are not allowed",
      }),
  })
  .strict();

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Campaign list failed:", error.message);
      return NextResponse.json({ error: "Could not load outreach" }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data });
  } catch (error) {
    console.error("Campaign list failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 64 * 1024) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }

    const parsed = createWithRecipientsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the campaign fields and recipients" },
        { status: 400 }
      );
    }

    const { data: campaignId, error } = await supabase.rpc(
      "create_campaign_with_recipients",
      {
        p_name: parsed.data.name,
        p_type: parsed.data.type,
        p_subject_template: parsed.data.subject_template || "",
        p_body_template: parsed.data.body_template,
        p_recipient_ids: parsed.data.recipient_ids,
      }
    );

    if (error || !campaignId) {
      console.error("Atomic campaign creation failed:", error?.message);
      return NextResponse.json(
        {
          error:
            "Campaign was not created. Confirm every recipient has valid contact information and required consent.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { campaign: { id: campaignId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Campaign creation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
