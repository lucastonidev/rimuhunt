/**
 * @fileoverview Verificação de exposição de agendas públicas do Google Calendar.
 * Analisa tanto a interface HTML embed quanto feeds públicos em formato iCalendar (.ics).
 */

import { HttpClient } from '../core/client.js';

/**
 * Faz parser simplificado de um feed no formato iCalendar (.ics).
 * @param {string} icsText
 * @returns {{ title?: string, timeZone?: string, events: import('../core/types.js').CalendarEvent[] }}
 */
export function parseICalendar(icsText) {
  /** @type {import('../core/types.js').CalendarEvent[]} */
  const events = [];
  let title = undefined;
  let timeZone = undefined;

  const lines = icsText.split(/\r?\n/);
  let currentEvent = null;

  for (const line of lines) {
    if (line.startsWith('X-WR-CALNAME:')) {
      title = line.replace('X-WR-CALNAME:', '').trim();
    } else if (line.startsWith('X-WR-TIMEZONE:')) {
      timeZone = line.replace('X-WR-TIMEZONE:', '').trim();
    } else if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = { title: '' };
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent && currentEvent.title) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('DTSTART')) {
        const val = line.split(':')[1] || '';
        currentEvent.start = val.trim();
      } else if (line.startsWith('DTEND')) {
        const val = line.split(':')[1] || '';
        currentEvent.end = val.trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.replace('LOCATION:', '').trim();
      }
    }
  }

  return { title, timeZone, events };
}

/**
 * Verifica se o endereço possui uma agenda Google exposta publicamente.
 * @param {import('../core/types.js').TargetInfo} target
 * @param {Object} [options]
 * @param {HttpClient} [options.client]
 * @param {number} [options.timeoutMs=10000]
 * @returns {Promise<import('../core/types.js').CalendarResult>}
 */
export async function checkCalendar(target, options = {}) {
  const start = Date.now();
  const client = options.client || new HttpClient({ timeoutMs: options.timeoutMs });
  const email = target.email;

  if (!email) {
    return {
      exists: false,
      isPublic: false,
      events: [],
      durationMs: Date.now() - start,
      error: 'E-mail não fornecido para checagem de agenda'
    };
  }

  const icsUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(email)}/public/basic.ics`;
  const embedUrl = `https://calendar.google.com/calendar/htmlembed?src=${encodeURIComponent(email)}`;

  try {
    // 1. Tenta feed iCal público
    const icsRes = await client.get(icsUrl, { timeoutMs: options.timeoutMs });

    if (icsRes.ok) {
      const icsText = await icsRes.text();
      if (icsText.includes('BEGIN:VCALENDAR')) {
        const { title, timeZone, events } = parseICalendar(icsText);

        return {
          exists: true,
          isPublic: true,
          title: title || 'Google Calendar Público',
          timeZone: timeZone || undefined,
          icsUrl,
          embedUrl,
          events,
          durationMs: Date.now() - start
        };
      }
    }

    // 2. Tenta embed HTML
    const embedRes = await client.get(embedUrl, { timeoutMs: options.timeoutMs });
    if (embedRes.ok) {
      const html = await embedRes.text();
      const isForbidden = html.includes('Events could not be loaded') ||
                          html.includes('Não foi possível carregar os eventos') ||
                          html.includes('Sign in') ||
                          html.includes('Fazer login');

      if (!isForbidden) {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace('Google Calendar', '').replace('-', '').trim() : undefined;

        return {
          exists: true,
          isPublic: true,
          title: title || 'Google Calendar',
          embedUrl,
          events: [],
          durationMs: Date.now() - start
        };
      }
    }

    return {
      exists: true,
      isPublic: false,
      embedUrl,
      events: [],
      durationMs: Date.now() - start
    };
  } catch (err) {
    return {
      exists: false,
      isPublic: false,
      events: [],
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
