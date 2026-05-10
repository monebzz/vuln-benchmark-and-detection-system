import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.LOCAL_API_BASE_URL ||
  process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

async function proxy(req: NextRequest, path: string[]) {
  const targetUrl = new URL(`${API_BASE}/api/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.text();

  const response = await fetch(targetUrl.toString(), {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const outHeaders = new Headers(response.headers);
  outHeaders.delete("content-encoding");
  outHeaders.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    headers: outHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path || []);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path || []);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path || []);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path || []);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path || []);
}

export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path || []);
}
