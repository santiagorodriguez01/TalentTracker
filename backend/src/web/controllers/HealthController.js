import asyncH from '../middleware/asyncHandler.js';

import {query} from '../../db/connection.js';

export const health=asyncH(async(_req,res)=>{
    
    const x=await query('SELECT 1 AS ok');
    
    res.json({ok:x[0].ok===1});

});
