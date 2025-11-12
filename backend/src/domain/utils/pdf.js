export const BRAND={
name:process.env.BRAND_NAME||'CLUB DEPORTIVO LUJAN',
// Colores institucionales (actualizados)
// primario: #FFA37E  secundario: #7BD28F  terciario: #F6D94E
c1:process.env.BRAND_PRIMARY||'#FFA37E',
c2:process.env.BRAND_SECONDARY||'#7BD28F',
c3:process.env.BRAND_TERTIARY||'#F6D94E',
text:process.env.BRAND_TEXT||'#111111',
logoPath:process.env.BRANDING_LOGO_PATH||'/app/uploads/logo-club.png',
fontReg:process.env.FONT_REGULAR_PATH||null,
fontBold:process.env.FONT_BOLD_PATH||null,
baseURL:process.env.PUBLIC_BASE_URL||'http://localhost:3000'};
export const mm=(n)=>(n*72)/25.4;
export function getFonts(doc){const f={regular:'Helvetica',bold:'Helvetica-Bold'};try{if(BRAND.fontReg){doc.registerFont('reg',BRAND.fontReg);f.regular='reg';}}catch{}try{if(BRAND.fontBold){doc.registerFont('bold',BRAND.fontBold);f.bold='bold';}}catch{}return f;}
