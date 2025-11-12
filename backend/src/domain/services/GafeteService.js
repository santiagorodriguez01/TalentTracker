import PDFDocument from 'pdfkit'; 
import QRCode from 'qrcode'; 
import {BRAND,mm,getFonts} from '../utils/pdf.js'; 
import {loadImageBuffer} from './ImageService.js'; 
import {makeQrToken} from './QRService.js'; 
import {query} from '../../db/connection.js';
import { registerFonts } from '../../core/fonts.js';

async function getPersonalRow(id){
    const rows=await query(`SELECT p.id, p.nombre, p.apellido, p.dni, p.foto, p.rol, p.estado, pc.legajo, pc.cargo, pc.area FROM persona p LEFT JOIN personal_cred pc ON pc.persona_id = p.id WHERE p.id = ?`,[id]);
    return rows[0]||null;
}

export async function drawGafete(doc,p,x,y,W,H,fonts){
    const PAD=mm(6),R=mm(4),headerH=mm(18),bandH=mm(6),gap=mm(4);
    doc.save();
    doc.roundedRect(x+mm(2),y+mm(2),W-mm(4),H-mm(4),R).lineWidth(1.5).strokeColor(BRAND.c1).stroke();
    doc.roundedRect(x+PAD,y+PAD,W-PAD*2,H-PAD*2,R-mm(1)).fillColor('#FFFFFF').fill();
    doc.save().rect(x+PAD,y+PAD,W-PAD*2,headerH).fillColor(BRAND.c1).fill().restore();
    doc.fillColor('#fff').font(fonts.bold).fontSize(11).text(BRAND.name,x+PAD,y+PAD+mm(3),{width:W-PAD*2,align:'center'});

    const qrSize=mm(28),qx=x+W-PAD-qrSize,qy=y+H-PAD-bandH-qrSize;const token=makeQrToken(p.id);
    const url=`${BRAND.baseURL}/qr/${token}`;
    const qrPng=await QRCode.toBuffer(url,{type:'png',margin:0,scale:4});
    doc.image(qrPng,qx,qy,{width:qrSize,height:qrSize});
    doc.font(fonts.regular).fontSize(7).fillColor('#444').text('Validar',qx-mm(2),qy+qrSize+mm(1),{width:qrSize+mm(4),align:'center'});
    const fotoMaxH=(qy-gap)-(y+PAD+headerH+gap);const fotoW=mm(38),fotoH=Math.min(mm(48),fotoMaxH),fotoX=x+PAD+mm(2),fotoY=y+PAD+headerH+gap;const fotoBuf=await loadImageBuffer(p.foto);
    if(fotoBuf){doc.save();
        doc.roundedRect(fotoX,fotoY,fotoW,fotoH,mm(3)).clip();
        doc.image(fotoBuf,fotoX,fotoY,{fit:[fotoW,fotoH],align:'center',valign:'center'});
        doc.restore();doc.roundedRect(fotoX,fotoY,fotoW,fotoH,mm(3)).lineWidth(.8).strokeColor('#666').stroke();
    }
    const tx=fotoX+fotoW+mm(6),ty0=y+PAD+headerH+mm(3),textWidth=Math.max(mm(20),(qx-mm(4))-tx);
    doc.fillColor(BRAND.text).font(fonts.bold).fontSize(12).text(`${p.apellido}, ${p.nombre}`,tx,ty0,{width:textWidth,lineBreak:true});
    let ty=doc.y+mm(2);const safe=(v,d='')=>(v==null||v===''?d:v);
    doc.font(fonts.regular).fontSize(9);
    if(p.area){
        doc.text(`Area: ${safe(p.area)}`,tx,ty,{width:textWidth});
    ty=doc.y;
}

if(p.cargo){
    doc.text(`Cargo: ${safe(p.cargo)}`,tx,ty,{width:textWidth});
    ty=doc.y;
}

if(p.legajo){
    doc.text(`Legajo: ${safe(p.legajo)}`,tx,ty,{width:textWidth});
    ty=doc.y;
}
doc.save().rect(x+PAD,y+H-PAD-mm(6),W-PAD*2,mm(6)).fillColor(BRAND.c2).fill().restore();doc.restore();
}

export async function oneGafete(res,id){
    const p=await getPersonalRow(+id);if(!p)return res.status(404).json({error:{message:'Persona no encontrada'

    }}
);

const W=mm(85.6),H=mm(54.0);res.setHeader('Content-Type','application/pdf');
res.setHeader('Content-Disposition',`inline; filename="gafete_${p.id}.pdf"`);

const doc=new PDFDocument({size:[W,H],margin:0});
doc.on('error',(e)=>{console.error('[PDF gafete]',e);
    try{res.end();}catch{}
});

doc.pipe(res);

const fonts = registerFonts(doc);

await drawGafete(doc,p,0,0,W,H,fonts);

doc.end();}

export async function gridGafetes(res,ids,paper='A4',cols=2,rows=3){
    const margin=mm(10),size=paper==='A4'?[595.28,841.89]:[612,792],[PW,PH]=size,gridW=PW-margin*2,gridH=PH-margin*2,cellW=gridW/cols,cellH=gridH/rows;
    res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="gafetes_${ids.length}.pdf"`);
    
    const doc=new PDFDocument({size,margin:0});doc.on('error',(e)=>{console.error('[PDF gafetes]',e);
        try{res.end();

        }
        catch{}
    });
    doc.pipe(res);
        
    const fonts = registerFonts(doc);
    let i=0;
        while(i<ids.length){
            for(let r=0;r<rows&&i<ids.length;r++){for(let c=0;c<cols&&i<ids.length;c++,i++){
                const rr=await query(`SELECT p.id, p.nombre, p.apellido, p.dni, p.foto, p.rol, p.estado, pc.legajo, pc.cargo, pc.area FROM persona p LEFT JOIN personal_cred pc ON pc.persona_id = p.id WHERE p.id = ?`,[ids[i]]);
                const p=rr[0];
                if(!p)continue;
                const x=margin+c*cellW+mm(2),y=margin+r*cellH+mm(2);
                await drawGafete(doc,p,x,y,cellW-mm(4),cellH-mm(4),fonts);
            }}
            if(i<ids.length)doc.addPage({
                size,margin:0
            })
            ;}
            
     doc.end()
     ;}
