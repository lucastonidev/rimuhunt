/**
 * @fileoverview Emissor de Server-Sent Events (SSE) sobre conexões HTTP nativas.
 */

/**
 * Inicializa a conexão HTTP como stream de Server-Sent Events.
 * @param {import('node:http').ServerResponse} res
 */
export function initSSE(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.write(': sse-connection-open\n\n');
}

/**
 * Envia um evento SSE formatado.
 * @param {import('node:http').ServerResponse} res
 * @param {string} event - Nome do evento (ex: 'progress', 'done', 'error')
 * @param {any} data - Dados a serializar em JSON
 */
export function sendSSE(res, event, data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`event: ${event}\ndata: ${payload}\n\n`);
}

