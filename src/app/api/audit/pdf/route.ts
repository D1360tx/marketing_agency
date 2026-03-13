import { NextRequest, NextResponse } from "next/server";
import ReactPDF from "@react-pdf/renderer";
import React from "react";
import { AuditPdfDocument } from "@/lib/audit-pdf-document";
import type { AuditResult } from "@/lib/gbp-audit";

export async function POST(req: NextRequest) {
  try {
    const auditData: AuditResult = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(AuditPdfDocument, { data: auditData }) as any;
    const pdfStream = await ReactPDF.renderToStream(element);

    // Convert readable stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="gbp-audit-${auditData.business.name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
