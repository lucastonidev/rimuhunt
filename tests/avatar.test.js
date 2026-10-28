import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhanceAvatarUrl, isDefaultGoogleAvatar } from '../src/modules/avatar.js';

test('enhanceAvatarUrl converte =s96-c para =s0 (HD Original)', () => {
  const inputUrl = 'https://lh3.googleusercontent.com/a/ACg8ocLxyz123=s96-c';
  const { originalHdUrl, highResUrl } = enhanceAvatarUrl(inputUrl);

  assert.equal(originalHdUrl, 'https://lh3.googleusercontent.com/a/ACg8ocLxyz123=s0');
  assert.equal(highResUrl, 'https://lh3.googleusercontent.com/a/ACg8ocLxyz123=s1024');
});

test('enhanceAvatarUrl adiciona =s0 caso a URL não possua parâmetro de dimensão', () => {
  const inputUrl = 'https://lh3.googleusercontent.com/a/ACg8ocBareAvatar';
  const { originalHdUrl, highResUrl } = enhanceAvatarUrl(inputUrl);

  assert.equal(originalHdUrl, 'https://lh3.googleusercontent.com/a/ACg8ocBareAvatar=s0');
  assert.equal(highResUrl, 'https://lh3.googleusercontent.com/a/ACg8ocBareAvatar=s1024');
});

test('isDefaultGoogleAvatar identifica avatares padrões de silhueta e letra', () => {
  assert.equal(isDefaultGoogleAvatar('https://lh3.googleusercontent.com/a/default-user=s96'), true);
  assert.equal(isDefaultGoogleAvatar('https://lh3.googleusercontent.com/ogk/default_avatar'), true);
  assert.equal(isDefaultGoogleAvatar('https://lh3.googleusercontent.com/a/ACg8ocRealUserPhoto=s96-c'), false);
});

