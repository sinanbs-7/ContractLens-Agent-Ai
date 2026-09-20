import pdfParse from 'pdf-parse';

export interface ParsedDocument {
  fullText: string;
  pages: Array<{
    pageNumber: number;
    text: string;
  }>;
  totalLength: number;
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
  originalFilename: string
): Promise<ParsedDocument> {
  const isPdf = mimeType === 'application/pdf' || originalFilename.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const data = await pdfParse(buffer);
      const rawText = data.text || '';

      // Split pages by form-feed or standard PDF page markers
      const splitPages = rawText.split(/\f/);
      const pages = splitPages.map((pageText, index) => ({
        pageNumber: index + 1,
        text: pageText.trim()
      })).filter(p => p.text.length > 0);

      // If no form-feed detected, create artificial pages roughly 3000 chars each
      if (pages.length === 0) {
        pages.push({
          pageNumber: 1,
          text: rawText.trim()
        });
      }

      return {
        fullText: rawText.trim(),
        pages,
        totalLength: rawText.length
      };
    } catch (err: any) {
      console.warn(`[WARNING] Failed to parse as binary PDF (${err.message}). Treating as text payload.`);
      const text = buffer.toString('utf-8');
      return {
        fullText: text,
        pages: [{ pageNumber: 1, text }],
        totalLength: text.length
      };
    }
  } else {
    // Plain text or markdown
    const text = buffer.toString('utf-8');
    // Split into pseudo-pages by double line breaks or 2500 character chunks
    const paragraphs = text.split(/\n\s*\n/);
    const pages: Array<{ pageNumber: number; text: string }> = [];
    let currentPage = 1;
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk.length + para.length > 2500) && currentChunk.length > 0) {
        pages.push({ pageNumber: currentPage++, text: currentChunk.trim() });
        currentChunk = para + '\n\n';
      } else {
        currentChunk += para + '\n\n';
      }
    }
    if (currentChunk.trim().length > 0) {
      pages.push({ pageNumber: currentPage, text: currentChunk.trim() });
    }

    return {
      fullText: text.trim(),
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: text.trim() }],
      totalLength: text.length
    };
  }
}
