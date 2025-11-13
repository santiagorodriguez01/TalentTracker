import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ---------------
// BACKEND REAL
// ---------------
const BACKEND = process.env.BACKEND_API_URL || "http://api:3000";
const backendBase = BACKEND.replace(/\/+$/, ""); // limpio barras finales

type ProxyParams = { path?: string[] };

async function proxy(req: NextRequest, params?: ProxyParams) {
  const segments = params?.path ?? [];
  const targetPath = segments.join("/");

  // Construyo URL final SIEMPRE correcta
  const targetUrl = `${backendBase}/${targetPath}`;

  if (process.env.NODE_ENV !== "production") {
    console.log("[proxy] →", req.method, targetUrl);
  }

  // Headers seguros
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // Auth opcional
  const cookieToken = req.cookies.get("token")?.value;
  if (!headers.get("authorization") && cookieToken) {
    headers.set("authorization", `Bearer ${cookieToken}`);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  // BODY según tipo
  if (!["GET", "HEAD"].includes(req.method.toUpperCase())) {
    init.body = await req.arrayBuffer();
  }

  const response = await fetch(targetUrl, init);

  // ARMADO LIMPIO DE RESPUESTA (evita decoding_failed)
  const body = await response.arrayBuffer();
  const outHeaders = new Headers(response.headers);
  outHeaders.delete("content-length");
  outHeaders.set("access-control-expose-headers", "*");

  return new NextResponse(body, {
    status: response.status,
    headers: outHeaders,
  });
}

// HANDLERS
export async function GET(req: NextRequest, ctx: any) {
  return proxy(req, ctx?.params);
}
export async function POST(req: NextRequest, ctx: any) {
  return proxy(req, ctx?.params);
}
export async function PUT(req: NextRequest, ctx: any) {
  return proxy(req, ctx?.params);
}
export async function PATCH(req: NextRequest, ctx: any) {
  return proxy(req, ctx?.params);
}
export async function DELETE(req: NextRequest, ctx: any) {
  return proxy(req, ctx?.params);
}
