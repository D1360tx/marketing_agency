/**
 * Renders a responsive HTML email template.
 * Uses table-based layout for maximum email client compatibility.
 */
export function renderHtmlEmail(params: {
  body: string;
  senderName: string;
  unsubscribeUrl: string;
  previewUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  trackingPixelHtml?: string;
}): string {
  const {
    body,
    senderName,
    unsubscribeUrl,
    previewUrl,
    ctaText,
    ctaUrl,
    trackingPixelHtml,
  } = params;

  // Convert plain text body to HTML paragraphs
  const htmlBody = body
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.6;color:#374151;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n            ");

  const ctaSection =
    ctaText && ctaUrl
      ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:#2563eb;border-radius:6px;">
                  <a href="${escapeHtml(ctaUrl)}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                    ${escapeHtml(ctaText)}
                  </a>
                </td>
              </tr>
            </table>`
      : "";

  const previewSection =
    previewUrl
      ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;">
              <tr>
                <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
                  <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#166534;">We built a website preview for your business:</p>
                  <a href="${escapeHtml(previewUrl)}" target="_blank" style="color:#2563eb;font-size:14px;word-break:break-all;">${escapeHtml(previewUrl)}</a>
                </td>
              </tr>
            </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Message from ${escapeHtml(senderName)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:20px 32px;background:#ffffff;border-radius:8px 8px 0 0;border-bottom:2px solid #2563eb;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#111827;">${escapeHtml(senderName)}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;background:#ffffff;font-size:15px;">
            ${htmlBody}
            ${ctaSection}
            ${previewSection}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#9ca3af;line-height:1.5;">
                This email was sent by ${escapeHtml(senderName)}. If you no longer wish to receive these emails, you can
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b7280;text-decoration:underline;">unsubscribe here</a>.
              </p>
              <p style="margin:0;font-size:11px;color:#d1d5db;">
                This message was sent in compliance with CAN-SPAM Act requirements.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  ${trackingPixelHtml || ""}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
