/**
 * @fileoverview Banners e elementos visuais de cabeçalho para o terminal do rimuhunt.
 */

import { styleText } from 'node:util';

export const BANNER = `
 ██████╗  ██╗███╗   ███╗██╗   ██╗██╗  ██╗██╗   ██╗███╗   ██╗████████╗
 ██╔══██╗ ██║████╗ ████║██║   ██║██║  ██║██║   ██║████╗  ██║╚══██╔══╝
 ██████╔╝ ██║██╔████╔██║██║   ██║███████║██║   ██║██╔██╗ ██║   ██║   
 ██╔══██╗ ██║██║╚██╔╝██║██║   ██║██╔══██║██║   ██║██║╚██╗██║   ██║   
 ██║  ██║ ██║██║ ╚═╝ ██║╚██████╔╝██║  ██║╚██████╔╝██║ ╚████║   ██║   
 ╚═╝  ╚═╝ ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   
`;

/**
 * Renderiza o banner inicial formatado com cores.
 * @returns {string}
 */
export function renderBanner() {
  const styledBanner = styleText(['bold', 'cyan'], BANNER);
  const subtitle = styleText(['bold', 'white'], '  ⚡ rimuhunt • Investigação OSINT Profunda de Contas Google / Gmail');
  const meta = styleText(['dim'], '  Criado por Lucas (rimublinda) • Node.js ESM • GeoJSON • Zero Build Step\n');
  return `${styledBanner}\n${subtitle}\n${meta}`;
}
