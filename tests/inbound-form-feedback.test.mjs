import test from 'node:test';
import assert from 'node:assert/strict';
import { inboundFormFailure } from '../src/lib/inbound-form-feedback.ts';

test('validation identifies only known fields, not raw server strings', () => {
  const result = inboundFormFailure(400, { fields: ['email', 'email', '<script>'], error: 'private server details' });
  assert.equal(result.kind, 'validation');
  assert.equal(result.message, 'Please check your email address and submit again.');
});
test('network and server failures never blame contact fields', () => {
  for (const status of [0, 200, 400, 500, 503]) {
    const result = inboundFormFailure(status, null);
    assert.equal(result.kind, 'service');
    assert.match(result.message, /details are still here/);
  }
});
test('rate limits and security failures give actionable recovery', () => {
  assert.match(inboundFormFailure(429, {}).message, /wait an hour/);
  assert.match(inboundFormFailure(403, {}).message, /refreshed check/);
});
