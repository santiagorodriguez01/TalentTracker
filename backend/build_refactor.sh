#!/usr/bin/env bash
set -euo pipefail

ROOT="lujan-backend-refactor"
rm -rf "$ROOT" lujan-backend-refactor.zip
mkdir -p "$ROOT"

w() { # write text file: w path <<'EOF' ... EOF
  local p="$1"; shift
  mkdir -p "$(dirname "$ROOT/$p")"
  cat > "$ROOT/$p"
}

wb64() { # write base64 file
  local p="$1"; local b64="$2"
  mkdir -p "$(dirname "$ROOT/$p")"
  printf "%s" "$b64" | base64 -d > "$ROOT/$p"
}

# ---------- package.json ----------
w package.json <<'EOF'
{
  "name": "lujan-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": { "dev": "NODE_ENV=development node --watch src/index.js", "start": "node src/index.js" },
  "dependencies": {
    "bcryptjs": "^2.4.3", "cors": "^2.8.5", "express": "^4.19.2",
    "express-rate-limit": "^7.3.0", "express-validator": "^7.2.0",
    "jsonwebtoken": "^9.0.2", "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1", "mysql2": "^3.9.7", "pdfkit": "^0.15.0", "qrcode": "^1.5.4"
  },
  "optionalDependencies": { "sharp": "^0.33.4" }
}
EOF

# ---------- .env.example ----------
w .env.example <<'EOF'
NODE_ENV=development
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=15m
DB_HOST=localhost
DB_PORT=3306
DB_USER=club
DB_PASSWORD=cambiar_ahora
DB_DATABASE=club_lujan
BRAND_NAME=CLUB DEPORTIVO LUJÁN
BRAND_PRIMARY=#0057B7
BRAND_SECONDARY=#FFD000
BRAND_TEXT=#111111
BRANDING_LOGO_PATH=/app/assets/escudo.png
# FONT_REGULAR_PATH=
# FONT_BOLD_PATH=
EOF

# ---------- src/setup / server / entry ----------
w src/index.js <<'EOF'
import './setup/env.js';
import app from './server/app.js';
const PORT=process.env.PORT||3000;app.listen(PORT,()=>console.log(`[INFO] API escuchando en :${PORT}`));
EOF

w src/setup/env.js <<'EOF'
import fs from 'fs'; import path from 'path'; import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../'); const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  const txt = fs.readFileSync(envFile, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
EOF

w src/server/app.js <<'EOF'
import express from 'express'; import cors from 'cors'; import morgan from 'morgan';
import routes from '../web/routes.js'; import errorHandler from '../web/middleware/error.js';
const app=express(); app.use(cors()); app.use(express.json({limit:'10mb'})); app.use(morgan('dev'));
app.use('/files', express.static('/app/uploads', { maxAge: '1d' }));
app.use(routes); app.use(errorHandler); export default app;
EOF

