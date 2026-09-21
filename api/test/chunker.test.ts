import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chunkText, estimateTokens } from '../src/ingest/chunker';

describe('chunkText', () => {
  it('returns empty for empty or blank input', () => {
    assert.deepEqual(chunkText(''), []);
    assert.deepEqual(chunkText('   \n\n  '), []);
  });

  it('discards fragments too short to provide context', () => {
    assert.deepEqual(chunkText('Title\n\nHi.'), []);
  });

  it('keeps content that fits within maxChars in a single chunk', () => {
    const text = `Guide\n\n${'useful content '.repeat(20)}`;
    const chunks = chunkText(text, 3200, 400);
    assert.equal(chunks.length, 1);
    assert.match(chunks[0], /^Guide/);
  });

  it('splits by paragraph when maxChars is exceeded', () => {
    const body = 'filler text '.repeat(30); // ~360 chars
    const text = `One\n\n${body}\n\nTwo\n\n${body}\n\nThree\n\n${body}`;
    const chunks = chunkText(text, 600, 50);

    assert.ok(chunks.length >= 3, `expected >=3 chunks, got ${chunks.length}`);
  });

  it('splits with overlap a single block larger than maxChars', () => {
    const long = 'a'.repeat(1000);
    const chunks = chunkText(`Section\n\n${long}`, 300, 100);

    assert.ok(chunks.length > 1);
    for (const chunk of chunks) assert.ok(chunk.length <= 300);
    // The overlap makes the total exceed the original length.
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    assert.ok(total > long.length);
  });

  it('does not lose content when splitting (with overlap, covers all the text)', () => {
    const long = Array.from({ length: 400 }, (_, i) => `p${i}`).join(' ');
    const chunks = chunkText(`Section\n\n${long}`, 300, 100);
    const joined = chunks.join('');
    for (const marker of ['p0', 'p200', 'p399']) {
      assert.ok(joined.includes(marker), `missing ${marker}`);
    }
  });
});

describe('estimateTokens', () => {
  it('approximates 4 characters per token, rounding up', () => {
    assert.equal(estimateTokens(''), 0);
    assert.equal(estimateTokens('abcd'), 1);
    assert.equal(estimateTokens('abcde'), 2);
  });
});
