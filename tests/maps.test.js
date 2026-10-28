import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMapsHtml } from '../src/modules/maps.js';

test('parseMapsHtml extrai dados e status restrito de HTML do Maps', () => {
  const sampleHtml = `
    <html>
      <head><title>João Silva - Google Maps</title></head>
      <body>
        <div class="header">Level 6 Local Guide</div>
        <div>128 reviews</div>
        <div>45 photos</div>
        <script>
          window.APP_INITIALIZATION_STATE = [
            [-23.55052, -46.63330],
            [-22.90684, -43.17290]
          ];
        </script>
      </body>
    </html>
  `;

  const parsed = parseMapsHtml(sampleHtml, '104857602938475610293');

  assert.equal(parsed.localGuideLevel, 6);
  assert.equal(parsed.totalReviews, 128);
  assert.equal(parsed.totalPhotos, 45);
  assert.equal(parsed.isRestricted, false);
  assert.ok(parsed.reviews.length >= 2);
  assert.ok(parsed.reviews.some(r => r.coordinates.lat < -20));
});

test('parseMapsHtml detecta perfil restrito', () => {
  const restrictedHtml = `<html><body>This user profile is restricted</body></html>`;
  const parsed = parseMapsHtml(restrictedHtml, '104857602938475610293');

  assert.equal(parsed.isRestricted, true);
});
