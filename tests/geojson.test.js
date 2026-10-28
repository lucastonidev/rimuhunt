import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidCoordinate, buildGeoJSON } from '../src/core/geojson.js';

test('isValidCoordinate valida latitude (-90..90) e longitude (-180..180)', () => {
  assert.equal(isValidCoordinate(-23.5505, -46.6333), true); // São Paulo
  assert.equal(isValidCoordinate(40.7128, -74.0060), true); // New York
  assert.equal(isValidCoordinate(95, 20), false); // Latitude fora de faixa
  assert.equal(isValidCoordinate(10, 200), false); // Longitude fora de faixa
  assert.equal(isValidCoordinate(0, 0), false); // Ponto nulo (0, 0)
  assert.equal(isValidCoordinate(NaN, -45), false);
});

test('buildGeoJSON converte avaliações em FeatureCollection com bbox e metadata', () => {
  /** @type {import('../src/core/types.js').MapsReview[]} */
  const reviews = [
    {
      id: 'rev-1',
      placeName: 'Café Central',
      address: 'Rua Augusta, 100',
      coordinates: { lat: -23.5505, lng: -46.6333 },
      rating: 5,
      text: 'Excelente café'
    },
    {
      id: 'rev-2',
      placeName: 'Parque Ibirapuera',
      address: 'Av. Paulista',
      coordinates: { lat: -23.5874, lng: -46.6576 },
      rating: 4,
      text: 'Ótimo lugar para caminhar'
    }
  ];

  const geojson = buildGeoJSON(reviews, { target: 'teste@gmail.com' });

  assert.equal(geojson.type, 'FeatureCollection');
  assert.equal(geojson.features.length, 2);
  assert.equal(geojson.features[0].type, 'Feature');
  assert.equal(geojson.features[0].geometry.type, 'Point');
  // RFC 7946: [lng, lat]
  assert.deepEqual(geojson.features[0].geometry.coordinates, [-46.6333, -23.5505]);
  assert.equal(geojson.features[0].properties.placeName, 'Café Central');
  assert.ok(Array.isArray(geojson.bbox));
  assert.equal(geojson.metadata.target, 'teste@gmail.com');
  assert.equal(geojson.metadata.totalPoints, 2);
});
