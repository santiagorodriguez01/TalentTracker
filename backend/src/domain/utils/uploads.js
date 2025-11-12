import multer from 'multer'; 
import fs from 'fs/promises'; 
import path from 'path';

const BASE = process.env.UPLOADS_DIR || '/app/uploads';

export async function ensureDir(dir){
  await fs.mkdir(dir,{recursive:true})
  
  ;}
const storage=multer.diskStorage({

  destination: async (req, file, cb)=>{const id=String(req.params.id||'tmp');
    const dir=path.join(BASE,'personas',id);
    
    await ensureDir(dir);cb(null,dir);
  },
  filename: (_req,file,cb)=>{
    
    const ext=(file.originalname||'').split('.').pop()||'bin';

    cb(null,'upload_'+Date.now()+'.'+ext);}
});



function pdfFilter(_req, file, cb) {
  if (file.mimetype !== 'application/pdf') return cb(new Error('Solo PDF'), false);
  cb(null, true);
}


export const uploadPdfTmp = multer({
  dest: path.join(BASE, '_tmp'),
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 } 
});


export async function rmIfExists(absPath) {
  try { await fs.unlink(absPath); } catch (e) { if (e.code !== 'ENOENT') throw e; }
}


export function uploadPdfFor(folder, filename='file.pdf') {
  const storage = multer.diskStorage({
    destination: async (req, _file, cb) => {
      const id = String(req.params.id || 'generic');
      const dir = path.join(BASE, folder, id);
      try { await fs.mkdir(dir, { recursive: true }); } catch {}
      cb(null, dir);
    },
    filename: (_req, _file, cb) => cb(null, filename)
  });
  function pdfFilter(_req, file, cb) {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Solo PDF'), false);
    cb(null, true);
  }
  return multer({ storage, fileFilter: pdfFilter });
}

export const uploadImage=multer({storage});
