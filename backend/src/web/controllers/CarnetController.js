import asyncH from '../middleware/asyncHandler.js';
import jwt from 'jsonwebtoken';
import {query} from '../../db/connection.js';
import {carnetPdf} from '../../domain/services/CarnetService.js';
import {makeQrToken} from '../../domain/services/QRService.js';


export const byPersona=asyncH(async(req,res)=>{
    const id=+req.params.id;
    const rows=await query('SELECT p.id, p.nombre, p.apellido, p.dni, p.rol, p.estado, p.foto, s.nro_socio FROM persona p LEFT JOIN socio s ON s.persona_id = p.id WHERE p.id = ?',[id]);
    if(!rows.length)return res.status(404).json({
        error:{message:'Persona no encontrada'}
    });
    const p=rows[0];
    const token=makeQrToken(id);
    await carnetPdf(res,p,token);
});
export const byToken=asyncH(async(req,res)=>{let pid;try{
    const payload=jwt.verify(req.params.token,process.env.JWT_SECRET);
    pid=payload.pid;
}
catch{
    
    return res.status(400).send('Token invalido o expirado');

    }
    const rows=await query('SELECT p.id, p.nombre, p.apellido, p.dni, p.rol, p.estado, p.foto, s.nro_socio FROM persona p LEFT JOIN socio s ON s.persona_id = p.id WHERE p.id = ?',[pid]);
    if(!rows.length)return res.status(404).send('Persona no encontrada');
    await carnetPdf(res,rows[0],req.params.token);
});
