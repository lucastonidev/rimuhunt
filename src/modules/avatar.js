/**
 * @fileoverview Módulo de extração e aprimoramento de fotos de perfil (Avatar HD) do Google.
 * Converte URLs para resolução original uncropped (=s0) sem compressão ou recorte.
 */

import { HttpClient } from '../core/client.js';

/**
 * Converte qualquer URL de avatar do Google (lh3.googleusercontent.com)
 * para a versão original sem cortes em alta definição.
 * @param {string} url - URL do avatar do Google
 * @returns {{ originalHdUrl: string, highResUrl: string }}
 */
export function enhanceAvatarUrl(url) {
  if (!url || typeof url !== 'string') {
    return { originalHdUrl: url, highResUrl: url };
  }

  // Padrões do Google: =s96-c, =s32, =s512, =w120-h120, etc.
  const sizeParamRegex = /(=[swh]\d+(-[a-z0-9]+)*|\/s\d+(-[a-z0-9]+)*)/gi;

  let originalHdUrl = url;
  let highResUrl = url;

  if (url.includes('googleusercontent.com')) {
    if (sizeParamRegex.test(url)) {
      originalHdUrl = url.replace(sizeParamRegex, '=s0');
      highResUrl = url.replace(sizeParamRegex, '=s1024');
    } else {
      originalHdUrl = `${url}=s0`;
      highResUrl = `${url}=s1024`;
    }
  }

  return { originalHdUrl, highResUrl };
}

/**
 * Checa se uma URL de avatar do Google é um avatar padrão (letra de inicial ou silhueta genérica).
 * @param {string} url
 * @returns {boolean}
 */
export function isDefaultGoogleAvatar(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('default-user') ||
    lower.includes('/default_avatar') ||
    lower.includes('silhouette') ||
    lower.includes('ogk/default') ||
    lower.includes('c/photo.jpg')
  );
}

/**
 * Extrai o avatar associado a uma conta Google pelo e-mail ou Gaia ID.
 * @param {import('../core/types.js').TargetInfo} target
 * @param {Object} [options]
 * @param {HttpClient} [options.client]
 * @param {number} [options.timeoutMs=10000]
 * @returns {Promise<import('../core/types.js').AvatarResult>}
 */
export async function getAvatar(target, options = {}) {
  const start = Date.now();
  const client = options.client || new HttpClient({ timeoutMs: options.timeoutMs });
  const identifier = target.email || target.gaiaId || target.raw;

  if (!identifier) {
    return {
      exists: false,
      isDefault: true,
      durationMs: Date.now() - start,
      error: 'Identificador inválido para busca de avatar'
    };
  }

  try {
    // Endpoint público de resolução de foto do Google
    const probeUrl = `https://profiles.google.com/s2/photos/profile/${encodeURIComponent(identifier)}?sz=512`;

    // Realiza GET permitindo redirects para capturar a URL final em lh3.googleusercontent.com
    const response = await client.get(probeUrl, {
      redirect: 'follow',
      timeoutMs: options.timeoutMs
    });

    const finalUrl = response.url;
    const isSuccess = response.ok;

    if (!isSuccess || !finalUrl) {
      return {
        exists: false,
        isDefault: true,
        durationMs: Date.now() - start
      };
    }

    const isDefault = isDefaultGoogleAvatar(finalUrl);
    const { originalHdUrl, highResUrl } = enhanceAvatarUrl(finalUrl);

    return {
      exists: true,
      isDefault,
      url: finalUrl,
      originalHdUrl,
      highResUrl,
      durationMs: Date.now() - start
    };
  } catch (err) {
    return {
      exists: false,
      isDefault: true,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
