/**
 * @fileoverview Ponto de entrada da biblioteca googletype-osint.
 * Permite investigar contas Google a partir de e-mail ou Gaia ID com suporte a progresso em tempo real.
 */

import { HttpClient } from './core/client.js';
import { Session, parseTarget } from './core/session.js';
import { buildGeoJSON, saveGeoJSON } from './core/geojson.js';
import { resolveGaia } from './modules/gaia.js';
import { getAvatar } from './modules/avatar.js';
import { getMapsProfile } from './modules/maps.js';
import { checkCalendar } from './modules/calendar.js';
import { checkYouTube } from './modules/youtube.js';

export {
  HttpClient,
  Session,
  parseTarget,
  buildGeoJSON,
  saveGeoJSON,
  resolveGaia,
  getAvatar,
  getMapsProfile,
  checkCalendar,
  checkYouTube
};

/**
 * Orquestra uma investigação completa sobre um alvo (e-mail ou Gaia ID do Google).
 * 
 * @param {string} targetInput - E-mail ou Gaia ID numérico
 * @param {Object} [options]
 * @param {string} [options.cookies] - Cookies opcionais de sessão do Google
 * @param {number} [options.timeoutMs=10000] - Timeout por requisição em ms
 * @param {function({ module: string, status: 'running'|'done'|'error', data?: any }): void} [options.onProgress] - Callback de progresso
 * @returns {Promise<import('./core/types.js').InvestigationResult>}
 */
export async function investigateGoogle(targetInput, options = {}) {
  const start = Date.now();
  const target = parseTarget(targetInput);

  if (!target.isEmail && !target.isGaiaId) {
    throw new Error(`Alvo inválido: "${targetInput}". Informe um e-mail válido (ex: alvo@gmail.com) ou um Gaia ID numérico.`);
  }

  const session = new Session({
    cookies: options.cookies,
    timeoutMs: options.timeoutMs
  });

  const client = new HttpClient({
    cookies: options.cookies,
    timeoutMs: options.timeoutMs
  });

  const notify = (module, status, data) => {
    if (typeof options.onProgress === 'function') {
      try {
        options.onProgress({ module, status, data });
      } catch {
        // Ignora erro no callback de progresso
      }
    }
  };

  // Etapa 1: Resolução de Conta e Gaia ID
  notify('gaia', 'running');
  const gaiaResult = await resolveGaia(target, { client, session, timeoutMs: options.timeoutMs });
  notify('gaia', gaiaResult.error ? 'error' : 'done', gaiaResult);

  // Enriquecemos o target se um Gaia ID foi descoberto
  const enrichedTarget = {
    ...target,
    gaiaId: target.gaiaId || gaiaResult.gaiaId
  };

  // Etapa 2: Módulos paralelos (Avatar, Maps, Calendar, YouTube)
  notify('avatar', 'running');
  notify('maps', 'running');
  notify('calendar', 'running');
  notify('youtube', 'running');

  const [avatarResult, mapsResult, calendarResult, youtubeResult] = await Promise.all([
    getAvatar(enrichedTarget, { client, timeoutMs: options.timeoutMs })
      .then(res => {
        notify('avatar', res.error ? 'error' : 'done', res);
        return res;
      }),
    getMapsProfile(enrichedTarget, { client, timeoutMs: options.timeoutMs })
      .then(res => {
        notify('maps', res.error ? 'error' : 'done', res);
        return res;
      }),
    checkCalendar(enrichedTarget, { client, timeoutMs: options.timeoutMs })
      .then(res => {
        notify('calendar', res.error ? 'error' : 'done', res);
        return res;
      }),
    checkYouTube(enrichedTarget, { client, timeoutMs: options.timeoutMs })
      .then(res => {
        notify('youtube', res.error ? 'error' : 'done', res);
        return res;
      })
  ]);

  return {
    target: enrichedTarget,
    avatar: avatarResult,
    gaia: gaiaResult,
    maps: mapsResult,
    calendar: calendarResult,
    youtube: youtubeResult,
    durationMs: Date.now() - start,
    timestamp: new Date().toISOString()
  };
}

