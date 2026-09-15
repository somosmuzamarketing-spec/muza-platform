// Genera el certificado digital de "Muza Fundadora" en PDF, adjunto al
// Email 4 de la secuencia de bienvenida post-pago (ver founderSequence.ts).
// Reemplaza el certificado que en el borrador de Mailchimp quedó pendiente
// ("Adjunto encontrarás tu Certificado Digital", sin generarse de verdad).
//
// Usa el diseño OFICIAL de Muza (el mismo PDF que ya se le entregó a mano a
// las primeras Fundadoras, ej. Kelly Nucete) como fondo, y solo dibuja encima
// el nombre y la fecha de cada nueva Fundadora — así el resultado es igual
// al certificado real, no una versión simplificada hecha con formas básicas.

import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import path from "path";

// Tamaño de página = tamaño exacto del diseño oficial (1536 x 1024 pt).
const PAGE_WIDTH = 1536;
const PAGE_HEIGHT = 1024;

// Color de tinta usado en el certificado oficial (muestreado del PDF real).
const TINTA = rgb(0x38 / 255, 0x0b / 255, 0x2e / 255);

const MESES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

function formatFechaCorta(d: Date) {
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export async function generateFounderCertificatePdf({
  name,
  founderNumber,
  plan,
  activatedAt,
}: {
  name: string;
  founderNumber: number;
  plan: string; // no se usa en el diseño oficial (se mantiene por compatibilidad con el llamador)
  activatedAt: Date;
}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Fondo: el diseño oficial del certificado (logo, sello, firma, textos fijos),
  // con el nombre y la fecha de ejemplo ya "borrados" para poder escribir encima.
  const templatePath = path.join(process.cwd(), "public", "founder-certificate-template.jpg");
  const templateBytes = await readFile(templatePath);
  const templateImage = await doc.embedJpg(templateBytes);
  page.drawImage(templateImage, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });

  // Tipografías: script para el nombre (mismo estilo que el original) y sans
  // con tracking para la fecha, igual que el resto de las etiquetas del diseño.
  const scriptFontPath = path.join(process.cwd(), "src/lib/fonts/AlexBrush-Regular.ttf");
  const sansFontPath = path.join(process.cwd(), "src/lib/fonts/Poppins-Medium.ttf");
  const scriptFont = await doc.embedFont(await readFile(scriptFontPath));
  const sansFont = await doc.embedFont(await readFile(sansFontPath));

  // --- Nombre, centrado sobre la línea dorada ---
  // maxWidth se deja con margen extra porque esta fuente script tiene
  // florituras decorativas (swashes) que sobresalen del ancho "oficial" del texto.
  const nameSize = fitFontSize(scriptFont, name, 150, 1150);
  const nameWidth = scriptFont.widthOfTextAtSize(name, nameSize);
  page.drawText(name, {
    x: (PAGE_WIDTH - nameWidth) / 2,
    y: 584,
    size: nameSize,
    font: scriptFont,
    color: TINTA,
  });

  // --- Fecha (mes + año, en mayúsculas con tracking), centrada en su columna ---
  const fecha = formatFechaCorta(activatedAt);
  drawTrackedText(page, fecha, sansFont, 20, 4.5, 1227, 167, TINTA);

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

// Reduce el tamaño de fuente si el nombre es muy largo, para que nunca se
// salga del ancho disponible (algunas Fundadoras tienen nombres compuestos).
function fitFontSize(font: PDFFont, text: string, maxSize: number, maxWidth: number) {
  let size = maxSize;
  while (size > 40 && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 2;
  }
  return size;
}

// Dibuja texto en mayúsculas con letter-spacing manual, centrado en centerX,
// con la línea de base en y (pdf-lib no soporta tracking nativo).
function drawTrackedText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  tracking: number,
  centerX: number,
  y: number,
  color: ReturnType<typeof rgb>
) {
  const chars = text.split("");
  const totalWidth =
    chars.reduce((sum, c) => sum + font.widthOfTextAtSize(c, size), 0) + tracking * (chars.length - 1);
  let x = centerX - totalWidth / 2;
  for (const c of chars) {
    page.drawText(c, { x, y, size, font, color });
    x += font.widthOfTextAtSize(c, size) + tracking;
  }
}
