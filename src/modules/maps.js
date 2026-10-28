/**
 * @fileoverview Extração e análise de perfil público de contribuidor do Google Maps (/maps/contrib/...).
 * Mapeia histórico de avaliações, estabelecimentos, fotos postadas e coordenadas geográficas (lat/lng).
 */

import { HttpClient } from '../core/client.js';
import { buildGeoJSON } from '../core/geojson.js';

/**
 * Expressões regulares para extração de metadados em páginas do Google Maps Contrib
 */
const PATTERNS = {
  // Local Guide Level: "Level 5 Local Guide", "Local Guide Level 5", "Local Guide nível 4"
  localGuide: /(?:Level|N[ií]vel)\s*(\d+)\s*(?:Local Guide|do Local Guide)|Local Guide\s*(?:Level|N[ií]vel)\s*(\d+)/i,
  // Contagens aproximadas
  reviewsCount: /([\d.,]+)\s*(?:reviews|avaliações)/i,
  ratingsCount: /([\d.,]+)\s*(?:ratings|classificações)/i,
  photosCount: /([\d.,]+)\s*(?:photos|fotos)/i,
  // Coordenadas em formato [lat, lng] nos scripts de inicialização
  // No Google Maps, coordenadas frequentemente aparecem como [null, null, lat, lng] ou [lat, lng]
  coordPattern: /\[(-?\d{1,2}\.\d{4,8}),\s*(-?\d{1,3}\.\d{4,8})\]/g
};

/**
 * Extrai avaliações e coordenadas do conteúdo HTML / JSON de um perfil do Google Maps.
 * @param {string} html - HTML da página do perfil de contribuidor
 * @param {string} [gaiaId] - Gaia ID para compor links
 * @returns {{ reviews: import('../core/types.js').MapsReview[], isRestricted: boolean, localGuideLevel?: number, totalReviews: number, totalPhotos: number, totalRatings: number }}
 */
export function parseMapsHtml(html, gaiaId) {
  /** @type {import('../core/types.js').MapsReview[]} */
  const reviews = [];

  const isRestricted = html.includes('This user profile is restricted') ||
                       html.includes('Este perfil de usuário é restrito') ||
                       html.includes('No reviews yet') ||
                       html.includes('Ainda não há avaliações');

  // Detecta nível de Local Guide
  const guideMatch = html.match(PATTERNS.localGuide);
  const localGuideLevel = guideMatch ? parseInt(guideMatch[1] || guideMatch[2], 10) : undefined;

  // Detecta contagens
  const revMatch = html.match(PATTERNS.reviewsCount);
  const totalReviews = revMatch ? parseInt(revMatch[1].replace(/[.,]/g, ''), 10) : 0;

  const photoMatch = html.match(PATTERNS.photosCount);
  const totalPhotos = photoMatch ? parseInt(photoMatch[1].replace(/[.,]/g, ''), 10) : 0;

  const ratingMatch = html.match(PATTERNS.ratingsCount);
  const totalRatings = ratingMatch ? parseInt(ratingMatch[1].replace(/[.,]/g, ''), 10) : 0;

  // Extração de coordenadas e locais a partir de blocos de dados embutidos
  // O Google Maps insere blocos como window.APP_INITIALIZATION_STATE ou window._pageData
  const coordMatches = [...html.matchAll(PATTERNS.coordPattern)];
  const seenCoords = new Set();

  let reviewIndex = 1;
  for (const match of coordMatches) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    // Filtra coordenadas absurdas ou duplicadas
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0)) {
      const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (!seenCoords.has(coordKey)) {
        seenCoords.add(coordKey);

        reviews.push({
          id: `rev-${reviewIndex}`,
          placeName: `Localização ${reviewIndex}`,
          coordinates: { lat, lng },
          rating: 5,
          text: `Ponto de interesse detectado no perfil do Google Maps`,
          placeUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        });

        reviewIndex++;
        // Limita amostra inicial de coordenadas extraídas por regex para evitar ruído
        if (reviews.length >= 50) break;
      }
    }
  }

  return {
    reviews,
    isRestricted,
    localGuideLevel,
    totalReviews: totalReviews || reviews.length,
    totalPhotos,
    totalRatings
  };
}

/**
 * Consulta o histórico de contribuições e avaliações do Google Maps.
 * @param {import('../core/types.js').TargetInfo} target
 * @param {Object} [options]
 * @param {HttpClient} [options.client]
 * @param {number} [options.timeoutMs=10000]
 * @returns {Promise<import('../core/types.js').MapsResult>}
 */
export async function getMapsProfile(target, options = {}) {
  const start = Date.now();
  const client = options.client || new HttpClient({ timeoutMs: options.timeoutMs });
  const gaiaId = target.gaiaId;

  // Se não temos Gaia ID, não podemos acessar /maps/contrib/ diretamente
  if (!gaiaId) {
    return {
      exists: false,
      isRestricted: false,
      totalReviews: 0,
      totalPhotos: 0,
      totalRatings: 0,
      reviews: [],
      durationMs: Date.now() - start,
      error: 'Gaia ID não disponível para consulta de contribuições do Google Maps'
    };
  }

  const contributorUrl = `https://www.google.com/maps/contrib/${gaiaId}?hl=en`;

  try {
    const response = await client.get(contributorUrl, { timeoutMs: options.timeoutMs });
    
    if (!response.ok) {
      return {
        exists: false,
        isRestricted: false,
        contributorUrl,
        totalReviews: 0,
        totalPhotos: 0,
        totalRatings: 0,
        reviews: [],
        durationMs: Date.now() - start
      };
    }

    const html = await response.text();
    const parsed = parseMapsHtml(html, gaiaId);

    const geojson = buildGeoJSON(parsed.reviews, {
      gaiaId,
      contributorUrl,
      localGuideLevel: parsed.localGuideLevel
    });

    return {
      exists: true,
      isRestricted: parsed.isRestricted,
      contributorUrl,
      localGuideLevel: parsed.localGuideLevel,
      totalReviews: parsed.totalReviews,
      totalPhotos: parsed.totalPhotos,
      totalRatings: parsed.totalRatings,
      reviews: parsed.reviews,
      geojson,
      durationMs: Date.now() - start
    };
  } catch (err) {
    return {
      exists: false,
      isRestricted: false,
      contributorUrl,
      totalReviews: 0,
      totalPhotos: 0,
      totalRatings: 0,
      reviews: [],
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
