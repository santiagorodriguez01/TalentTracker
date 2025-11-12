import fs from 'fs';

export function registerFonts(doc) {
  const fonts = { regular: 'Helvetica', bold: 'Helvetica-Bold' };

  // INTENTAR incrustar fuentes unicode si existen
  try {
    const fp = process.env.FONT_REGULAR_PATH || '../assets/Inter-Regular.ttf';
    if (fs.existsSync(fp)) {
      doc.registerFont('app-reg', fp);
      fonts.regular = 'app-reg';
    }
  } catch {}

  try {
    const fpb = process.env.FONT_BOLD_PATH || '../assets/Inter-Bold.ttf';
    if (fs.existsSync(fpb)) {
      doc.registerFont('app-bold', fpb);
      fonts.bold = 'app-bold';
    }
  } catch {}

  return fonts;
}
