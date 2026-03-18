import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSafeObjectPath,
  getUploadConstraints,
  sanitizePlainText,
  sanitizeSearchQuery,
  sanitizeUserContent,
  validateAvatarURL,
  validateWebsiteURL,
} from '../lib/security.js';

test('sanitizeUserContent strips HTML tags', () => {
  assert.equal(sanitizeUserContent('<script>alert(1)</script>Hello <b>world</b>'), 'alert(1)Hello world');
});

test('sanitizePlainText collapses repeated whitespace', () => {
  assert.equal(sanitizePlainText('  hello   there  '), 'hello there');
});

test('sanitizeSearchQuery strips filter metacharacters', () => {
  assert.equal(sanitizeSearchQuery('name,%_*(admin)'), 'name admin');
});

test('validateWebsiteURL accepts only http and https URLs', () => {
  assert.equal(validateWebsiteURL('https://example.com/docs')?.startsWith('https://example.com/docs'), true);
  assert.equal(validateWebsiteURL('javascript:alert(1)'), null);
});

test('validateAvatarURL requires https', () => {
  assert.equal(validateAvatarURL('https://images.example.com/avatar.png')?.startsWith('https://images.example.com/avatar.png'), true);
  assert.equal(validateAvatarURL('http://images.example.com/avatar.png'), null);
});

test('getUploadConstraints enforces allowlist', () => {
  assert.deepEqual(getUploadConstraints('image/png'), { mediaType: 'image', maxBytes: 10 * 1024 * 1024 });
  assert.equal(getUploadConstraints('application/pdf'), null);
});

test('buildSafeObjectPath uses generated extension instead of user filename', () => {
  assert.equal(buildSafeObjectPath('abc123', 'image/png'), 'abc123/upload.png');
});
