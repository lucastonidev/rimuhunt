import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseICalendar } from '../src/modules/calendar.js';

test('parseICalendar extrai título, fuso horário e eventos de stream iCal', () => {
  const sampleIcs = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'X-WR-CALNAME:Agenda Profissional',
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'BEGIN:VEVENT',
    'SUMMARY:Reunião de Alinhamento OSINT',
    'DTSTART:20261101T140000Z',
    'DTEND:20261101T150000Z',
    'LOCATION:Google Meet',
    'DESCRIPTION:Discussão dos módulos Node.js',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const { title, timeZone, events } = parseICalendar(sampleIcs);

  assert.equal(title, 'Agenda Profissional');
  assert.equal(timeZone, 'America/Sao_Paulo');
  assert.equal(events.length, 1);
  assert.equal(events[0].title, 'Reunião de Alinhamento OSINT');
  assert.equal(events[0].location, 'Google Meet');
  assert.equal(events[0].start, '20261101T140000Z');
});

