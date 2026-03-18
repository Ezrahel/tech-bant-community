import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateLoginPayload,
  validateReportPayload,
  validateSignupPayload,
} from '../lib/validation.js';

test('validateLoginPayload normalizes email and preserves otp', () => {
  const result = validateLoginPayload({ email: ' USER@Example.com ', password: 'secret123', otpCode: '123456' });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.email, 'user@example.com');
    assert.equal(result.data.otpCode, '123456');
  }
});

test('validateLoginPayload rejects malformed otp', () => {
  const result = validateLoginPayload({ email: 'user@example.com', password: 'secret123', otpCode: '12a456' });
  assert.equal(result.ok, false);
});

test('validateSignupPayload enforces minimum password length', () => {
  const result = validateSignupPayload({ email: 'user@example.com', password: 'short', name: 'Test User' });
  assert.equal(result.ok, false);
});

test('validateSignupPayload sanitizes name input', () => {
  const result = validateSignupPayload({ email: 'user@example.com', password: 'longenough', name: '<b>Jane</b>' });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.name, 'Jane');
  }
});

test('validateReportPayload allows one target only', () => {
  const result = validateReportPayload({ post_id: 'p1', comment_id: 'c1', reason: 'spam' });
  assert.equal(result.ok, false);
});

test('validateReportPayload sanitizes reason text', () => {
  const result = validateReportPayload({ post_id: 'p1', reason: '<b>spam</b>' });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.reason, 'spam');
  }
});
