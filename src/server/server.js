/**
 * @fileoverview Servidor micro-API REST com streaming Server-Sent Events (SSE).
 * Permite integrar o googletype-osint com aplicações web e dashboards em tempo real.
 */

import http from 'node:http';
import { URL } from 'node:url';
import { styleText } from 'node:util';
import { investigateGoogle } from '../index.js';
import { initSSE, sendSSE } from './sse.js';

const HTML_LANDING = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>googletype-osint • Investigação Google em Tempo Real</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 2rem; }
    h1 { font-size: 2.2rem; color: #38bdf8; margin-bottom: 0.5rem; }
    p.lead { color: #94a3b8; font-size: 1.1rem; }
    .card { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #334155; }
    .search-box { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
    input[type="text"] { flex: 1; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #fff; font-size: 1rem; }
    button { background: #0284c7; color: white; border: none; padding: 0.85rem 1.75rem; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #0369a1; }
    #status { margin-bottom: 1rem; font-size: 0.95rem; color: #38bdf8; min-height: 1.5rem; }
    pre { background: #0b1120; padding: 1rem; border-radius: 8px; overflow-x: auto; color: #a5f3fc; font-family: monospace; font-size: 0.9rem; max-height: 500px; }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: #0284c7; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>⚡ googletype-osint</h1>
      <p class="lead">Investigação profunda de contas Google / Gmail com streaming SSE</p>
    </header>

    <div class="card">
      <div class="search-box">
        <input type="text" id="target" placeholder="Informe um e-mail (ex: alvo@gmail.com) ou Gaia ID..." autofocus />
        <button id="btnInvestigate">Investigar</button>
      </div>
      <div id="status">Aguardando alvo...</div>
    </div>

    <div class="card" id="resultsCard" style="display: none;">
      <h3 style="margin-bottom: 1rem; color: #38bdf8;">Resultado da Investigação</h3>
      <pre id="output">{}</pre>
    </div>
  </div>

  <script>
    const btn = document.getElementById('btnInvestigate');
    const input = document.getElementById('target');
    const status = document.getElementById('status');
    const output = document.getElementById('output');
    const resultsCard = document.getElementById('resultsCard');

    btn.addEventListener('click', () => {
      const target = input.value.trim();
      if (!target) return;

      resultsCard.style.display = 'block';
      output.textContent = 'Iniciando streaming...';
      status.textContent = 'Conectando ao stream de investigação...';

      const eventSource = new EventSource('/investigate?target=' + encodeURIComponent(target));

      eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        status.textContent = '[→] Módulo ' + data.module + ': ' + data.status;
      });

      eventSource.addEventListener('done', (e) => {
        const fullResult = JSON.parse(e.data);
        status.textContent = '✓ Investigação finalizada em ' + fullResult.durationMs + 'ms';
        output.textContent = JSON.stringify(fullResult, null, 2);
        eventSource.close();
      });

      eventSource.addEventListener('error', (e) => {
        status.textContent = '❌ Erro na conexão de streaming.';
        eventSource.close();
      });
    });
  </script>
</body>
</html>`;

/**
 * Cria o servidor HTTP da micro-API.
 * @returns {http.Server}
 */
export function createServer() {
  return http.createServer(async (req, res) => {
    // Configura CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url || '/', `http://${host}`);
    const pathname = parsedUrl.pathname;
    const targetParam = parsedUrl.searchParams.get('target');

    // Endpoint: Health Check
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }));
      return;
    }

    // Endpoint: Interface Web
    if (pathname === '/' && !targetParam) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML_LANDING);
      return;
    }

    // Endpoint: GeoJSON direto
    if (pathname === '/geojson') {
      if (!targetParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Parâmetro ?target= é obrigatório.' }));
        return;
      }

      try {
        const result = await investigateGoogle(targetParam);
        res.writeHead(200, { 'Content-Type': 'application/geo+json' });
        res.end(JSON.stringify(result.maps.geojson || { type: 'FeatureCollection', features: [] }, null, 2));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Endpoint: Investigação com Streaming SSE
    if (pathname === '/investigate') {
      if (!targetParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Parâmetro ?target= é obrigatório.' }));
        return;
      }

      initSSE(res);

      try {
        const result = await investigateGoogle(targetParam, {
          onProgress: (evt) => {
            sendSSE(res, 'progress', evt);
          }
        });

        sendSSE(res, 'done', result);
        res.end();
      } catch (err) {
        sendSSE(res, 'error', { message: err.message });
        res.end();
      }
      return;
    }

    // Rota não encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rota não encontrada' }));
  });
}

/**
 * Inicia o servidor HTTP em uma porta especificada.
 * @param {number} [port=3000]
 * @returns {http.Server}
 */
export function startServer(port = 3000) {
  const server = createServer();
  server.listen(port, () => {
    console.log(styleText(['bold', 'cyan'], `\n⚡ Servidor micro-API do googletype-osint iniciado na porta ${port}`));
    console.log(styleText('white', `   • Interface Web: http://localhost:${port}`));
    console.log(styleText('white', `   • Streaming SSE: http://localhost:${port}/investigate?target=alvo@gmail.com`));
    console.log(styleText('white', `   • GeoJSON:       http://localhost:${port}/geojson?target=alvo@gmail.com\n`));
  });
  return server;
}
