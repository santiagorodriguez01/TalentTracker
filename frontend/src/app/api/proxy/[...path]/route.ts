import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const BACKEND =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'http://localhost:3000';

const normalizeBase = (value: string) => value.replace(/\/+$/, '');
const backendBase = normalizeBase(BACKEND);

type ProxyParams = { path?: string[] };

export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, ctx: { params: ProxyParams }) {
  const segments = ctx.params.path ?? [];
  const targetPath = segments.join('/');
  const url = new URL(req.url);
  const sp = new URLSearchParams(url.searchParams);

  const bearer = sp.get('bearer') || sp.get('token') || undefined;
  if (bearer) {
    sp.delete('bearer');
    sp.delete('token');
  }

  const search = sp.toString();
  const targetUrl = `${backendBase}/${targetPath}${search ? `?${search}` : ''}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');

  if (bearer) {
    headers.set('authorization', `Bearer ${bearer}`);
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (hasBody) {
    // Node 18+/22 exige duplex cuando hay body en fetch del lado del servidor
    (init as any).duplex = 'half';
    // @ts-ignore: el body de NextRequest es un ReadableStream
    init.body = req.body as any;
  }

  const resp = await fetch(targetUrl, init);

  const respHeaders = new Headers(resp.headers);
  respHeaders.delete('transfer-encoding');

  return new NextResponse(resp.body, {
    status: resp.status,
    headers: respHeaders,
  });
}

// Acá viene el truco: el segundo parámetro lo tipamos como `any`
// para que el tipo sea compatible con lo que Next espera internamente.
export async function GET(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
