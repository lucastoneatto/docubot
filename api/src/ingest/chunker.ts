/**
 * Splits extracted document text into overlapping chunks for embedding.
 * Works on any plain text (PDF/DOCX/XLSX extraction all normalize to plain
 * text before this runs) — splits on blank-line/paragraph boundaries first
 * so a chunk doesn't cut a sentence in half, then hard-wraps any oversized
 * paragraph at maxChars with an overlap tail carried into the next chunk.
 */
export function chunkText(
  text: string,
  maxChars = 3200,
  overlap = 400,
): string[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n{2,}/g);
  const chunks: string[] = [];
  let current = '';

  const flush = () => {
    if (current.trim().length > 0) chunks.push(current.trim());
    current = '';
  };

  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length > maxChars && current) {
      flush();
    }

    if (block.length > maxChars) {
      let start = 0;
      while (start < block.length) {
        const end = Math.min(start + maxChars, block.length);
        chunks.push(block.slice(start, end).trim());
        if (end >= block.length) break;
        start = end - overlap;
      }
      continue;
    }

    current = current ? `${current}\n\n${block}` : block;
  }

  flush();
  return chunks.filter((chunk) => chunk.trim().length > 40);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
