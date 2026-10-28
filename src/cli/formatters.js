/**
 * @fileoverview Formatadores visuais de saída no terminal para os relatórios da investigação.
 */

import { styleText } from 'node:util';

/**
 * Cria uma linha separadora com caracteres UTF-8.
 * @param {string} [char="─"]
 * @param {number} [length=80]
 * @returns {string}
 */
export function separator(char = '─', length = 80) {
  return styleText('dim', char.repeat(length));
}

/**
 * Cria um título de seção estilizado.
 * @param {string} title
 * @param {string} [icon="🔍"]
 * @returns {string}
 */
export function sectionHeader(title, icon = '🔍') {
  return `\n${styleText(['bold', 'cyan'], `${icon} ${title}`)}\n${separator()}`;
}

/**
 * Formata um par chave-valor com alinhamento e cores.
 * @param {string} label
 * @param {any} value
 * @param {'green'|'yellow'|'red'|'white'|'cyan'} [valueColor='white']
 * @returns {string}
 */
export function formatField(label, value, valueColor = 'white') {
  const padLabel = styleText('dim', `  • ${label.padEnd(24)}: `);
  const formattedValue = value !== undefined && value !== null && value !== ''
    ? styleText(valueColor, String(value))
    : styleText('dim', 'Não detectado');
  return `${padLabel}${formattedValue}`;
}

/**
 * Renderiza o relatório completo no terminal.
 * @param {import('../core/types.js').InvestigationResult} result
 * @returns {string}
 */
