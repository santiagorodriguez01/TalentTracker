import {query} from '../../db/connection.js';

export default class UsuarioRepository{
    
    async getByUsername(u){const r=await query('SELECT * FROM usuario WHERE username = ?',[u]);return r[0]||null;}}
