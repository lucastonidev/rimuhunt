/**
 * @fileoverview Cliente HTTP resiliente para consultas OSINT aos endpoints do Google.
 * Utiliza fetch nativo, rotação de User-Agents modernos, controle de timeout via AbortController
 * e suporte opcional a cookies de sessão.
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
];

/**
 * Retorna um User-Agent aleatório da lista.
 * @returns {string}
 */
export function getRandomUserAgent() {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

/**
 * Cliente HTTP para requisições no Google
 */
export class HttpClient {
  /**
   * @param {Object} [options]
   * @param {string} [options.cookies] - Cookies de sessão do Google (ex: "SID=...; HSID=...")
   * @param {number} [options.timeoutMs=10000] - Timeout padrão por requisição em milissegundos
   * @param {Record<string, string>} [options.defaultHeaders] - Headers adicionais padrão
   */
  constructor(options = {}) {
    this.cookies = options.cookies || '';
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.defaultHeaders = options.defaultHeaders || {};
  }

  /**
   * Monta headers realistas de navegador para as requisições.
   * @param {Record<string, string>} [customHeaders={}]
   * @returns {Record<string, string>}
   */
  buildHeaders(customHeaders = {}) {
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      ...this.defaultHeaders,
      ...customHeaders
    };

    if (this.cookies && !headers['Cookie']) {
      headers['Cookie'] = this.cookies;
    }

    return headers;
  }

  /**
   * Executa requisição HTTP com AbortController e timeout.
   * @param {string} url - URL de destino
   * @param {RequestInit & { timeoutMs?: number }} [init={}]
   * @returns {Promise<Response>}
   */
  async request(url, init = {}) {
    const timeout = init.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const mergedHeaders = this.buildHeaders(
      init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init.headers || {})
    );

    try {
      const response = await fetch(url, {
        ...init,
        headers: mergedHeaders,
        signal: init.signal || controller.signal
      });
      return response;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Tempo limite de ${timeout}ms excedido para a URL: ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Atalho para requisição GET
   * @param {string} url
   * @param {RequestInit & { timeoutMs?: number }} [init]
   * @returns {Promise<Response>}
   */
  async get(url, init = {}) {
    return this.request(url, { ...init, method: 'GET' });
  }

  /**
   * Atalho para requisição HEAD
   * @param {string} url
   * @param {RequestInit & { timeoutMs?: number }} [init]
   * @returns {Promise<Response>}
   */
  async head(url, init = {}) {
    return this.request(url, { ...init, method: 'HEAD' });
  }

  /**
   * Obtém corpo como texto
   * @param {string} url
   * @param {RequestInit & { timeoutMs?: number }} [init]
   * @returns {Promise<string>}
   */
  async getText(url, init = {}) {
    const res = await this.get(url, init);
    return res.text();
  }

  /**
   * Obtém corpo como JSON
   * @param {string} url
   * @param {RequestInit & { timeoutMs?: number }} [init]
   * @returns {Promise<any>}
   */
  async getJson(url, init = {}) {
    const res = await this.get(url, {
      ...init,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        ...(init.headers || {})
      }
    });
    return res.json();
  }
}
