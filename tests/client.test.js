import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient, getRandomUserAgent } from '../src/core/client.js';

test('getRandomUserAgent retorna string de navegador válida', () => {
  const ua = getRandomUserAgent();
  assert.equal(typeof ua, 'string');
  assert.ok(ua.includes('Mozilla/5.0'));
});

test('HttpClient monta headers incluindo User-Agent e cookies', () => {
  const client = new HttpClient({
    cookies: 'SID=sample_sid; HSID=sample_hsid'
  });

  const headers = client.buildHeaders({ 'X-Custom': 'test-val' });
  assert.equal(headers['Cookie'], 'SID=sample_sid; HSID=sample_hsid');
  assert.equal(headers['X-Custom'], 'test-val');
  assert.ok(headers['User-Agent'].includes('Mozilla'));
});
