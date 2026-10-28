import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTarget, parseCookieString, generateSapisidHash, Session } from '../src/core/session.js';

test('parseTarget identifica endereço @gmail.com corretamente', () => {
  const target = parseTarget('Usuario.Teste@gmail.com');
  assert.equal(target.isEmail, true);
  assert.equal(target.isGaiaId, false);
  assert.equal(target.username, 'usuario.teste');
  assert.equal(target.domain, 'gmail.com');
  assert.equal(target.isGmail, true);
});

test('parseTarget identifica Gaia ID numérico de 64 bits', () => {
  const target = parseTarget('104857602938475610293');
  assert.equal(target.isEmail, false);
  assert.equal(target.isGaiaId, true);
  assert.equal(target.gaiaId, '104857602938475610293');
});

test('parseCookieString decompõe cookies em pares chave/valor', () => {
  const cookieStr = 'SID=abc123xyz; HSID=def456uvw; SAPISID=sec789';
  const cookies = parseCookieString(cookieStr);
  assert.equal(cookies['SID'], 'abc123xyz');
  assert.equal(cookies['HSID'], 'def456uvw');
  assert.equal(cookies['SAPISID'], 'sec789');
});

test('generateSapisidHash gera formato SAPISIDHASH timestamp_sha1', () => {
  const hash = generateSapisidHash('my_sapisid_token', 'https://example.com');
  assert.ok(hash.startsWith('SAPISIDHASH '));
  assert.match(hash, /^SAPISIDHASH \d+_[a-f0-9]{40}$/);
});

test('Session detecta status autenticado com cookie SAPISID', () => {
  const unauthSession = new Session();
  assert.equal(unauthSession.isAuthenticated(), false);

  const authSession = new Session({ cookies: 'SAPISID=sample_token' });
  assert.equal(authSession.isAuthenticated(), true);
  assert.ok(authSession.getAuthorizationHeader().startsWith('SAPISIDHASH '));
});

