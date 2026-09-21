import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { AdminBasicGuard } from '../src/admin/admin.guard';
import { config } from '../src/config';

function contextFor(header?: string) {
  const headers: Record<string, string> = {};
  const response = {
    setHeader(key: string, value: string) {
      headers[key] = value;
    },
  };
  const request = { headers: header ? { authorization: header } : {} };
  return {
    responseHeaders: headers,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as never,
  };
}

const basic = (user: string, pass: string) =>
  'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

describe('AdminBasicGuard', () => {
  const guard = new AdminBasicGuard();

  beforeEach(() => {
    config.admin.user = 'owner';
    config.admin.password = 'very-long-secret';
  });

  it('accepts correct credentials', () => {
    const { context } = contextFor(basic('owner', 'very-long-secret'));
    assert.equal(guard.canActivate(context), true);
  });

  it('rejects incorrect password', () => {
    const { context } = contextFor(basic('owner', 'otra'));
    assert.throws(() => guard.canActivate(context), /invalid/);
  });

  it('rejects incorrect user', () => {
    const { context } = contextFor(basic('otro', 'very-long-secret'));
    assert.throws(() => guard.canActivate(context), /invalid/);
  });

  it('rejects when there is no header and requests authentication', () => {
    const { context, responseHeaders } = contextFor();
    assert.throws(() => guard.canActivate(context));
    assert.match(responseHeaders['WWW-Authenticate'], /^Basic realm=/);
  });

  it('stays closed when no credentials are configured', () => {
    config.admin.user = '';
    config.admin.password = '';
    const { context } = contextFor(basic('', ''));
    assert.throws(() => guard.canActivate(context), /not configured/);
  });

  it('is not fooled by a password that is a prefix of the real one', () => {
    const { context } = contextFor(basic('owner', 'secreto'));
    assert.throws(() => guard.canActivate(context), /invalid/);
  });
});
