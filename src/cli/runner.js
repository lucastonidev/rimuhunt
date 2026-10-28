/**
 * @fileoverview Orquestrador de linha de comando (CLI) para execução via terminal.
 */

import { parseArgs, styleText } from 'node:util';
import fs from 'node:fs/promises';
import { renderBanner } from './banner.js';
import { formatReport } from './formatters.js';
import { investigateGoogle } from '../index.js';
import { saveGeoJSON } from '../core/geojson.js';
import { startServer } from '../server/server.js';

const HELP_TEXT = `
USO:
  npx googletype <alvo> [opções]
  node bin/googletype.js <alvo> [opções]

ALVOS SUPORTADOS:
  alvo@gmail.com             Endereço de e-mail do Google (Gmail ou Workspace)
  104857602938475610293      Gaia ID numérico do Google (64 bits)

OPÇÕES:
  --geojson                  Gera saída em formato GeoJSON (RFC 7946) com os pontos do Maps
  --json                     Exibe os dados brutos consolidados em formato JSON
  -o, --output <arquivo>     Salva o resultado ou GeoJSON diretamente no arquivo especificado
  --cookies <string>         Cookies de sessão do Google ("SID=...; HSID=...") para dados aprofundados
  --timeout <ms>             Tempo limite por requisição em milissegundos (padrão: 10000)
  --server [porta]           Inicia a micro-API REST com streaming SSE (padrão: porta 3000)
  -h, --help                 Exibe esta ajuda interativa
  -v, --version              Exibe a versão atual do googletype-osint

EXEMPLOS:
  npx googletype investigado@gmail.com
  npx googletype 104857602938475610293 --geojson -o mapa_alvo.geojson
  npx googletype alvo@gmail.com --json > resultado.json
  npx googletype --server 8080
`;

/**
 * Ponto de entrada do executor CLI.
 * @param {string[]} [argv=process.argv.slice(2)]
 */
export async function runCli(argv = process.argv.slice(2)) {
  const optionsConfig = {
    help: { type: 'boolean', short: 'h', default: false },
    version: { type: 'boolean', short: 'v', default: false },
    json: { type: 'boolean', default: false },
    geojson: { type: 'boolean', default: false },
    output: { type: 'string', short: 'o' },
    cookies: { type: 'string' },
    timeout: { type: 'string', default: '10000' },
    server: { type: 'string' }
  };

  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: optionsConfig,
      allowPositionals: true
    });
  } catch (err) {
    console.error(styleText('red', `Erro nos argumentos: ${err.message}`));
    console.log(HELP_TEXT);
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    console.log(renderBanner());
    console.log(HELP_TEXT);
    return;
  }

  if (values.version) {
    console.log('googletype-osint v1.0.0');
    return;
  }

  // Modo Servidor Micro-API
  if (values.server !== undefined || argv.includes('--server')) {
    const port = values.server && values.server !== 'true' ? parseInt(values.server, 10) : 3000;
    startServer(port);
    return;
  }

  const target = positionals[0];
  if (!target) {
    console.log(renderBanner());
    console.error(styleText('red', '❌ Erro: Nenhum alvo informado.'));
    console.log(styleText('yellow', 'Exemplo: npx googletype investigado@gmail.com\n'));
    console.log(HELP_TEXT);
    process.exit(1);
  }

  const isSilentOutput = values.json || values.geojson;
  if (!isSilentOutput) {
    console.log(renderBanner());
    console.log(styleText(['bold', 'cyan'], `[*] Iniciando investigação sobre: ${target}`));
    console.log(styleText('dim', '    Conectando aos endpoints públicos do ecossistema Google...\n'));
  }

  const timeoutMs = parseInt(values.timeout, 10) || 10000;

  try {
    const result = await investigateGoogle(target, {
      cookies: values.cookies,
      timeoutMs,
      onProgress: ({ module, status }) => {
        if (!isSilentOutput && status === 'running') {
          const labels = {
            gaia: 'Resolvendo Gaia ID e presença da conta',
            avatar: 'Extraindo avatar e foto em alta definição',
            maps: 'Analisando histórico de contribuições no Google Maps',
            calendar: 'Verificando agenda pública no Google Calendar',
            youtube: 'Verificando canal e atividade no YouTube'
          };
          console.log(styleText('dim', `  [→] ${labels[module] || module}...`));
        }
      }
    });

    // Saída GeoJSON
    if (values.geojson) {
      const geojsonObj = result.maps.geojson || { type: 'FeatureCollection', features: [] };
      if (values.output) {
        await saveGeoJSON(geojsonObj, values.output);
        console.log(styleText('green', `[+] GeoJSON salvo com sucesso em: ${values.output}`));
      } else {
        console.log(JSON.stringify(geojsonObj, null, 2));
      }
      return;
    }

    // Saída JSON Bruta
    if (values.json) {
      const jsonStr = JSON.stringify(result, null, 2);
      if (values.output) {
        await fs.writeFile(values.output, jsonStr, 'utf-8');
        console.log(styleText('green', `[+] JSON salvo com sucesso em: ${values.output}`));
      } else {
        console.log(jsonStr);
      }
      return;
    }

    // Saída Padrão Formatada no Terminal
    const report = formatReport(result);
    console.log(report);

    // Se informou -o sem flag de json/geojson, salva o relatório em texto
    if (values.output) {
      await fs.writeFile(values.output, report, 'utf-8');
      console.log(styleText('green', `[+] Relatório salvo com sucesso em: ${values.output}`));
    }
  } catch (err) {
    console.error(styleText('red', `\n❌ Falha na investigação: ${err.message}`));
    process.exit(1);
  }
}
