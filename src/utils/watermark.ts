// src/utils/watermark.ts
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";

let fontBuffer: Buffer | null = null;
const FONT_DOWNLOAD_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Regular.ttf";
const WATERMARK_TEXT = "Tài liệu thuộc CDC Đà Nẵng";

async function getFontBuffer(): Promise<Buffer> {
  if (fontBuffer) return fontBuffer;

  const fontPath = path.join(process.cwd(), "Roboto-Regular.ttf");
  if (fs.existsSync(fontPath)) {
    try {
      fontBuffer = fs.readFileSync(fontPath);
      return fontBuffer;
    } catch (e) {
      console.error("[watermark] Failed to read cached font:", e);
    }
  }

  try {
    console.log("[watermark] Downloading font from Google Fonts...");
    const res = await fetch(FONT_DOWNLOAD_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    fontBuffer = Buffer.from(arrayBuffer);
    
    // Save to disk cache asynchronously so we don't block
    fs.writeFile(fontPath, fontBuffer, (err) => {
      if (err) console.error("[watermark] Failed to cache font to disk:", err);
      else console.log("[watermark] Font cached successfully to disk.");
    });
    
    return fontBuffer;
  } catch (err) {
    console.error("[watermark] Failed to download font:", err);
    // If download fails, try to fallback to a basic system font or throw
    throw err;
  }
}

/**
 * Watermarks a PDF file buffer.
 */
async function watermarkPdf(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await getFontBuffer();
  const customFont = await pdfDoc.embedFont(fontBytes);

  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = 11;
    const textWidth = customFont.widthOfTextAtSize(WATERMARK_TEXT, fontSize);
    
    // Bottom-right position with margins
    const marginX = 20;
    const marginY = 20;
    const x = width - textWidth - marginX;
    const y = marginY;

    // Draw background badge for readability
    const paddingX = 8;
    const paddingY = 4;
    const badgeWidth = textWidth + paddingX * 2;
    const badgeHeight = fontSize + paddingY * 2;

    page.drawRectangle({
      x: x - paddingX,
      y: y - paddingY,
      width: badgeWidth,
      height: badgeHeight,
      color: rgb(1, 1, 1),
      opacity: 0.75,
      borderWidth: 0.5,
      borderColor: rgb(0.85, 0.85, 0.85),
    });

    // Draw text
    page.drawText(WATERMARK_TEXT, {
      x,
      y,
      size: fontSize,
      font: customFont,
      color: rgb(0.1, 0.25, 0.5), // Professional CDC Navy Blue
      opacity: 0.9,
    });
  }

  const modifiedPdfBytes = await pdfDoc.save();
  return Buffer.from(modifiedPdfBytes);
}

/**
 * Watermarks an image file buffer.
 */
async function watermarkImage(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  // Responsive font size & padding relative to image dimensions
  const fontSize = Math.max(12, Math.round(width * 0.022));
  const paddingBottom = Math.max(10, Math.round(height * 0.025));
  const paddingRight = Math.max(10, Math.round(width * 0.025));

  // Generate SVG overlay matching size of the image for perfect placement
  const watermarkSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .watermark-text {
          font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          font-size: ${fontSize}px;
          font-weight: bold;
          fill: rgba(255, 255, 255, 0.75);
          stroke: rgba(0, 0, 0, 0.35);
          stroke-width: 1px;
          paint-order: stroke fill;
        }
      </style>
      <text 
        x="${width - paddingRight}" 
        y="${height - paddingBottom}" 
        text-anchor="end" 
        class="watermark-text"
      >${WATERMARK_TEXT}</text>
    </svg>
  `;

  return image
    .composite([{
      input: Buffer.from(watermarkSvg),
      top: 0,
      left: 0
    }])
    .toBuffer();
}

/**
 * Main watermark entrypoint. Watermarks PDFs and Images.
 * Gracefully degrades to return original buffer on errors or unsupported formats.
 */
export async function addWatermark(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const normalizedMime = mimeType.toLowerCase();

  try {
    if (normalizedMime === "application/pdf") {
      return await watermarkPdf(buffer);
    } 
    
    if (
      normalizedMime.startsWith("image/") &&
      !normalizedMime.includes("gif") && // sharp can't composite on animated gifs easily without extra config
      !normalizedMime.includes("svg")
    ) {
      return await watermarkImage(buffer);
    }
  } catch (err) {
    console.error(`[watermark] Failed to watermark file of type ${mimeType}:`, err);
  }

  // Fallback to original buffer
  return buffer;
}
