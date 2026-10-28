/**
 * @fileoverview Conversor e gerador de GeoJSON para avaliações e pontos de interesse do Google Maps.
 * Em conformidade com a especificação RFC 7946.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Valida se um par de coordenadas é numérico e está dentro dos limites do globo terrestre.
 * @param {number} lat - Latitude (-90 a 90)
 * @param {number} lng - Longitude (-180 a 180)
 * @returns {boolean}
 */
export function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * Converte uma lista de avaliações do Google Maps em um objeto GeoJSON FeatureCollection.
 * @param {import('./types.js').MapsReview[]} reviews - Lista de avaliações extraídas
 * @param {Object} [metadata={}] - Metadados adicionais para incluir na coleção
 * @returns {import('./types.js').GeoJSONFeatureCollection}
 */
export function buildGeoJSON(reviews = [], metadata = {}) {
  /** @type {import('./types.js').GeoJSONFeature[]} */
  const features = [];

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const review of reviews) {
    const lat = review.coordinates?.lat;
    const lng = review.coordinates?.lng;

    if (!isValidCoordinate(lat, lng)) {
      continue;
    }

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))]
      },
      properties: {
        id: review.id || undefined,
        placeName: review.placeName,
        address: review.address || null,
        rating: review.rating ?? null,
        text: review.text || null,
        date: review.date || null,
        photosCount: Array.isArray(review.photos) ? review.photos.length : 0,
        photos: review.photos || [],
        placeUrl: review.placeUrl || null
      }
    });
  }

  const hasPoints = features.length > 0;
  const bbox = hasPoints ? [minLng, minLat, maxLng, maxLat] : undefined;

  return {
    type: 'FeatureCollection',
    features,
    bbox,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalPoints: features.length,
      ...metadata
    }
  };
}

/**
 * Salva a coleção GeoJSON em disco de forma assíncrona.
 * @param {import('./types.js').GeoJSONFeatureCollection} geojson
 * @param {string} destinationPath - Caminho de saída
 * @returns {Promise<string>} Caminho resolvido do arquivo salvo
 */
export async function saveGeoJSON(geojson, destinationPath) {
  const resolvedPath = path.resolve(destinationPath);
  const dir = path.dirname(resolvedPath);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(resolvedPath, JSON.stringify(geojson, null, 2), 'utf-8');

  return resolvedPath;
}
