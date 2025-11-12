import { query } from '../../db/connection.js';
export default class CuotaRepository{
  async list({estado,socio_id,periodo,page=1,size=20}){const off=(+page-1)*+size;const w=[];const p=[];if(estado){w.push('c.estado = ?');p.push(estado);}if(socio_id){w.push('c.socio_id = ?');p.push(+socio_id);}if(periodo){w.push('c.periodo = ?');p.push(periodo);}const sql=`SELECT c.*, s.nro_socio, p.nombre, p.apellido FROM cuota c JOIN socio s ON s.id=c.socio_id JOIN persona p ON p.id=s.persona_id ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY c.vencimiento DESC, c.id DESC LIMIT ? OFFSET ?`;p.push(+size,off);return query(sql,p);}
}
