export function parsePageSize(q) {
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(q.size ?? '20', 10) || 20)); // techo 100
  const off = (page - 1) * size;
  return { page, size, off };
}

export function setPaginationHeaders(res, total, { page, size }, req) {
  res.setHeader('X-Total-Count', String(total));

  const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
  const mk = (p) => {
    const u = new URL(url);
    u.searchParams.set('page', String(p));
    u.searchParams.set('size', String(size));
    return `<${u.pathname + u.search}>; rel="${pRel(p)}"`;
  };
  const pRel = (p) => (p < page ? 'prev' : p > page ? 'next' : 'self');

  const links = [];

  links.push(mk(page));

  if ((page - 1) * size > 0) links.push(mk(page - 1));
  if (page * size < total) links.push(mk(page + 1));

  links.push(mk(1));
  const last = Math.max(1, Math.ceil(total / size));
  links.push(mk(last));

  res.setHeader('Link', links.join(', '));
}
