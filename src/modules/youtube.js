/**
 * @fileoverview Detecção de canal do YouTube vinculado, handle (@nome) e playlists públicas.
 */

import { HttpClient } from '../core/client.js';

/**
 * Expressões regulares para extrair metadados básicos de páginas do YouTube
 */
const YT_PATTERNS = {
  channelTitle: /<meta property="og:title" content="([^"]+)"/i,
  description: /<meta property="og:description" content="([^"]+)"/i,
  image: /<meta property="og:image" content="([^"]+)"/i,
  channelId: /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
  playlistLink: /\/playlist\?list=(PL[a-zA-Z0-9_-]+)/g
};

/**
 * Investiga presença e dados públicos no YouTube com base no username ou Gaia ID.
 * @param {import('../core/types.js').TargetInfo} target
 * @param {Object} [options]
 * @param {HttpClient} [options.client]
 * @param {number} [options.timeoutMs=10000]
 * @returns {Promise<import('../core/types.js').YouTubeResult>}
 */
export async function checkYouTube(target, options = {}) {
  const start = Date.now();
  const client = options.client || new HttpClient({ timeoutMs: options.timeoutMs });

  const username = target.username;
  const gaiaId = target.gaiaId;

  if (!username && !gaiaId) {
    return {
      exists: false,
      playlists: [],
      durationMs: Date.now() - start,
      error: 'Sem identificador para checagem do YouTube'
    };
  }

  // Tenta verificar pelo handle @username
  if (username) {
    try {
      const handleUrl = `https://www.youtube.com/@${encodeURIComponent(username)}`;
      const response = await client.get(handleUrl, { timeoutMs: options.timeoutMs });

      if (response.ok) {
        const html = await response.text();
        const titleMatch = html.match(YT_PATTERNS.channelTitle);
        const descMatch = html.match(YT_PATTERNS.description);
        const imageMatch = html.match(YT_PATTERNS.image);
        const idMatch = html.match(YT_PATTERNS.channelId);

        // Se a página retornou um título de canal válido
        if (titleMatch && titleMatch[1] && !titleMatch[1].includes('404')) {
          const channelTitle = titleMatch[1];
          const channelId = idMatch ? idMatch[1] : undefined;
          const channelUrl = channelId ? `https://www.youtube.com/channel/${channelId}` : handleUrl;

          // Extrai menções de playlists públicas
          /** @type {import('../core/types.js').YouTubePlaylist[]} */
          const playlists = [];
          const playlistMatches = [...html.matchAll(YT_PATTERNS.playlistLink)];
          const seenPlaylists = new Set();

          for (const match of playlistMatches) {
            const listId = match[1];
            if (!seenPlaylists.has(listId)) {
              seenPlaylists.add(listId);
              playlists.push({
                id: listId,
                title: `Playlist pública (${listId})`,
                url: `https://www.youtube.com/playlist?list=${listId}`
              });
              if (playlists.length >= 10) break;
            }
          }

          return {
            exists: true,
            channelId,
            channelUrl,
            title: channelTitle,
            customUrl: `@${username}`,
            avatarUrl: imageMatch ? imageMatch[1] : undefined,
            playlists,
            durationMs: Date.now() - start
          };
        }
      }
    } catch {
      // Falha não bloqueante
    }
  }

  return {
    exists: false,
    playlists: [],
    durationMs: Date.now() - start
  };
}

