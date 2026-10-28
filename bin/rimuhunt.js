#!/usr/bin/env node

/**
 * @fileoverview Ponto de entrada executável do googletype-osint CLI.
 */

import { runCli } from '../src/cli/runner.js';

runCli().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});

