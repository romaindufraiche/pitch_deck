import type { CalendarTemplate } from "./types";
import { calendarTemplates } from "./data";

const DAY = 86400000;
export const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export const addDays = (d: Date, n: number) => new Date(startOfDay(d).getTime() + n * DAY + 12 * 3600000);
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const longDate = (d: Date) => `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
export const frDate = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};
export const monthYear = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
};

/** « aujourd'hui », « demain », « jeudi », « dans 3 semaines »… */
export function relativeDay(today: Date, d: Date) {
  const n = daysBetween(today, d);
  if (n === 0) return "aujourd'hui";
  if (n === 1) return "demain";
  if (n === -1) return "hier";
  if (n > 1 && n < 7) return WEEKDAYS[d.getDay()];
  if (n < 0 && n > -7) return `${WEEKDAYS[d.getDay()]} dernier`;
  if (n >= 14 && n < 35 && n % 7 === 0) return `dans ${n / 7} semaines`;
  if (n >= 7 && n < 60) return `dans ${n} jours`;
  if (n >= 60) return `dans ${Math.round(n / 30)} mois`;
  return `il y a ${-n} jours`;
}

export type CalendarEvent = CalendarTemplate & { date: Date; endDate: Date; label: string; dayOffset: number };

export function resolveWhen(when: string, today: Date): Date {
  if (when === "tomorrow") return addDays(today, 1);
  const [kind, val] = when.split(":");
  if (kind === "offset") return addDays(today, Number(val));
  if (kind === "next") {
    const target = Number(val);
    let d = 1;
    while ((today.getDay() + d) % 7 !== target) d++;
    return addDays(today, d);
  }
  if (kind === "date") {
    const [m, day] = val.split("-").map(Number);
    let y = today.getFullYear();
    let d = new Date(y, m - 1, day, 12);
    if (d.getTime() < today.getTime()) d = new Date(++y, m - 1, day, 12);
    return d;
  }
  return today;
}

export function calendar(today: Date): CalendarEvent[] {
  return calendarTemplates
    .map((t) => {
      const date = resolveWhen(t.when, today);
      const endDate = addDays(date, (t.durationDays ?? 1) - 1);
      return { ...t, date, endDate, dayOffset: daysBetween(today, date), label: cap(relativeDay(today, date)) };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime() || (a.time ?? "").localeCompare(b.time ?? ""));
}

/** jours écoulés depuis le dernier mardi (strictement avant aujourd'hui) */
export function daysSinceLastWeekday(today: Date, weekday: number) {
  let d = 1;
  while ((today.getDay() - d + 7) % 7 !== weekday) d++;
  return d;
}
