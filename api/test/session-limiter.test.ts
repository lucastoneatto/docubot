import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { SessionRateLimiter } from '../src/chat/chat.service';

describe('SessionRateLimiter', () => {
  it('allows messages up to the limit and blocks the next one', () => {
    const limiter = new SessionRateLimiter(3);
    for (let i = 0; i < 3; i += 1) {
      assert.equal(limiter.check('s1'), true, `message ${i + 1}`);
    }
    assert.equal(limiter.check('s1'), false);
  });

  it('isolates sessions: one saturated does not affect another', () => {
    const limiter = new SessionRateLimiter(1);
    assert.equal(limiter.check('s1'), true);
    assert.equal(limiter.check('s1'), false);
    // Different session (same IP, e.g. behind a NAT) still works.
    assert.equal(limiter.check('s2'), true);
  });

  it('reopens the window after a minute', () => {
    mock.timers.enable({ apis: ['Date'] });
    try {
      const limiter = new SessionRateLimiter(1);
      assert.equal(limiter.check('s1'), true);
      assert.equal(limiter.check('s1'), false);

      mock.timers.tick(60_001);
      assert.equal(limiter.check('s1'), true);
    } finally {
      mock.timers.reset();
    }
  });

  it('purges expired windows instead of growing without limit', () => {
    mock.timers.enable({ apis: ['Date'] });
    try {
      const limiter = new SessionRateLimiter(5);
      // Every visitor of a public widget gets a fresh sessionId: without
      // purging, the map would grow monotonically until it exhausts memory.
      for (let i = 0; i < 400; i += 1) limiter.check(`s${i}`);
      assert.equal(limiter.size, 400);

      mock.timers.tick(60_001);
      // The sweep runs every 500 checks; once that threshold is crossed, the
      // 400 expired windows disappear.
      for (let i = 0; i < 100; i += 1) limiter.check(`nueva${i}`);
      assert.ok(limiter.size < 400, `map was not purged: ${limiter.size}`);
    } finally {
      mock.timers.reset();
    }
  });
});
