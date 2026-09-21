import { createHash } from 'node:crypto';
import { extname } from 'node:path';

export type ExtractedFile = {
  text: string;
  contentHash: string;
};

const SUPPORTED_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.txt',
  '.md',
  '.markdown',
  '.xlsx',
  '.xls',
  '.csv',
]);

export function isSupportedFile(filename: string): boolean {
  return SUPPORTED_EXTENSIONS.has(extname(filename).toLowerCase());
}

/**
 * Converts any supported file's binary content into plain text ready for
 * chunking. Each branch normalizes its format's structure (PDF pages, DOCX
 * paragraphs, spreadsheet rows) into blank-line-separated text blocks, which
 * is what `chunkText()` expects.
 */
export async function extractText(
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const ext = extname(filename).toLowerCase();

  switch (ext) {
    case '.pdf':
      return extractPdf(buffer);
    case '.docx':
      return extractDocx(buffer);
    case '.xlsx':
    case '.xls':
    case '.csv':
      return extractSpreadsheet(buffer, ext);
    case '.txt':
    case '.md':
    case '.markdown':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // Deferred import: pdf-parse pulls in a sizeable dependency tree that
  // isn't needed for uploads that never include a PDF.
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractSpreadsheet(
  buffer: Buffer,
  ext: '.xlsx' | '.xls' | '.csv',
): Promise<string> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    // CSV has no sheet structure of its own; everything else may have
    // multiple sheets, each rendered as its own labeled block below.
    raw: ext === '.csv',
  });

  const sheetTexts = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return `## ${sheetName}\n\n${csv}`;
  });

  return sheetTexts.join('\n\n');
}

export function hashContent(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
