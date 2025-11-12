import jwt from 'jsonwebtoken';export function makeQrToken(pid){return jwt.sign({pid},process.env.JWT_SECRET,{expiresIn:'180d'});}
