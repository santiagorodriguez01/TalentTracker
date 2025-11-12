import asyncH from '../middleware/asyncHandler.js';
import {oneGafete,gridGafetes} from '../../domain/services/GafeteService.js';

export const one=asyncH(async(req,res)=>{
    
    await oneGafete(res,req.params.id);

});

export const grid=asyncH(async(req,res)=>{
    
    const ids=String(req.query.ids||'').split(',').map(s=>s.trim()).filter(Boolean).map(n=>+n).filter(n=>!Number.isNaN(n));
    
    if(!ids.length)return res.status(400).json({error:{message:'Parametro ids requerido'}});const paper=(req.query.paper||'A4').toUpperCase();
    
    const cols=Math.max(1,+(req.query.cols||2));
    const rows=Math.max(1,+(req.query.rows||3));
    
    await gridGafetes(res,ids,paper,cols,rows);});
