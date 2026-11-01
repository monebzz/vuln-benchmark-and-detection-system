import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.LOCAL_API_BASE_URL || "http://localhost:8001";
const LINEVUL_URL =
  process.env.LINEVUL_URL ||
  process.env.NEXT_PUBLIC_LINEVUL_API_URL ||
  "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let bodyData: any;
    let isFormData = false;
    let rawCode = "";

    if (contentType.includes("application/json")) {
      const json = await req.json();
      rawCode = json.code || "";
      bodyData = JSON.stringify(json);
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      bodyData = formData;
      isFormData = true;
    } else {
      rawCode = await req.text();
      bodyData = JSON.stringify({ code: rawCode });
    }

    // 1. Primary route: Send to CVE Backend proxy (which coordinates LineVul & enriches with CVE KB details & patches)
    try {
      const backendHeaders: Record<string, string> = {};
      if (!isFormData) {
        backendHeaders["Content-Type"] = "application/json";
      }

      const backendRes = await fetch(`${BACKEND_URL}/api/linevul/analyze`, {
        method: "POST",
        headers: backendHeaders,
        body: bodyData,
      });

      if (backendRes.ok) {
        const enrichedData = await backendRes.json();
        return NextResponse.json(enrichedData);
      }
    } catch (backendErr) {
      console.warn("CVE Backend proxy failed, falling back to direct LineVul:", backendErr);
    }

    // 2. Secondary fallback: Send directly to LineVul AI service
    const directHeaders: Record<string, string> = {};
    if (!isFormData) {
      directHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(`${LINEVUL_URL}/predict`, {
      method: "POST",
      headers: directHeaders,
      body: bodyData,
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const err = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error || err.detail || `LineVul model prediction failed with status ${response.status}.` },
      { status: response.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: `Failed to connect to inspection services: ${error.message}. Ensure backend (8001) and LineVul (5000) are active.`,
      },
      { status: 502 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${LINEVUL_URL}/health`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: `LineVul service is offline or unreachable at ${LINEVUL_URL}.`,
      },
      { status: 503 }
    );
  }
}
