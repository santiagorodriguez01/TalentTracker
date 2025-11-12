import jwt from 'jsonwebtoken';

export default function authOrQueryBearer(roles = []) {
  return (req, res, next) => {
    let token = null;
    const hdr = req.headers.authorization;

    if (hdr?.startsWith('Bearer ')) {
      token = hdr.slice(7);
    } else if ((req.method === 'GET' || req.method === 'HEAD') && typeof req.query.bearer === 'string' && req.query.bearer) {
      token = req.query.bearer;

      setImmediate(() => { try { delete req.query.bearer; } catch {} });
    }

    if (!token) {
      return res.status(401).json({ error: { message: 'Token requerido' } });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      req.user = {
        id: payload.id,
        username: payload.username,
        rol_sistema: payload.rol_sistema
      };

      if (roles.length && !roles.includes(req.user.rol_sistema)) {
        return res.status(403).json({ error: { message: 'Rol no autorizado' } });
      }


      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ error: { message: 'Metodo no permitido con bearer en query' } });
      }

      next();
    } catch (e) {
      return res.status(401).json({ error: { message: 'Token invalido/expirado' } });
    }
  };
}
