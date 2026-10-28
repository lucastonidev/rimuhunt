/**
 * @fileoverview Banners e elementos visuais de cabeçalho para o terminal.
 */

import { styleText } from 'node:util';

export const BANNER = `
  ██████╗  ██████╗  ██████╗  ██████╗ ██╗     ███████╗████████╗██╗   ██╗██████╗ ███████╗
 ██╔════╝ ██╔═══██╗██╔═══██╗██╔════╝ ██║     ██╔════╝╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝
 ██║  ███╗██║   ██║██║   ██║██║  ███╗██║     █████╗     ██║    ╚████╔╝ ██████╔╝█████╗  
 ██║   ██║██║   ██║██║   ██║██║   ██║██║     ██╔══╝     ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  
 ╚██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗   ██║      ██║   ██║     ███████╗
  ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═╝     ╚══════╝
`;

/**
 * Renderiza o banner inicial formatado com cores.
 * @returns {string}
 */
export function renderBanner() {
  const styledBanner = styleText(['bold', 'cyan'], BANNER);
  const subtitle = styleText(['bold', 'white'], '  ⚡ Investigação OSINT Profunda de Contas Google / Gmail em Node.js ESM');
  const meta = styleText(['dim'], '  Versão 1.0.0 • Zero Build Step • Coordenadas GeoJSON • HD Avatars\n');
  return `${styledBanner}\n${subtitle}\n${meta}`;
}
