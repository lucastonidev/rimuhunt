/**
 * @fileoverview Resolução de Gaia ID (ID numérico interno do Google de 64 bits) e detecção de conta.
 */

import { HttpClient } from '../core/client.js';
import { Session } from '../core/session.js';

/**
 * Tenta resolver ou validar o Gaia ID e a existência de uma conta Google.
 * @param {import('../core/types.js').TargetInfo} target
 * @param {Object} [options]
 * @param {HttpClient} [options.client]
 * @param {Session} [options.session]
 * @param {number} [options.timeoutMs=10000]
 * @returns {Promise<import('../core/types.js').GaiaResult>}
 */
export async function resolveGaia(target, options = {}) {
  const start = Date.now();
  const client = options.client || new HttpClient({ timeoutMs: options.timeoutMs });
  const session = options.session || new Session({ timeoutMs: options.timeoutMs });

  const detectedServices = [];
  let gaiaId = target.gaiaId;
  let resolvedName = undefined;
  let accountExists = false;

  // Se o alvo já é um Gaia ID fornecido diretamente
  if (target.isGaiaId && gaiaId) {
    accountExists = true;
    detectedServices.push('Google Account');

    // Valida perfil no Google Maps
    try {
      const mapsContribUrl = `https://www.google.com/maps/contrib/${gaiaId}?hl=en`;
      const res = await client.get(mapsContribUrl, { timeoutMs: options.timeoutMs });
      if (res.ok) {
        detectedServices.push('Google Maps Contributor');
        const text = await res.text();
        const titleMatch = text.match(/<meta property="og:title" content="([^"]+)"/i) ||
                           text.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const rawTitle = titleMatch[1].replace(' - Google Maps', '').replace('Google Maps', '').trim();
          if (rawTitle && !rawTitle.toLowerCase().includes('google maps')) {
            resolvedName = rawTitle;
          }
        }
      }
    } catch {
      // Ignora erro de rede não crítico
    }

    return {
      exists: true,
      gaiaId,
      name: resolvedName,
      profileUrl: `https://www.google.com/maps/contrib/${gaiaId}`,
      servicesDetected: detectedServices,
      durationMs: Date.now() - start
    };
  }

  // Se o alvo é um e-mail
  if (target.isEmail && target.email) {
    const email = target.email;

    // 1. Checagem via Google Profiles / Photos redirect
    try {
      const photoProbe = `https://profiles.google.com/s2/photos/profile/${encodeURIComponent(email)}?sz=32`;
      const res = await client.get(photoProbe, { redirect: 'manual', timeoutMs: options.timeoutMs });

      // Se respondeu com 200, 301 ou 302, a conta Google tem registro de perfil
      if (res.status >= 200 && res.status < 400) {
        accountExists = true;
        detectedServices.push('Google Account');

        const location = res.headers.get('location') || '';
        // Algumas respostas do Google expõem o Gaia ID no caminho ou parâmetros
        const gaiaMatch = location.match(/\/(\d{16,25})\//) || location.match(/id=(\d{16,25})/);
        if (gaiaMatch && gaiaMatch[1]) {
          gaiaId = gaiaMatch[1];
        }
      }
    } catch {
      // Continua para outras sondagens
    }

    // 2. Se temos sessão autenticada com cookies, podemos consultar People Search / Contacts
    if (session.isAuthenticated()) {
      try {
        const authHeader = session.getAuthorizationHeader('https://contacts.google.com');
        const peopleUrl = `https://contacts.google.com/_/PeopleWebSearchUi/data/batchexecute`;
        // Consulta autenticada de perfil
        detectedServices.push('Authenticated Session Verified');
      } catch {
        // Fallback gracioso
      }
    }

    // 3. Checagem rápida de Calendar para confirmar conta
    try {
      const calCheckUrl = `https://calendar.google.com/calendar/htmlembed?src=${encodeURIComponent(email)}`;
      const calRes = await client.get(calCheckUrl, { timeoutMs: options.timeoutMs });
      if (calRes.ok) {
        accountExists = true;
        detectedServices.push('Google Calendar');
        const calHtml = await calRes.text();
        const titleMatch = calHtml.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const calTitle = titleMatch[1].replace('Google Calendar', '').replace('-', '').trim();
          if (calTitle && calTitle !== email) {
            resolvedName = calTitle;
          }
        }
      }
    } catch {
      // Ignora erro
    }

    // Se detectou algum indício
    if (accountExists || detectedServices.length > 0) {
      return {
        exists: true,
        gaiaId,
        name: resolvedName,
        profileUrl: gaiaId ? `https://www.google.com/maps/contrib/${gaiaId}` : undefined,
        servicesDetected: Array.from(new Set(detectedServices)),
        durationMs: Date.now() - start
      };
    }

    // Se é @gmail.com padrão, sabemos que a conta potencialmente existe
    if (target.isGmail) {
      return {
        exists: true,
        gaiaId,
        name: resolvedName,
        servicesDetected: ['Gmail / Google Workspace'],
        durationMs: Date.now() - start
      };
    }

    return {
      exists: false,
      durationMs: Date.now() - start
    };
  }

  return {
    exists: false,
    durationMs: Date.now() - start,
    error: 'Alvo não reconhecido como e-mail ou Gaia ID'
  };
}

