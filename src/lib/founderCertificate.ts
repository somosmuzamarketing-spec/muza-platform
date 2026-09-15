// Genera el certificado digital de "Muza Fundadora" en PDF, adjunto al
// Email 4 de la secuencia de bienvenida post-pago (ver founderSequence.ts).
// Reemplaza el certificado que en el borrador de Mailchimp quedó pendiente
// ("Adjunto encontrarás tu Certificado Digital", sin generarse de verdad).
//
// Usa pdf-lib (sin dependencias nativas, corre bien en el runtime de
// Node de Railway) y la misma paleta de marca que welcomeEmail.ts.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

const MORADO = rgb(0x4a / 255, 0x1c / 255, 0x39 / 255);
const DORADO = rgb(0xd8 / 255, 0xb4 / 255, 0x6a / 255);
const CREMA = rgb(0xfb / 255, 0xf6 / 255, 0xec / 255);
const TEXTO = rgb(0x15 / 255, 0x0c / 255, 0x14 / 255);
const MUTED = rgb(0x7a / 255, 0x66 / 255, 0x56 / 255);

function formatFecha(d: Date) {
  return d.toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateFounderCertificatePdf({
  name,
  founderNumber,
  plan,
  activatedAt,
}: {
  name: string;
  founderNumber: number;
  plan: string; // ej. "Anual"
  activatedAt: Date;
}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  // Tamaño carta apaisado (letter landscape), en puntos.
  const page = doc.addPage([792, 612]);
  const { width, height } = page.getSize();

  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  // Fondo crema + marco morado con borde dorado.
  page.drawRectangle({ x: 0, y: 0, width, height, color: CREMA });
  const margin = 28;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: MORADO,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: margin + 8,
    y: margin + 8,
    width: width - (margin + 8) * 2,
    height: height - (margin + 8) * 2,
    borderColor: DORADO,
    borderWidth: 1,
  });

  // Logo, si está disponible (no rompe la generación si falta el archivo).
  let cursorY = height - 96;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-horizontal.png");
    const logoBytes = await readFile(logoPath);
    const logoImage = await doc.embedPng(logoBytes);
    const logoW = 220;
    const logoH = (logoImage.height / logoImage.width) * logoW;
    page.drawImage(logoImage, {
      x: (width - logoW) / 2,
      y: cursorY - logoH + 20,
      width: logoW,
      height: logoH,
    });
    cursorY -= logoH + 10;
  } catch {
    // Sin logo disponible: seguimos sin bloquear el certificado.
  }

  const centerText = (text: string, y: number, font = serif, size = 14, color = TEXTO) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  centerText("CERTIFICADO", cursorY - 18, serifBold, 28, MORADO);
  centerText("Muza Fundadora", cursorY - 48, serifItalic, 18, DORADO);

  centerText("Este certificado reconoce a", cursorY - 96, serif, 13, MUTED);
  centerText(name, cursorY - 128, serifBold, 26, TEXTO);
  centerText("como una de las primeras 100 mujeres en construir Muza desde el inicio.", cursorY - 154, serif, 13, MUTED);

  // Datos de membresía, en una franja inferior.
  const detailsY = 150;
  const details = [
    `Fundadora #${founderNumber}`,
    `Plan: ${plan}`,
    `Fecha de activación: ${formatFecha(activatedAt)}`,
  ];
  const detailsText = details.join("   •   ");
  centerText(detailsText, detailsY, serif, 12, TEXTO);

  centerText("Con cariño, Karen y el equipo Muza", 90, serifItalic, 12, MUTED);

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
