import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { keepRelevant } from '../src/chat/chat.service';

const chunk = (score: number, path = 'docs/a.pdf') => ({
  filename: 'a.pdf',
  path,
  score,
  content: 'c',
});

// Realistic margins: with local embeddings scores live compressed near
// 0.85-0.93, so what separates them is the distance to the best one.
describe('keepRelevant', () => {
  it('discards what is far from the best result', () => {
    const kept = keepRelevant(
      [
        { chunk: chunk(0.89, 'docs/good.pdf'), hasLexicalMatch: false },
        { chunk: chunk(0.87, 'docs/close.pdf'), hasLexicalMatch: false },
        { chunk: chunk(0.70, 'docs/far.pdf'), hasLexicalMatch: false },
      ],
      0.06,
    );
    assert.deepEqual(
      kept.map((c) => c.path),
      ['docs/good.pdf', 'docs/close.pdf'],
    );
  });

  it('keeps the whole block when scores are tight', () => {
    // Real case of an on-topic question: several chunks equally good.
    const kept = keepRelevant(
      [
        { chunk: chunk(0.888), hasLexicalMatch: false },
        { chunk: chunk(0.853), hasLexicalMatch: false },
        { chunk: chunk(0.852), hasLexicalMatch: false },
      ],
      0.06,
    );
    assert.equal(kept.length, 3);
  });

  it('keeps lexical chunks even when their score is 0', () => {
    // A tsquery match has no score comparable to the dense one, but having
    // matched the query is already a signal of relevance.
    const kept = keepRelevant(
      [
        { chunk: chunk(0.89), hasLexicalMatch: false },
        { chunk: chunk(0, 'docs/lexical.pdf'), hasLexicalMatch: true },
      ],
      0.06,
    );
    assert.equal(kept.length, 2);
  });

  it('never ends up with no context: returns at least the best candidate', () => {
    // Ending up with no context would guarantee an "I don't know" even if
    // something useful existed.
    const kept = keepRelevant(
      [{ chunk: chunk(0, 'docs/only.pdf'), hasLexicalMatch: false }],
      0.06,
    );
    assert.equal(kept.length, 1);
    assert.equal(kept[0].path, 'docs/only.pdf');
  });

  it('does not invent context when there are no candidates', () => {
    assert.deepEqual(keepRelevant([], 0.06), []);
  });
});
