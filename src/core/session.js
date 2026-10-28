/**
 * @fileoverview Gerenciamento de sessão, autenticação e normalização de alvos.
 * Suporta modo anônimo e modo autenticado (com cookies do Google e cálculo de SAPISIDHASH).
 */

import crypto from 'node:crypto';

/**
 * Normaliza e categoriza a entrada do alvo.
 * @param {string} input - E-mail ou Gaia ID numérico
 * @returns {import('./types.js').TargetInfo}
 */
export function parseTarget(input) {
  const raw = String(input || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const gaiaRegex = /^\d{16,25}$/;

  const isEmail = emailRegex.test(raw);
  const isGaiaId = gaiaRegex.test(raw);

  if (isEmail) {
    const [username, domain] = raw.toLowerCase().split('@');
    const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';

    return {
      raw,
      isEmail: true,
      isGaiaId: false,
      email: `${username}@${domain}`,
      username,
      domain,
      isGmail,
      gaiaId: undefined
    };
  }

  if (isGaiaId) {
    return {
      raw,
      isEmail: false,
      isGaiaId: true,
      gaiaId: raw,
      email: undefined
    };
  }

  return {
    raw,
    isEmail: false,
    isGaiaId: false
  };
}

/**
 * Extrai e estrutura os cookies fornecidos como string.
 * @param {string} cookieString - String de cookies HTTP
 * @returns {Record<string, string>}
 */
export function parseCookieString(cookieString = '') {
  /** @type {Record<string, string>} */
  const cookies = {};
  if (!cookieString) return cookies;

  const pairs = cookieString.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx !== -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      if (key) {
        cookies[key] = val;
      }
    }
  }

  return cookies;
}

/**
 * Gera o header de autorização SAPISIDHASH para chamadas internas do Google.
 * Usado pelo Google em chamadas autenticadas na Web:
 * Authorization: SAPISIDHASH <timestamp>_<SHA1(timestamp + " " + sapisid + " " + origin)>
 * 
 * @param {string} sapisid - Valor do cookie SAPISID ou 1PSAPISID
 * @param {string} [origin="https://myaccount.google.com"] - Origem da requisição
 * @returns {string} Cabeçalho formatado
 */
export function generateSapisidHash(sapisid, origin = 'https://myaccount.google.com') {
  if (!sapisid) return '';
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp} ${sapisid} ${origin}`;
  const sha1 = crypto.createHash('sha1').update(payload).digest('hex');
  return `SAPISIDHASH ${timestamp}_${sha1}`;
}

/**
 * Classe de Sessão para orquestrar requisições e tokens.
 */
export class Session {
  /**
   * @param {Object} [options]
   * @param {string} [options.cookies] - Cookies do Google
   * @param {number} [options.timeoutMs=10000] - Timeout
   */
  constructor(options = {}) {
    this.rawCookies = options.cookies || '';
    this.parsedCookies = parseCookieString(this.rawCookies);
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  /**
   * Verifica se a sessão possui cookies de autenticação do Google.
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(
      (this.parsedCookies['SAPISID'] || this.parsedCookies['__Secure-1PSAPISID'] || this.parsedCookies['SID'])
    );
  }

  /**
   * Obtém o token de autorização SAPISIDHASH caso disponível.
   * @param {string} [origin]
   * @returns {string}
   */
  getAuthorizationHeader(origin) {
    const sapisid = this.parsedCookies['SAPISID'] || this.parsedCookies['__Secure-1PSAPISID'];
    return sapisid ? generateSapisidHash(sapisid, origin) : '';
  }
}

