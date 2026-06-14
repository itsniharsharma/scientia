import { Injectable, Logger } from '@nestjs/common';
import * as mupdf from 'mupdf';
import { PDF_MAX_PAGES, PDF_PAGE_IMAGE_WIDTH, PDF_PAGE_IMAGE_QUALITY } from '@scientia/shared';

export interface PageImage {
  pageNumber: number; // 1-indexed
  imageBuffer: Buffer;
  width: number;
  height: number;
}

@Injectable()
export class PdfConverterService {
  private readonly logger = new Logger(PdfConverterService.name);

  // Returns one PageImage per PDF page, rendered as JPEG at the configured width.
  // Pages are rendered sequentially; each pixmap is freed immediately after JPEG
  // compression to bound peak WASM heap usage to ~one page at a time.
  async convertToImages(pdfBuffer: Buffer): Promise<PageImage[]> {
    const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');

    let totalPages: number;
    try {
      totalPages = doc.countPages();
    } catch (err) {
      (doc as { destroy?: () => void }).destroy?.();
      throw new Error(`Failed to count PDF pages: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (totalPages > PDF_MAX_PAGES) {
      (doc as { destroy?: () => void }).destroy?.();
      throw new Error(`PDF has ${totalPages} pages, exceeds limit of ${PDF_MAX_PAGES}`);
    }

    this.logger.log(`Converting ${totalPages} page(s) at target width ${PDF_PAGE_IMAGE_WIDTH}px`);

    const results: PageImage[] = [];

    try {
      for (let i = 0; i < totalPages; i++) {
        const page = doc.loadPage(i);
        let pixmap: mupdf.Pixmap | undefined;

        try {
          // bounds = [x0, y0, x1, y1] in PDF points (1 pt = 1/72 inch)
          const bounds = page.getBounds();
          const pageWidthPts = bounds[2] - bounds[0];
          const scale = PDF_PAGE_IMAGE_WIDTH / pageWidthPts;

          // Scale matrix: [sx, 0, 0, sy, 0, 0]
          const matrix: [number, number, number, number, number, number] = [scale, 0, 0, scale, 0, 0];
          pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);

          const width = pixmap.getWidth();
          const height = pixmap.getHeight();

          // asJPEG(quality, progressive) — compress immediately, then release pixmap
          const jpegData = pixmap.asJPEG(PDF_PAGE_IMAGE_QUALITY, false);

          results.push({
            pageNumber: i + 1,
            imageBuffer: Buffer.from(jpegData),
            width,
            height,
          });
        } finally {
          // Explicit release of WASM-allocated objects
          (pixmap as { destroy?: () => void } | undefined)?.destroy?.();
          (page as { destroy?: () => void }).destroy?.();
        }
      }
    } finally {
      (doc as { destroy?: () => void }).destroy?.();
    }

    this.logger.log(`Conversion complete: ${results.length} page(s)`);
    return results;
  }
}
