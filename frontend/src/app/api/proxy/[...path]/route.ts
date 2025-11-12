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

async function proxy(req: NextRequest, params: ProxyParams) {
  const segments = params.path ?? [];
  const targetPath = segments.join('/');
  const url = new URL(req.url);
  const sp = new URLSearchParams(url.searchParams);
  const bearer = sp.get('bearer') || sp.get('token') || undefined;
  if (bearer) { sp.delete('bearer'); sp.delete('token'); }
  const search = sp.toString();
  const targetUrl = `${backendBase}/${targetPath}${search ? `?${search}` : ''}`;
  if (process.env.NODE_ENV !== 'production') {
    console.info('[proxy] forwarding', req.method, targetUrl);
  }

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');
  // If no Authorization header, try to forward from bearer query or cookie `token`
  if (!headers.get('authorization')) {
    const cookieToken = req.cookies.get('token')?.value;
    const tok = bearer || cookieToken;
    if (tok) headers.set('authorization', `Bearer ${tok}`);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual'
  };

  if (!['GET', 'HEAD'].includes(req.method.toUpperCase())) {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      init.body = await req.text();
    } else if (contentType.includes('form')) {
      const form = await req.formData();
      headers.delete('content-type'); // dejar que fetch setee el boundary correcto
      init.body = form as any;
    } else if (contentType.includes('multipart')) {
      const form = await req.formData();
      headers.delete('content-type'); // dejar que fetch setee el boundary correcto
      init.body = form as any;
    } else {
      init.body = await req.arrayBuffer();
    }
  }

  const response = await fetch(targetUrl, init);
  const resHeaders = new Headers(response.headers);
  resHeaders.delete('content-length');
  resHeaders.set('access-control-expose-headers', '*');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: resHeaders
  });
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>).then === 'function';
}

async function resolveParams(context: { params: ProxyParams } | { params: Promise<ProxyParams> }): Promise<ProxyParams> {
  const value = context.params;
  return isPromise(value) ? await value : value;
}

export async function GET(req: NextRequest, context: { params: ProxyParams } | { params: Promise<ProxyParams> }) {
  const params = await resolveParams(context);
  return proxy(req, params);
}

export async function POST(req: NextRequest, context: { params: ProxyParams } | { params: Promise<ProxyParams> }) {
  const params = await resolveParams(context);
  return proxy(req, params);
}

export async function PUT(req: NextRequest, context: { params: ProxyParams } | { params: Promise<ProxyParams> }) {
  const params = await resolveParams(context);
  return proxy(req, params);
}

export async function DELETE(req: NextRequest, context: { params: ProxyParams } | { params: Promise<ProxyParams> }) {
  const params = await resolveParams(context);
  return proxy(req, params);
}

export async function PATCH(req: NextRequest, context: { params: ProxyParams } | { params: Promise<ProxyParams> }) {
  const params = await resolveParams(context);
  return proxy(req, params);
}
