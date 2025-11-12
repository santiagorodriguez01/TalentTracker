import {query} from '../../db/connection.js';


export async function audit(userId,a,e,id,meta){
    
    try{
        
        await query('INSERT INTO auditoria (fecha, user_id, accion, entidad, entidad_id, meta) VALUES (NOW(), ?, ?, ?, ?, ?)',[userId||null,a||'',e||'',id||null,meta?JSON.stringify(meta).slice(0,4000):null])
        
        ;
    }
        catch(e){if(process.env.NODE_ENV!=='test')console.warn('[AUDIT warn]',e.code||e.message);
            
        }}
