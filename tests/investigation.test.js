import { test } from 'node:test';
import assert from 'node:assert/strict';
import { investigateGoogle } from '../src/index.js';

test('investigateGoogle rejeita alvo vazio ou com formato inválido', async () => {
  await assert.rejects(
    async () => {
      await investigateGoogle('alvo_invalido_sem_formato');
    },
    /Alvo inválido/
  );
});

test('investigateGoogle dispara callbacks de progresso onProgress', async () => {
  const steps = [];

  // Alvo sintetizado com timeout curto
  const result = await investigateGoogle('test.account@gmail.com', {
    timeoutMs: 1500,
    onProgress: ({ module, status }) => {
      steps.push({ module, status });
    }
  });

  assert.ok(steps.length > 0);
  assert.ok(steps.some(s => s.module === 'gaia'));
  assert.equal(typeof result.durationMs, 'number');
  assert.ok(result.timestamp);
  assert.equal(result.target.isEmail, true);
  assert.equal(result.target.email, 'test.account@gmail.com');
});
