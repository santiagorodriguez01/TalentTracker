// src/web/controllers/AuthController.js
import asyncH from '../middleware/asyncHandler.js';
import AuthService from '../../domain/services/AuthService.js';


const auth = new AuthService();

export const login = asyncH(async (req, res) => {
  const { username, password } = req.body;
  const meta = { ip: req.ip, ua: req.headers['user-agent']?.slice(0, 180) };
  const data = await auth.login(username, password, meta);
  res.json(data);
});

export const me = (req, res) => {
  res.json({ user: req.user });
};
