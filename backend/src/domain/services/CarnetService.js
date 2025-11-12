import PDFDocument from 'pdfkit'; 
import QRCode from 'qrcode'; 
import {BRAND,getFonts} 
from '../utils/pdf.js'; 
import {loadImageBuffer} 
from './ImageService.js';
import { registerFonts } from '../../core/fonts.js';

export async function carnetPdf(res,p,token){
    
    const url=`${BRAND.baseURL}/qr/${token}/view`;
    
    const qrPng=await QRCode.toBuffer(url,{
        type:'png',margin:0,scale:6
    });
    
    const logoBuf=await loadImageBuffer(BRAND.logoPath);
    const fotoBuf=await loadImageBuffer(p.foto);
    const W=350,H=220;
    
    const doc=new PDFDocument({
        size:[W,H],margin:0
    });
    
    doc.on('error',(e)=>{
        console.error('[PDF carnet]',e);
        try{res.end();

        }
        catch{}
    });
    
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`inline; filename="carnet_${p.id}.pdf"`);
    doc.pipe(res);
    
    const fonts = registerFonts(doc);
    doc.save().rect(0,0,W,H).fill('#FFFFFF').restore();
    doc.roundedRect(6,6,W-12,H-12,12).lineWidth(2).strokeColor(BRAND.c1).stroke();
    doc.save().rect(12,14,W-24,28).fillColor(BRAND.c1).fill().restore();
    doc.fillColor('#FFFFFF').font(fonts.bold).fontSize(16).text(BRAND.name,12,18,{
        width:W-24,align:'center'
    });
    doc.moveTo(12,48).lineTo(W-12,48).lineWidth(1).strokeColor(BRAND.c1).stroke();

    if(logoBuf)doc.image(logoBuf,16,56,{
        width:40,height:40
    });

    const fotoX=16,fotoY=104,fotoW=90,fotoH=90;
    
    if(fotoBuf){
        doc.save();
        doc.roundedRect(fotoX,fotoY,fotoW,fotoH,8).clip();
        doc.image(fotoBuf,fotoX,fotoY,{fit:[fotoW,fotoH],align:'center',valign:'center'

        });
        
        doc.restore();
        
        doc.roundedRect(fotoX,fotoY,fotoW,fotoH,8).lineWidth(1).strokeColor('#444').stroke();
    }
    else{
        doc.roundedRect(fotoX,fotoY,fotoW,fotoH,8).lineWidth(1).strokeColor('#999').stroke();
        doc.font(fonts.regular).fillColor('#777').fontSize(9).text('Foto no disponible',fotoX,fotoY+42,{
            width:fotoW,align:'center'
        });
    }
    const tx=116,ty=60,tw=180;doc.fillColor(BRAND.text);doc.font(fonts.bold).fontSize(16).text(`Apellido, Nombre: ${p.apellido}, ${p.nombre}`,tx,ty,{
        width:tw,lineBreak:true
    });
    
    let yPos=doc.y+6;doc.font(fonts.regular).fontSize(12);doc.text(`DNI: ${p.dni||'-'}`,tx,yPos);
    
    yPos=doc.y+4;
    doc.text(`Rol: ${p.rol}`,tx,yPos);
    yPos=doc.y+4;
    doc.text(`Estado: ${p.estado}`,tx,yPos);
    yPos=doc.y+4;doc.text(`N Socio: ${p.nro_socio||'-'}`,tx,yPos);
    const qrSize=100;
    
    doc.image(qrPng,W-qrSize-16,70,{width:qrSize});
    doc.font(fonts.regular).fontSize(9).fillColor('#333').text('Escanear para validar',W-qrSize-26,70+qrSize+6,{
        width:qrSize+20,align:'center'});
        
    doc.save().rect(12,H-22,W-24,6).fillColor(BRAND.c2).fill().restore();
        
        
    doc.end();}
