import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isNoInfoAnswer, reciprocalRankFusion } from '../src/chat/chat.service';

const RRF_K = 60;
const score = (rank: number) => 1 / (RRF_K + rank + 1);

describe('reciprocalRankFusion', () => {
  it('scores a single list based on position', () => {
    const fused = reciprocalRankFusion([['a', 'b']]);
    assert.ok(Math.abs(fused.get('a')! - score(0)) < 1e-12);
    assert.ok(Math.abs(fused.get('b')! - score(1)) < 1e-12);
    assert.ok(fused.get('a')! > fused.get('b')!);
  });

  it('sums the score of a document present in both lists', () => {
    const fused = reciprocalRankFusion([
      ['a', 'b'],
      ['b', 'c'],
    ]);
    assert.ok(Math.abs(fused.get('b')! - (score(1) + score(0))) < 1e-12);
  });

  it('prioritizes consensus between dense and lexical over an isolated first place', () => {
    // "shared" is 2nd in both lists; "soloDense" is 1st in only one.
    const fused = reciprocalRankFusion([
      ['soloDense', 'shared'],
      ['soloLexical', 'shared'],
    ]);
    const ranked = [...fused.entries()].sort((a, b) => b[1] - a[1]);
    assert.equal(ranked[0][0], 'shared');
  });

  it('returns an empty map when there are no lists or they are empty', () => {
    assert.equal(reciprocalRankFusion([]).size, 0);
    assert.equal(reciprocalRankFusion([[], []]).size, 0);
  });
});

describe('isNoInfoAnswer', () => {
  it('detects the prompt negatives in several languages', () => {
    for (const answer of [
      'Lo siento, no estoy preparado para responder sobre ese tema.',
      'No tengo información sobre eso.',
      "I'm not prepared to answer that.",
      'Desculpe, não tenho informações sobre isso.',
    ]) {
      assert.equal(isNoInfoAnswer(answer), true, answer);
    }
  });

  it('ignores uppercase', () => {
    assert.equal(isNoInfoAnswer('NO ESTOY PREPARADO para eso'), true);
  });

  it('does not flag useful answers', () => {
    assert.equal(isNoInfoAnswer('El horario de atención es de 9 a 17 h.'), false);
    assert.equal(isNoInfoAnswer(''), false);
  });
});