# ---------- DB (Singleton) ----------
w src/db/connection.js <<'EOF'
import mysql from 'mysql2/promise';
class DB{static #i; #p; constructor(){this.#p=mysql.createPool({host:process.env.DB_HOST,port:+(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE,connectionLimit:10,namedPlaceholders:true,timezone:'Z'});} static getInstance(){if(!DB.#i) DB.#i=new DB();return DB.#i;} get pool(){return this.#p;} async query(sql,params=[]){const [rows]=await this.#p.execute(sql,params);return rows;} async getConnection(){return this.#p.getConnection();}}
const db=DB.getInstance(); export const query=(s,p)=>db.query(s,p); export const getConnection=()=>db.getConnection(); export default db;
EOF

# ---------- Middleware ----------
w src/web/middleware/asyncHandler.js <<'EOF'
export default (fn)=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
EOF

w src/web/middleware/error.js <<'EOF'
export default function(err,req,res,_){console.error('[ERR]',err);if(res.headersSent)return;const c=err.status||err.code||500;const m=err.message||'Error interno';res.status((c>=100&&c<600)?c:500).json({error:{message:m,status:c}});}
EOF

w src/web/middleware/validate.js <<'EOF'
import {validationResult} from 'express-validator';export default function(req,res,next){const e=validationResult(req);if(!e.isEmpty())return res.status(400).json({error:{message:'Datos inválidos',details:e.array()}});next();}
EOF

w src/web/middleware/rateLimiters.js <<'EOF'
import rateLimit from 'express-rate-limit';export const loginLimiter=rateLimit({windowMs:900000,max:10,standardHeaders:true,legacyHeaders:false});
EOF

w src/web/middleware/authRequired.js <<'EOF'
import jwt from 'jsonwebtoken';
export default function(roles=[]){return (req,res,next)=>{const h=req.headers.authorization||'';const m=h.match(/^Bearer\s+(.+)/i);if(!m)return res.status(401).json({error:{message:'No autorizado'}});try{const p=jwt.verify(m[1],process.env.JWT_SECRET);req.user=p;if(roles.length&&!roles.includes(p.rol_sistema))return res.status(403).json({error:{message:'Sin permisos'}});next();}catch{return res.status(401).json({error:{message:'Token inválido/expirado'}})}}}
EOF

w src/web/middleware/authOrQrToken.js <<'EOF'
import jwt from 'jsonwebtoken'; import authRequired from './authRequired.js';
export default function(roles=[]){const mw=authRequired(roles);return (req,res,next)=>{if(req.headers.authorization)return mw(req,res,next);const t=req.query.token||req.query.bearer;if(!t)return res.status(401).json({error:{message:'No autorizado'}});try{const p=jwt.verify(t,process.env.JWT_SECRET);if(String(p.pid)!==String(req.params.id))return res.status(403).json({error:{message:'Token no corresponde a la persona'}});req.user={id:0,rol_sistema:'PUBLIC_QR'};next();}catch{return res.status(401).json({error:{message:'Token inválido/expirado'}})}}}
EOF

w src/web/middleware/validators.js <<'EOF'
import { body, query as qv } from 'express-validator';
export const vLogin=[body('username').isString().notEmpty(),body('password').isString().notEmpty()];
export const vPersonaCreate=[body('nombre').isString().notEmpty(),body('apellido').isString().notEmpty(),body('dni').isString().notEmpty(),body('rol').isIn(['SOCIO','ALUMNO','JUGADOR','PERSONAL','COORDINADOR','DIRECTIVO'])];
export const vPersonaUpdate=[body('email').optional().isEmail()];
export const vCuotasEmitir=[body('periodo').matches(/^\d{4}-\d{2}$/),body('importe').isFloat({gt:0}),body('vencimiento').isISO8601(),body('socio_ids').optional().isArray({min:1})];
export const vCuotaPagar=[body('monto').optional().isFloat({gt:0}),body('medio_pago').optional().isString()];
export const vCajaAlta=[body('concepto').isString().notEmpty(),body('tipo').isIn(['INGRESO','EGRESO']),body('monto').isFloat({gt:0}),body('medio_pago').optional().isString(),body('fecha').optional().isISO8601()];
export const vCajaReporte=[qv('desde').isISO8601(),qv('hasta').isISO8601()];
export const vCajaReporteCSV=[qv('desde').isISO8601(),qv('hasta').isISO8601()];
EOF

# ---------- Utils ----------
w src/domain/utils/audit.js <<'EOF'
import {query} from '../../db/connection.js';export async function audit(userId,a,e,id,meta){try{await query('INSERT INTO auditoria (fecha, user_id, accion, entidad, entidad_id, meta) VALUES (NOW(), ?, ?, ?, ?, ?)',[userId||null,a||'',e||'',id||null,meta?JSON.stringify(meta).slice(0,4000):null]);}catch(e){if(process.env.NODE_ENV!=='test')console.warn('[AUDIT warn]',e.code||e.message);}}
EOF

w src/domain/utils/uploads.js <<'EOF'
import multer from 'multer'; import fs from 'fs/promises'; import path from 'path';
export async function ensureDir(dir){await fs.mkdir(dir,{recursive:true});}
const storage=multer.diskStorage({
  destination: async (req, file, cb)=>{const id=String(req.params.id||'tmp');const dir=path.join('/app/uploads','personas',id);await ensureDir(dir);cb(null,dir);},
  filename: (_req,file,cb)=>{const ext=(file.originalname||'').split('.').pop()||'bin';cb(null,'upload_'+Date.now()+'.'+ext);}
});
export const uploadImage=multer({storage});
EOF

w src/domain/utils/pdf.js <<'EOF'
export const BRAND={name:process.env.BRAND_NAME||'CLUB DEPORTIVO LUJÁN',c1:process.env.BRAND_PRIMARY||'#0057B7',c2:process.env.BRAND_SECONDARY||'#FFD000',text:process.env.BRAND_TEXT||'#111111',logoPath:process.env.BRANDING_LOGO_PATH||'/app/assets/escudo.png',fontReg:process.env.FONT_REGULAR_PATH||null,fontBold:process.env.FONT_BOLD_PATH||null,baseURL:process.env.PUBLIC_BASE_URL||'http://localhost:3000'};
export const mm=(n)=>(n*72)/25.4;
export function getFonts(doc){const f={regular:'Helvetica',bold:'Helvetica-Bold'};try{if(BRAND.fontReg){doc.registerFont('reg',BRAND.fontReg);f.regular='reg';}}catch{}try{if(BRAND.fontBold){doc.registerFont('bold',BRAND.fontBold);f.bold='bold';}}catch{}return f;}
EOF

# ---------- Repositories (Factory Method) ----------
w src/domain/repositories/RepositoryFactory.js <<'EOF'
import PersonaRepository from './PersonaRepository.js';import UsuarioRepository from './UsuarioRepository.js';import CuotaRepository from './CuotaRepository.js';import CajaRepository from './CajaRepository.js';export default class RepositoryFactory{static persona(){return new PersonaRepository()}static usuario(){return new UsuarioRepository()}static cuota(){return new CuotaRepository()}static caja(){return new CajaRepository()}}
EOF

w src/domain/repositories/PersonaRepository.js <<'EOF'
import { query } from '../../db/connection.js';
export default class PersonaRepository{
  async list({rol,estado,q,page=1,size=20}){const off=(+page-1)*+size;const w=[];const p=[];if(rol){w.push('rol = ?');p.push(rol);}if(estado){w.push('estado = ?');p.push(estado);}if(q){w.push('(nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?)');p.push(`%${q}%`,`%${q}%`,`%${q}%`);}const sql=`SELECT * FROM persona ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY id DESC LIMIT ? OFFSET ?`;p.push(+size,off);return query(sql,p);}
  async getById(id){const r=await query('SELECT * FROM persona WHERE id=?',[id]);return r[0]||null;}
  async insert(d){const k=['nombre','apellido','dni','fecha_nac','email','telefono','domicilio','foto','rol'];const v=k.map(k2=>d[k2]??null);const sql=`INSERT INTO persona (${k.join(',')}) VALUES (?,?,?,?,?,?,?,?,?)`;return query(sql,v);}
  async update(id,d){const f=['nombre','apellido','dni','fecha_nac','email','telefono','domicilio','foto','rol','estado'];const sets=[];const p=[];for(const x of f) if(x in d){sets.push(`${x}=?`);p.push(d[x]);}if(!sets.length)return 0;p.push(id);await query(`UPDATE persona SET ${sets.join(', ')} WHERE id = ?`,p);return 1;}
  async softDelete(id){await query('UPDATE persona SET estado="INACTIVO" WHERE id=?',[id]);}
}
EOF

w src/domain/repositories/UsuarioRepository.js <<'EOF'
import {query} from '../../db/connection.js';export default class UsuarioRepository{async getByUsername(u){const r=await query('SELECT * FROM usuario WHERE username = ?',[u]);return r[0]||null;}}
EOF

w src/domain/repositories/CuotaRepository.js <<'EOF'
import { query } from '../../db/connection.js';
export default class CuotaRepository{
  async list({estado,socio_id,periodo,page=1,size=20}){const off=(+page-1)*+size;const w=[];const p=[];if(estado){w.push('c.estado = ?');p.push(estado);}if(socio_id){w.push('c.socio_id = ?');p.push(+socio_id);}if(periodo){w.push('c.periodo = ?');p.push(periodo);}const sql=`SELECT c.*, s.nro_socio, p.nombre, p.apellido FROM cuota c JOIN socio s ON s.id=c.socio_id JOIN persona p ON p.id=s.persona_id ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY c.vencimiento DESC, c.id DESC LIMIT ? OFFSET ?`;p.push(+size,off);return query(sql,p);}
}
EOF

w src/domain/repositories/CajaRepository.js <<'EOF'
import {query} from '../../db/connection.js';export default class CajaRepository{async report(d,h){const tot=await query('SELECT tipo, SUM(monto) AS total FROM caja WHERE fecha BETWEEN ? AND ? GROUP BY tipo',[d,h]);const mov=await query('SELECT id, fecha, concepto, tipo, monto, medio_pago, responsable_id FROM caja WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC, id DESC',[d,h]);return {totales:tot,movimientos:mov};}}
EOF

# ---------- Services ----------
w src/domain/services/AuthService.js <<'EOF'
import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';import RepositoryFactory from '../repositories/RepositoryFactory.js';import {audit} from '../utils/audit.js';export default class AuthService{#users=RepositoryFactory.usuario();async login(username,password,meta){const u=await this.#users.getByUsername(username);if(!u)throw Object.assign(new Error('Usuario o contraseña inválidos'),{status:401});const ok=await bcrypt.compare(password,u.password_hash||'');if(!ok)throw Object.assign(new Error('Usuario o contraseña inválidos'),{status:401});const token=jwt.sign({id:u.id,username:u.username,rol_sistema:u.rol_sistema},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'15m'});await audit(u.id,'LOGIN','usuario',u.id,meta);return {token,user:{id:u.id,username:u.username,rol_sistema:u.rol_sistema}};}}
EOF

w src/domain/services/QRService.js <<'EOF'
import jwt from 'jsonwebtoken';export function makeQrToken(pid){return jwt.sign({pid},process.env.JWT_SECRET,{expiresIn:'180d'});}
EOF

w src/domain/services/ImageService.js <<'EOF'
import fs from 'fs/promises'; import path from 'path'; import { ensureDir } from '../utils/uploads.js';
export async function loadImageBuffer(src){if(!src)return null;try{if(/^https?:\/\//i.test(src)){const r=await fetch(src);if(!r.ok)return null;return Buffer.from(await r.arrayBuffer());}if(src.startsWith('/files/')){src=path.join('/app/uploads',src.replace(/^\/files\//,''));}return await fs.readFile(src);}catch{return null;}}
export async function saveWithSharp(srcPath,outDir){let sharp;try{sharp=(await import('sharp')).default;}catch{sharp=null;}await ensureDir(outDir);if(!sharp){await fs.copyFile(srcPath,path.join(outDir,'foto_600.jpg'));await fs.copyFile(srcPath,path.join(outDir,'thumb_200.jpg'));return;}await sharp(srcPath).rotate().resize(600,600,{fit:'cover'}).jpeg({quality:85}).toFile(path.join(outDir,'foto_600.jpg'));await sharp(srcPath).rotate().resize(200,200,{fit:'cover'}).jpeg({quality:80}).toFile(path.join(outDir,'thumb_200.jpg'));}
EOF

w src/domain/services/GafeteService.js <<'EOF'
import PDFDocument from 'pdfkit'; import QRCode from 'qrcode'; import {BRAND,mm,getFonts} from '../utils/pdf.js'; import {loadImageBuffer} from './ImageService.js'; import {makeQrToken} from './QRService.js'; import {query} from '../../db/connection.js';
async function getPersonalRow(id){const rows=await query(`SELECT p.id, p.nombre, p.apellido, p.dni, p.foto, p.rol, p.estado, pc.legajo, pc.cargo, pc.area FROM persona p LEFT JOIN personal_cred pc ON pc.persona_id = p.id WHERE p.id = ?`,[id]);return rows[0]||null;}
export async function drawGafete(doc,p,x,y,W,H,fonts){const PAD=mm(6),R=mm(4),headerH=mm(18),bandH=mm(6),gap=mm(4);doc.save();doc.roundedRect(x+mm(2),y+mm(2),W-mm(4),H-mm(4),R).lineWidth(1.5).strokeColor(BRAND.c1).stroke();doc.roundedRect(x+PAD,y+PAD,W-PAD*2,H-PAD*2,R-mm(1)).fillColor('#FFFFFF').fill();doc.save().rect(x+PAD,y+PAD,W-PAD*2,headerH).fillColor(BRAND.c1).fill().restore();doc.fillColor('#fff').font(fonts.bold).fontSize(11).text(BRAND.name,x+PAD,y+PAD+mm(3),{width:W-PAD*2,align:'center'});const qrSize=mm(28),qx=x+W-PAD-qrSize,qy=y+H-PAD-bandH-qrSize;const token=makeQrToken(p.id);const url=`${BRAND.baseURL}/qr/${token}`;const qrPng=await QRCode.toBuffer(url,{type:'png',margin:0,scale:4});doc.image(qrPng,qx,qy,{width:qrSize,height:qrSize});doc.font(fonts.regular).fontSize(7).fillColor('#444').text('Validar',qx-mm(2),qy+qrSize+mm(1),{width:qrSize+mm(4),align:'center'});const fotoMaxH=(qy-gap)-(y+PAD+headerH+gap);const fotoW=mm(38),fotoH=Math.min(mm(48),fotoMaxH),fotoX=x+PAD+mm(2),fotoY=y+PAD+headerH+gap;const fotoBuf=await loadImageBuffer(p.foto);if(fotoBuf){doc.save();doc.roundedRect(fotoX,fotoY,fotoW,fotoH,mm(3)).clip();doc.image(fotoBuf,fotoX,fotoY,{fit:[fotoW,fotoH],align:'center',valign:'center'});doc.restore();doc.roundedRect(fotoX,fotoY,fotoW,fotoH,mm(3)).lineWidth(.8).strokeColor('#666').stroke();}const tx=fotoX+fotoW+mm(6),ty0=y+PAD+headerH+mm(3),textWidth=Math.max(mm(20),(qx-mm(4))-tx);doc.fillColor(BRAND.text).font(fonts.bold).fontSize(12).text(`${p.apellido}, ${p.nombre}`,tx,ty0,{width:textWidth,lineBreak:true});let ty=doc.y+mm(2);const safe=(v,d='—')=>(v==null||v===''?d:v);doc.font(fonts.regular).fontSize(9);if(p.area){doc.text(`Área: ${safe(p.area)}`,tx,ty,{width:textWidth});ty=doc.y;}if(p.cargo){doc.text(`Cargo: ${safe(p.cargo)}`,tx,ty,{width:textWidth});ty=doc.y;}if(p.legajo){doc.text(`Legajo: ${safe(p.legajo)}`,tx,ty,{width:textWidth});ty=doc.y;}doc.save().rect(x+PAD,y+H-PAD-mm(6),W-PAD*2,mm(6)).fillColor(BRAND.c2).fill().restore();doc.restore();}
export async function oneGafete(res,id){const p=await getPersonalRow(+id);if(!p)return res.status(404).json({error:{message:'Persona no encontrada'}});const W=mm(85.6),H=mm(54.0);res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="gafete_${p.id}.pdf"`);const doc=new PDFDocument({size:[W,H],margin:0});doc.on('error',(e)=>{console.error('[PDF gafete]',e);try{res.end();}catch{}});doc.pipe(res);const fonts=getFonts(doc);await drawGafete(doc,p,0,0,W,H,fonts);doc.end();}
export async function gridGafetes(res,ids,paper='A4',cols=2,rows=3){const margin=mm(10),size=paper==='A4'?[595.28,841.89]:[612,792],[PW,PH]=size,gridW=PW-margin*2,gridH=PH-margin*2,cellW=gridW/cols,cellH=gridH/rows;res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="gafetes_${ids.length}.pdf"`);const doc=new PDFDocument({size,margin:0});doc.on('error',(e)=>{console.error('[PDF gafetes]',e);try{res.end();}catch{}});doc.pipe(res);const fonts=getFonts(doc);let i=0;while(i<ids.length){for(let r=0;r<rows&&i<ids.length;r++){for(let c=0;c<cols&&i<ids.length;c++,i++){const rr=await query(`SELECT p.id, p.nombre, p.apellido, p.dni, p.foto, p.rol, p.estado, pc.legajo, pc.cargo, pc.area FROM persona p LEFT JOIN personal_cred pc ON pc.persona_id = p.id WHERE p.id = ?`,[ids[i]]);const p=rr[0];if(!p)continue;const x=margin+c*cellW+mm(2),y=margin+r*cellH+mm(2);await drawGafete(doc,p,x,y,cellW-mm(4),cellH-mm(4),fonts);}}if(i<ids.length)doc.addPage({size,margin:0});}doc.end();}
EOF

w src/domain/services/CarnetService.js <<'EOF'
import PDFDocument from 'pdfkit'; import QRCode from 'qrcode'; import {BRAND,getFonts} from '../utils/pdf.js'; import {loadImageBuffer} from './ImageService.js';
export async function carnetPdf(res,p,token){const url=`${BRAND.baseURL}/qr/${token}/view`;const qrPng=await QRCode.toBuffer(url,{type:'png',margin:0,scale:6});const logoBuf=await loadImageBuffer(BRAND.logoPath);const fotoBuf=await loadImageBuffer(p.foto);const W=350,H=220;const doc=new PDFDocument({size:[W,H],margin:0});doc.on('error',(e)=>{console.error('[PDF carnet]',e);try{res.end();}catch{}});res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="carnet_${p.id}.pdf"`);doc.pipe(res);const fonts=getFonts(doc);doc.save().rect(0,0,W,H).fill('#FFFFFF').restore();doc.roundedRect(6,6,W-12,H-12,12).lineWidth(2).strokeColor(BRAND.c1).stroke();doc.save().rect(12,14,W-24,28).fillColor(BRAND.c1).fill().restore();doc.fillColor('#FFFFFF').font(fonts.bold).fontSize(16).text(BRAND.name,12,18,{width:W-24,align:'center'});doc.moveTo(12,48).lineTo(W-12,48).lineWidth(1).strokeColor(BRAND.c1).stroke();if(logoBuf)doc.image(logoBuf,16,56,{width:40,height:40});const fotoX=16,fotoY=104,fotoW=90,fotoH=90;if(fotoBuf){doc.save();doc.roundedRect(fotoX,fotoY,fotoW,fotoH,8).clip();doc.image(fotoBuf,fotoX,fotoY,{fit:[fotoW,fotoH],align:'center',valign:'center'});doc.restore();doc.roundedRect(fotoX,fotoY,fotoW,fotoH,8).lineWidth(1).strokeColor('#444').stroke();}else{doc.roundedRect(fotoX,fotoY,fotoW,fotoH,8).lineWidth(1).strokeColor('#999').stroke();doc.font(fonts.regular).fillColor('#777').fontSize(9).text('Foto no disponible',fotoX,fotoY+42,{width:fotoW,align:'center'});}const tx=116,ty=60,tw=180;doc.fillColor(BRAND.text);doc.font(fonts.bold).fontSize(16).text(`Apellido, Nombre: ${p.apellido}, ${p.nombre}`,tx,ty,{width:tw,lineBreak:true});let yPos=doc.y+6;doc.font(fonts.regular).fontSize(12);doc.text(`DNI: ${p.dni||'-'}`,tx,yPos);yPos=doc.y+4;doc.text(`Rol: ${p.rol}`,tx,yPos);yPos=doc.y+4;doc.text(`Estado: ${p.estado}`,tx,yPos);yPos=doc.y+4;doc.text(`N° Socio: ${p.nro_socio||'-'}`,tx,yPos);const qrSize=100;doc.image(qrPng,W-qrSize-16,70,{width:qrSize});doc.font(fonts.regular).fontSize(9).fillColor('#333').text('Escanear para validar',W-qrSize-26,70+qrSize+6,{width:qrSize+20,align:'center'});doc.save().rect(12,H-22,W-24,6).fillColor(BRAND.c2).fill().restore();doc.end();}
EOF

# ---------- Controllers ----------
w src/web/controllers/HealthController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import {query} from '../../db/connection.js';export const health=asyncH(async(_req,res)=>{const x=await query('SELECT 1 AS ok');res.json({ok:x[0].ok===1});});
EOF

w src/web/controllers/AuthController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import AuthService from '../../domain/services/AuthService.js';const auth=new AuthService();export const login=asyncH(async(req,res)=>{const {username,password}=req.body;const meta={ip:req.ip,ua:req.headers['user-agent']?.slice(0,180)};const data=await auth.login(username,password,meta);res.json(data);});
EOF

w src/web/controllers/PersonasController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import RepositoryFactory from '../../domain/repositories/RepositoryFactory.js';import {getConnection,query} from '../../db/connection.js';import {audit} from '../../domain/utils/audit.js';
const personas=RepositoryFactory.persona();
export const list=asyncH(async(req,res)=>{const data=await personas.list(req.query);res.json({data});});
export const create=asyncH(async(req,res)=>{const {nombre,apellido,dni,fecha_nac,email,telefono,domicilio,foto,rol}=req.body;const conn=await getConnection();try{const [ins]=await conn.execute('INSERT INTO persona (nombre, apellido, dni, fecha_nac, email, telefono, domicilio, foto, rol) VALUES (?,?,?,?,?,?,?,?,?)',[nombre,apellido,dni,fecha_nac||null,email||null,telefono||null,domicilio||null,foto||null,rol]);await audit(req.user?.id,'CREAR','persona',ins.insertId,{nombre,apellido,dni,rol});res.status(201).json({message:'Persona creada',id:ins.insertId});}catch(e){if(e.code==='ER_DUP_ENTRY')return res.status(409).json({error:{message:'DNI ya registrado'}});throw e;}finally{conn.release();}});
export const update=asyncH(async(req,res)=>{const {id}=req.params;const fields=['nombre','apellido','dni','fecha_nac','email','telefono','domicilio','foto','rol','estado'];const sets=[];const params=[];for(const f of fields) if(f in req.body){sets.push(`${f}=?`);params.push(req.body[f]);}if(!sets.length)return res.status(400).json({error:{message:'Nada para actualizar'}});params.push(id);await query(`UPDATE persona SET ${sets.join(', ')} WHERE id = ?`,params);await audit(req.user?.id,'ACTUALIZAR','persona',+id,{cambiado:Object.keys(req.body)});res.json({message:'Persona actualizada'});});
export const softDelete=asyncH(async(req,res)=>{await personas.softDelete(req.params.id);await audit(req.user?.id,'BAJA_LOGICA','persona',+req.params.id,null);res.json({message:'Persona dada de baja'});});
EOF

w src/web/controllers/FotosController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import path from 'path';import {ensureDir} from '../../domain/utils/uploads.js';import {saveWithSharp} from '../../domain/services/ImageService.js';import {query} from '../../db/connection.js';import {audit} from '../../domain/utils/audit.js';
export const uploadMultipart=asyncH(async(req,res)=>{const id=+req.params.id;const dir=path.join('/app/uploads','personas',String(id));await saveWithSharp(req.file.path,dir);const publicPath=`/files/personas/${id}/foto_600.jpg`;await query('UPDATE persona SET foto=? WHERE id=?',[publicPath,id]);await audit(req.user?.id,'FOTO_SUBIR','persona',id,{via:'multipart'});res.status(201).json({ok:true,url:publicPath});});
export const uploadDataUrl=asyncH(async(req,res)=>{const id=+req.params.id;const {dataUrl}=req.body||{};if(!dataUrl||!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl))return res.status(400).json({error:{message:'dataUrl inválido'}});const b64=dataUrl.split(',')[1];const buf=Buffer.from(b64,'base64');const dir=path.join('/app/uploads','personas',String(id));await ensureDir(dir);const tmp=path.join(dir,'from_dataurl.bin');await (await import('fs/promises')).writeFile(tmp,buf);await saveWithSharp(tmp,dir);const publicPath=`/files/personas/${id}/foto_600.jpg`;await query('UPDATE persona SET foto=? WHERE id=?',[publicPath,id]);await audit(req.user?.id,'FOTO_SUBIR','persona',id,{via:'dataurl',bytes:buf.length});res.status(201).json({ok:true,url:publicPath});});
export const remove=asyncH(async(req,res)=>{const id=+req.params.id;await query('UPDATE persona SET foto=NULL WHERE id=?',[id]);await audit(req.user?.id,'FOTO_BORRAR','persona',id,null);res.json({ok:true});});
EOF

w src/web/controllers/QRController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import jwt from 'jsonwebtoken';import QRCode from 'qrcode';import {query} from '../../db/connection.js';import {makeQrToken} from '../../domain/services/QRService.js';
const baseURL=process.env.PUBLIC_BASE_URL||'http://localhost:3000';
export const issueForPersona=asyncH(async(req,res)=>{const id=+req.params.id;const token=makeQrToken(id);res.json({url:`${baseURL}/qr/${token}`,view:`${baseURL}/qr/${token}/view`,token});});
export const consumeTokenJSON=asyncH(async(req,res)=>{try{const payload=jwt.verify(req.params.token,process.env.JWT_SECRET);const rows=await query('SELECT p.id, p.nombre, p.apellido, p.rol, p.estado, s.nro_socio FROM persona p LEFT JOIN socio s ON s.persona_id = p.id WHERE p.id = ?',[payload.pid]);if(!rows.length)return res.status(404).json({ok:false,error:'No encontrado'});const p=rows[0];res.json({ok:true,persona:{id:p.id,nombre:p.nombre,apellido:p.apellido,rol:p.rol,estado:p.estado,nro_socio:p.nro_socio||null}});}catch{return res.status(400).json({ok:false,error:'QR inválido/expirado'});}});
export const viewHTML=asyncH(async(req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');const C1=process.env.BRAND_PRIMARY||'#0057B7';const C2=process.env.BRAND_SECONDARY||'#FFD000';const BRAND_NAME=process.env.BRAND_NAME||'CLUB DEPORTIVO LUJÁN';let persona=null,payload=null,error=null;try{payload=jwt.verify(req.params.token,process.env.JWT_SECRET);const rows=await query('SELECT p.id, p.nombre, p.apellido, p.rol, p.estado, p.foto, p.dni, s.nro_socio FROM persona p LEFT JOIN socio s ON s.persona_id = p.id WHERE p.id = ?',[payload.pid]);if(!rows.length)error='No encontrado';else persona=rows[0];}catch{error='QR inválido o expirado';}const img=(u)=>!u?'':(/^https?:\/\//i.test(u)?u:(baseURL+u));const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carnet digital</title><style>:root{--c1:${C1};--c2:${C2};--ok:#0a7d33;--bad:#c62828;--txt:#111}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,Noto Sans,Helvetica Neue,sans-serif;background:#f6f7fb;color:var(--txt)}.wrap{max-width:720px;margin:0 auto;padding:16px}.card{background:#fff;border-radius:16px;box-shadow:0 4px 18px rgba(0,0,0,.06);overflow:hidden}.bar{background:var(--c1);color:#fff;padding:16px;text-align:center;font-weight:700;letter-spacing:.5px}.content{display:grid;grid-template-columns:140px 1fr;gap:16px;padding:16px}.avatar{width:140px;height:140px;border-radius:12px;object-fit:cover;background:#e9edf3}.row{margin:.3rem 0;font-size:15px}.name{font-weight:800;font-size:22px;margin:.2rem 0 .6rem}.status{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:#eef7f0;color:var(--ok);font-weight:600}.dot{width:8px;height:8px;border-radius:50%;background:var(--ok)}.bad .status{background:#fdeeee;color:var(--bad)}.bad .dot{background:var(--bad)}.qr{margin:12px auto 4px;width:180px;height:180px;display:block}.hint{text-align:center;color:#555;font-size:13px;margin-bottom:12px}.footer{background:var(--c2);height:8px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.btn{background:var(--c1);color:#fff;padding:8px 12px;border-radius:10px;text-decoration:none;font-weight:600}@media (max-width:640px){.content{grid-template-columns:1fr;text-align:center}.avatar{margin:0 auto}}</style></head><body><div class="wrap"><div class="card ${(!persona||persona.estado!=='ACTIVO')?'bad':''}"><div class="bar">${BRAND_NAME}</div><div class="content"><img class="avatar" src="${img(persona?.foto)||''}" alt="foto" onerror="this.style.opacity=.15;this.alt='sin foto'"><div><div class="name">${persona?(persona.apellido+', '+persona.nombre):'—'}</div><div class="row"><b>DNI:</b> ${persona?(persona.dni||'—'):'—'}</div><div class="row"><b>Rol:</b> ${persona?persona.rol:'—'}</div><div class="row"><b>Estado:</b><span class="status"><span class="dot"></span>${persona?persona.estado:'—'}</span></div><div class="row"><b>N° Socio:</b> ${persona?(persona.nro_socio||'—'):'—'}</div>${persona?`<div class="actions"><a class="btn" href="${baseURL}/carnet/${req.params.token}.pdf" target="_blank" rel="noopener">Descargar PDF</a></div>`:''}</div></div><img class="qr" alt="QR" src="data:image/png;base64,${await (async()=>{const url=baseURL+'/qr/'+(req.params.token);const b64=(await QRCode.toDataURL(url,{margin:0,scale:6})).replace(/^data:image\/png;base64,/,'');return b64;})()}"><div class="hint">Escaneado: ${new Date().toLocaleString('es-AR')} · ${payload?('expira: '+new Date(payload.exp*1000).toLocaleDateString('es-AR')):''}</div><div class="footer"></div></div></div></body></html>`;res.send(html);});
EOF

w src/web/controllers/CarnetController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import jwt from 'jsonwebtoken';import {query} from '../../db/connection.js';import {carnetPdf} from '../../domain/services/CarnetService.js';import {makeQrToken} from '../../domain/services/QRService.js';
export const byPersona=asyncH(async(req,res)=>{const id=+req.params.id;const rows=await query('SELECT p.id, p.nombre, p.apellido, p.dni, p.rol, p.estado, p.foto, s.nro_socio FROM persona p LEFT JOIN socio s ON s.persona_id = p.id WHERE p.id = ?',[id]);if(!rows.length)return res.status(404).json({error:{message:'Persona no encontrada'}});const p=rows[0];const token=makeQrToken(id);await carnetPdf(res,p,token);});
export const byToken=asyncH(async(req,res)=>{let pid;try{const payload=jwt.verify(req.params.token,process.env.JWT_SECRET);pid=payload.pid;}catch{return res.status(400).send('Token inválido o expirado');}const rows=await query('SELECT p.id, p.nombre, p.apellido, p.dni, p.rol, p.estado, p.foto, s.nro_socio FROM persona p LEFT JOIN socio s ON s.persona_id = p.id WHERE p.id = ?',[pid]);if(!rows.length)return res.status(404).send('Persona no encontrada');await carnetPdf(res,rows[0],req.params.token);});
EOF

w src/web/controllers/GafeteController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import {oneGafete,gridGafetes} from '../../domain/services/GafeteService.js';export const one=asyncH(async(req,res)=>{await oneGafete(res,req.params.id);});export const grid=asyncH(async(req,res)=>{const ids=String(req.query.ids||'').split(',').map(s=>s.trim()).filter(Boolean).map(n=>+n).filter(n=>!Number.isNaN(n));if(!ids.length)return res.status(400).json({error:{message:'Parámetro ids requerido'}});const paper=(req.query.paper||'A4').toUpperCase();const cols=Math.max(1,+(req.query.cols||2));const rows=Math.max(1,+(req.query.rows||3));await gridGafetes(res,ids,paper,cols,rows);});
EOF

w src/web/controllers/CuotasController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import RepositoryFactory from '../../domain/repositories/RepositoryFactory.js';import {query,getConnection} from '../../db/connection.js';import PDFDocument from 'pdfkit';
const cuotasRepo=RepositoryFactory.cuota();
export const list=asyncH(async(req,res)=>{const data=await cuotasRepo.list(req.query);res.json({data});});
export const emitir=asyncH(async(req,res)=>{const {periodo,importe,vencimiento,socio_ids}=req.body;let socios=[];if(Array.isArray(socio_ids)&&socio_ids.length){const ph=socio_ids.map(()=>'?').join(',');socios=await query(`SELECT id FROM socio WHERE id IN (${ph})`,socio_ids);}else{socios=await query(`SELECT s.id FROM socio s JOIN persona p ON p.id=s.persona_id WHERE p.estado='ACTIVO'`);}if(!socios.length)return res.status(400).json({error:{message:'No hay socios para emitir'}});const conn=await getConnection();let inserted=0;try{await conn.beginTransaction();for(const row of socios){const [resIns]=await conn.execute('INSERT IGNORE INTO cuota (socio_id, periodo, importe, vencimiento, estado) VALUES (?,?,?,?, "EMITIDA")',[row.id,periodo,importe,vencimiento]);inserted+=resIns.affectedRows||0;}await conn.commit();}catch(e){await conn.rollback();throw e;}finally{conn.release();}res.status(201).json({message:'Cuotas emitidas',solicitados:socios.length,insertados:inserted});});
export const pagar=asyncH(async(req,res)=>{const {id}=req.params;const {monto,medio_pago}=req.body;const rows=await query('SELECT id, socio_id, periodo, importe, estado FROM cuota WHERE id = ?',[id]);if(!rows.length)return res.status(404).json({error:{message:'Cuota no encontrada'}});const c=rows[0];if(c.estado==='PAGADA')return res.status(409).json({error:{message:'La cuota ya está pagada'}});if(monto&&+monto!==+c.importe)return res.status(400).json({error:{message:`El monto debe ser ${c.importe}`}});const u=await query('SELECT persona_id FROM usuario WHERE id = ?',[req.user.id]);const responsableId=u[0]?.persona_id||null;const conn=await getConnection();try{await conn.beginTransaction();await conn.execute('UPDATE cuota SET estado = "PAGADA" WHERE id = ?',[id]);const concepto=`Pago cuota ${c.periodo} socio_id ${c.socio_id}`;await conn.execute('INSERT INTO caja (fecha, concepto, tipo, monto, medio_pago, responsable_id) VALUES (NOW(), ?, "INGRESO", ?, ?, ?)',[concepto,c.importe,medio_pago||null,responsableId]);await conn.commit();}catch(e){await conn.rollback();throw e;}finally{conn.release();}res.json({message:'Pago registrado',cuota_id:c.id,importe:c.importe});});
export const comprobantePdf=asyncH(async(req,res)=>{const {id}=req.params;const rows=await query('SELECT c.id, c.periodo, c.importe, c.estado, c.vencimiento, s.nro_socio, p.nombre, p.apellido, p.dni FROM cuota c JOIN socio s ON s.id=c.socio_id JOIN persona p ON p.id=s.persona_id WHERE c.id = ?',[id]);if(!rows.length)return res.status(404).json({error:{message:'Cuota no encontrada'}});const c=rows[0];res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="comprobante_${c.id}.pdf"`);const doc=new PDFDocument({margin:40});doc.pipe(res);doc.fontSize(16).text('Club Deportivo Luján',{align:'center'});doc.moveDown(.5);doc.fontSize(12).text('Comprobante de pago de cuota',{align:'center'});doc.moveDown();doc.fontSize(11);doc.text(`Nº Comprobante: ${c.id}`);doc.text(`Fecha: ${new Date().toLocaleString('es-AR')}`);doc.moveDown(.5);doc.text(`Socio: ${c.nro_socio} - ${c.apellido}, ${c.nombre}`);doc.text(`DNI: ${c.dni}`);doc.text(`Periodo: ${c.periodo}`);doc.text(`Importe: $${Number(c.importe).toFixed(2)}`);doc.text(`Estado: ${c.estado}`);doc.text(`Vencimiento: ${new Date(c.vencimiento).toISOString().slice(0,10)}`);doc.end();});
EOF

w src/web/controllers/CajaController.js <<'EOF'
import asyncH from '../middleware/asyncHandler.js';import {query} from '../../db/connection.js';
export const alta=asyncH(async(req,res)=>{const {fecha,concepto,tipo,monto,medio_pago}=req.body;const u=await query('SELECT persona_id FROM usuario WHERE id = ?',[req.user.id]);const responsableId=u[0]?.persona_id||null;const conn=await (await import('../../db/connection.js')).getConnection();let ins;try{const r=await conn.execute('INSERT INTO caja (fecha, concepto, tipo, monto, medio_pago, responsable_id) VALUES (?, ?, ?, ?, ?, ?)',[fecha||new Date(),concepto,tipo,monto,medio_pago||null,responsableId]);conn.release();ins=r[0];}catch(e){conn.release();throw e;}res.status(201).json({message:'Movimiento registrado',id:ins.insertId});});
export const reporte=asyncH(async(req,res)=>{const {desde,hasta}=req.query;const totales=await query('SELECT tipo, SUM(monto) AS total FROM caja WHERE fecha BETWEEN ? AND ? GROUP BY tipo',[desde,hasta]);const movimientos=await query('SELECT id, fecha, concepto, tipo, monto, medio_pago, responsable_id FROM caja WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC, id DESC',[desde,hasta]);res.json({totales,movimientos});});
export const reporteCSV=asyncH(async(req,res)=>{const {desde,hasta}=req.query;const movimientos=await query('SELECT id, fecha, concepto, tipo, monto, medio_pago, responsable_id FROM caja WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC, id DESC',[desde,hasta]);res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="reporte_caja_${desde}_a_${hasta}.csv"`);const header=['id','fecha','concepto','tipo','monto','medio_pago','responsable_id'];const escape=(v)=>{if(v==null)return'';const s=String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};const lines=[header.join(',')];for(const m of movimientos){const fechaISO=m.fecha instanceof Date?m.fecha.toISOString():new Date(m.fecha).toISOString();lines.push([m.id,fechaISO,m.concepto,m.tipo,m.monto,m.medio_pago??'',m.responsable_id??''].map(escape).join(','));}res.send(lines.join('\n'));});
EOF

# ---------- routes ----------
w src/web/routes.js <<'EOF'
import { Router } from 'express';
import { loginLimiter } from './middleware/rateLimiters.js';
import authRequired from './middleware/authRequired.js';
import authOrQrToken from './middleware/authOrQrToken.js';
import validate from './middleware/validate.js';
import { uploadImage } from '../domain/utils/uploads.js';

import * as Health from './controllers/HealthController.js';
import * as Auth from './controllers/AuthController.js';
import * as Personas from './controllers/PersonasController.js';
import * as Fotos from './controllers/FotosController.js';
import * as QR from './controllers/QRController.js';
import * as Carnet from './controllers/CarnetController.js';
import * as Gafete from './controllers/GafeteController.js';
import * as Cuotas from './controllers/CuotasController.js';
import * as Caja from './controllers/CajaController.js';

import { vLogin, vPersonaCreate, vPersonaUpdate, vCuotasEmitir, vCuotaPagar, vCajaAlta, vCajaReporte, vCajaReporteCSV } from './middleware/validators.js';

const r = Router();
r.get('/health', Health.health);
r.post('/auth/login', loginLimiter, vLogin, validate, Auth.login);

r.get('/personas', authRequired(['ADMIN','TESORERIA','COORDINADOR','DIRECTIVO','STAFF']), Personas.list);
r.post('/personas', authRequired(['ADMIN','TESORERIA']), vPersonaCreate, validate, Personas.create);
r.put('/personas/:id', authRequired(['ADMIN','TESORERIA']), vPersonaUpdate, validate, Personas.update);
r.delete('/personas/:id', authRequired(['ADMIN']), Personas.softDelete);

r.post('/personas/:id/foto', authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF']), uploadImage.single('file'), Fotos.uploadMultipart);
r.post('/personas/:id/foto-dataurl', authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']), Fotos.uploadDataUrl);
r.delete('/personas/:id/foto', authRequired(['ADMIN','TESORERIA']), Fotos.remove);

r.get('/personas/:id/qr', authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']), QR.issueForPersona);
r.get('/qr/:token', QR.consumeTokenJSON);
r.get('/qr/:token/view', QR.viewHTML);
r.get('/personas/:id/carnet.pdf', authOrQrToken(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']), Carnet.byPersona);
r.get('/carnet/:token.pdf', Carnet.byToken);

r.get('/personal/:id/gafete.pdf', authOrQrToken(['ADMIN','TESORERIA','COORDINADOR','DIRECTIVO','STAFF']), Gafete.one);
r.get('/personal/gafetes.pdf', authRequired(['ADMIN','TESORERIA','COORDINADOR','DIRECTIVO','STAFF']), Gafete.grid);

r.get('/cuotas', authRequired(['ADMIN','TESORERIA','DIRECTIVO']), Cuotas.list);
r.post('/cuotas/emitir', authRequired(['TESORERIA','ADMIN']), vCuotasEmitir, validate, Cuotas.emitir);
r.put('/cuotas/:id/pagar', authRequired(['TESORERIA','ADMIN']), vCuotaPagar, validate, Cuotas.pagar);
r.get('/cuotas/:id/comprobante.pdf', authRequired(['TESORERIA','ADMIN','DIRECTIVO']), Cuotas.comprobantePdf);

r.post('/caja', authRequired(['TESORERIA','ADMIN']), vCajaAlta, validate, Caja.alta);
r.get('/caja/reporte', authRequired(['TESORERIA','ADMIN','DIRECTIVO']), vCajaReporte, validate, Caja.reporte);
r.get('/caja/reporte.csv', authRequired(['TESORERIA','ADMIN','DIRECTIVO']), vCajaReporteCSV, validate, Caja.reporteCSV);

export default r;
EOF

# ---------- assets (escudo.png placeholder 1x1 png) ----------
mkdir -p "$ROOT/assets"
wb64 assets/escudo.png "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottQAAAABJRU5ErkJggg=="

# ---------- empaquetar ----------
if command -v zip >/dev/null 2>&1; then
  ( cd "$ROOT" && zip -rq ../lujan-backend-refactor.zip . )
  echo "OK -> lujan-backend-refactor.zip"
else
  # fallback universal: .tar.gz
  ( cd "$ROOT" && tar -czf ../lujan-backend-refactor.tar.gz . )
  echo "OK -> lujan-backend-refactor.tar.gz  (no había 'zip' en el sistema)"
fi