export function formatReport(result) {
  const lines = [];

  // Seção 1: Identificação do Alvo
  lines.push(sectionHeader('IDENTIFICAÇÃO DO ALVO', '🎯'));
  lines.push(formatField('Entrada Original', result.target.raw));
  lines.push(formatField('Tipo de Alvo', result.target.isEmail ? 'Endereço de E-mail' : 'Gaia ID Numérico'));
  if (result.target.email) {
    lines.push(formatField('E-mail Normalizado', result.target.email, 'cyan'));
    lines.push(formatField('Domínio', result.target.domain));
    lines.push(formatField('É Gmail / Workspace', result.target.isGmail ? 'Sim (Gmail)' : 'Domínio Próprio'));
  }
  lines.push(formatField('Gaia ID (ID Interno)', result.target.gaiaId || result.gaia.gaiaId, 'yellow'));
  lines.push(formatField('Nome de Exibição', result.gaia.name, 'green'));

  // Seção 2: Avatar & Foto de Perfil
  lines.push(sectionHeader('AVATAR & FOTO DE PERFIL', '🖼️'));
  lines.push(formatField('Avatar Localizado', result.avatar.exists ? 'Sim' : 'Não', result.avatar.exists ? 'green' : 'red'));
  lines.push(formatField('Tipo de Imagem', result.avatar.isDefault ? 'Avatar Padrão (Inicial)' : 'Foto Personalizada HD', result.avatar.isDefault ? 'yellow' : 'green'));
  if (result.avatar.originalHdUrl) {
    lines.push(formatField('URL Original HD (=s0)', result.avatar.originalHdUrl, 'cyan'));
  }
  if (result.avatar.highResUrl && result.avatar.highResUrl !== result.avatar.originalHdUrl) {
    lines.push(formatField('URL 1024x1024', result.avatar.highResUrl));
  }

  // Seção 3: Google Maps & Localizações
  lines.push(sectionHeader('GOOGLE MAPS & HISTÓRICO GEOGRÁFICO', '📍'));
  lines.push(formatField('Perfil de Contribuidor', result.maps.exists ? 'Encontrado' : 'Não encontrado', result.maps.exists ? 'green' : 'dim'));
  lines.push(formatField('Visibilidade', result.maps.isRestricted ? 'Restrita / Oculta pelo Usuário' : 'Pública', result.maps.isRestricted ? 'yellow' : 'green'));
  if (result.maps.localGuideLevel) {
    lines.push(formatField('Nível Local Guide', `Level ${result.maps.localGuideLevel} ★`, 'yellow'));
  }
  lines.push(formatField('Total de Avaliações', result.maps.totalReviews));
  lines.push(formatField('Total de Fotos', result.maps.totalPhotos));
  lines.push(formatField('Total de Notas', result.maps.totalRatings));
  if (result.maps.contributorUrl) {
    lines.push(formatField('Link do Perfil', result.maps.contributorUrl, 'cyan'));
  }

  if (result.maps.reviews && result.maps.reviews.length > 0) {
    lines.push(`\n  ${styleText(['bold', 'yellow'], `[+] ${result.maps.reviews.length} Ponto(s) Geográfico(s) Extraído(s):`)}`);
    for (const rev of result.maps.reviews.slice(0, 10)) {
      const coordStr = `${rev.coordinates.lat.toFixed(4)}, ${rev.coordinates.lng.toFixed(4)}`;
      lines.push(`    • [${styleText('cyan', coordStr)}] ${rev.placeName} (${rev.rating}★)`);
    }
    if (result.maps.reviews.length > 10) {
      lines.push(styleText('dim', `    ... e mais ${result.maps.reviews.length - 10} locais adicionais.`));
    }
  }

  // Seção 4: Google Calendar
  lines.push(sectionHeader('GOOGLE CALENDAR', '📅'));
  lines.push(formatField('Status da Agenda', result.calendar.isPublic ? '⚠️ PÚBLICA (Exposta)' : 'Privada / Protegida', result.calendar.isPublic ? 'red' : 'green'));
  if (result.calendar.title) {
    lines.push(formatField('Título da Agenda', result.calendar.title));
  }
  if (result.calendar.timeZone) {
    lines.push(formatField('Fuso Horário Detectado', result.calendar.timeZone, 'yellow'));
  }
  if (result.calendar.events && result.calendar.events.length > 0) {
    lines.push(`  ${styleText(['bold', 'yellow'], `[!] ${result.calendar.events.length} Evento(s) Público(s) Encontrado(s):`)}`);
    for (const ev of result.calendar.events.slice(0, 5)) {
      lines.push(`    • ${ev.title} (${ev.start || 'Sem data'})`);
    }
  }

  // Seção 5: YouTube
  lines.push(sectionHeader('YOUTUBE & VÍDEO', '▶️'));
  lines.push(formatField('Canal Detectado', result.youtube.exists ? 'Sim' : 'Não', result.youtube.exists ? 'green' : 'dim'));
  if (result.youtube.title) {
    lines.push(formatField('Nome do Canal', result.youtube.title, 'green'));
  }
  if (result.youtube.customUrl) {
    lines.push(formatField('Handle (@nome)', result.youtube.customUrl, 'cyan'));
  }
  if (result.youtube.channelUrl) {
    lines.push(formatField('Link do Canal', result.youtube.channelUrl, 'cyan'));
  }
  if (result.youtube.playlists && result.youtube.playlists.length > 0) {
    lines.push(formatField('Playlists Públicas', `${result.youtube.playlists.length} encontrada(s)`));
  }

  // Seção 6: Recomendações de Defesa e Privacidade (Hardening)
  lines.push(sectionHeader('RECOMENDAÇÕES DE PRIVACIDADE & DEFESA (HARDENING)', '🛡️'));
  lines.push(styleText('dim', '  Como o titular pode restringir essa pegada digital:'));
  lines.push('  1. Google Maps: Ativar "Restringir perfil" nas configurações de conteúdo pessoal.');
  lines.push('  2. Google Calendar: Garantir que a agenda principal não esteja compartilhada publicamente.');
  lines.push('  3. Foto de Perfil: Ajustar visibilidade de foto em myaccount.google.com para "Apenas contatos".');
  lines.push('  4. YouTube: Definir playlists e inscrições como privadas em studio.youtube.com.');

  // Rodapé
  lines.push(`\n${separator()}`);
  lines.push(styleText('dim', `  Tempo de execução: ${result.durationMs}ms | Investigação concluída em ${result.timestamp}\n`));

  return lines.join('\n');
}
