import { Resend } from "resend";
import twilio from "twilio";

// Template variable interpolation
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

// Build variables from a prospect + analysis
export function buildTemplateVars(
  prospect: {
    business_name: string;
    city?: string | null;
    state?: string | null;
    phone?: string | null;
    website_url?: string | null;
    rating?: number | null;
  },
  grade?: string | null,
  previewUrl?: string | null
): Record<string, string> {
  return {
    business_name: prospect.business_name,
    city: prospect.city || "",
    state: prospect.state || "",
    phone: prospect.phone || "",
    website_url: prospect.website_url || "no website",
    website_grade: grade || "N/A",
    rating: prospect.rating?.toString() || "N/A",
    preview_url: previewUrl || "",
  };
}

// --- Email via Resend ---

export async function sendEmail(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  unsubscribeUrl?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = new Resend(params.apiKey);

    const headers: Record<string, string> = {};
    if (params.unsubscribeUrl) {
      headers["List-Unsubscribe"] = `<${params.unsubscribeUrl}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const { data, error } = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.body,
      html: params.html || undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Email send failed",
    };
  }
}

// --- SMS via Twilio ---

export async function sendSMS(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    const client = twilio(params.accountSid, params.authToken);

    const message = await client.messages.create({
      from: params.from,
      to: params.to,
      body: params.body,
    });

    return { success: true, messageSid: message.sid };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "SMS send failed",
    };
  }
}
