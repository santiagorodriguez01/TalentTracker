import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ========================
//  CONFIGURACIÓN DEL BACKEND
// ========================
const BACKEND =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:3000";

const normalizeBase = (value: string) => value.replace(/\/+$/, "");
const backendBase = normalizeBase(BACKEND);

type ProxyParams = { path?: string[] };

// ========================
//  FUNCIÓN PRINCIPAL DE PROXY
// ========================
async function proxy(req: NextRequest, params: ProxyParams) {
  const segments = params.path ?? [];
  const targetPath = segments.join("/");

  const url = new URL(req.url);
  const sp = new URLSearchParams(url.searchParams);

  // Tokens opcionales
  const bearer = sp.get("bearer") || sp.get("token") || undefined;
  if (bearer) {
    sp.delete("bearer");
    sp.delete("token");
  }

  const search = sp.toString();
  const targetUrl = `${backendBase}/${targetPath}${search ? `?${search}` : ""}`;

  if (process.env.NODE_ENV !== "production") {
    console.info("[proxy] forwarding", req.method, targetUrl);
  }

  const init: RequestInit = {
    method: req.method,
    headers: {
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
  };

  const response = await fetch(targetUrl, init);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

// ========================
//  HANDLERS (GET, POST, PUT, DELETE)
//  USANDO RouteContext (OBLIGATORIO EN NEXT 15)
// ========================

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/proxy/[...path]">
) {
  const { path } = await ctx.params;
  return proxy(req, { path });
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/proxy/[...path]">
) {
  const { path } = await ctx.params;
  return proxy(req, { path });
}

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/proxy/[...path]">
) {
  const { path } = await ctx.params;
  return proxy(req, { path });
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/proxy/[...path]">
) {
  const { path } = await ctx.params;
  return proxy(req, { path });
}
