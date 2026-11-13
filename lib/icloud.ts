import ical, { type VEvent } from "node-ical";
import { toParis } from "./paris";

/* ===========================================================
   Lecture de l'agenda iPhone (calendrier iCloud partagé en public).
   Chaque événement de ce calendrier rend les créneaux indisponibles.
   =========================================================== */

type Interval = [number, number]; // minutes [début, fin) en heure de Paris

let cache: { url: string; at: number; events: VEvent[] } | null = null;
const TTL = 5 * 60 * 1000;

async function loadEvents(url: string): Promise<VEvent[]> {
  const httpsUrl = url.trim().replace(/^webcal:\/\//i, "https://");
  if (cache && cache.url === httpsUrl && Date.now() - cache.at < TTL) return cache.events;
  const data = await ical.async.fromURL(httpsUrl);
  const events = Object.values(data).filter((c): c is VEvent => c?.type === "VEVENT");
  cache = { url: httpsUrl, at: Date.now(), events };
  return events;
}

/** Ajoute à `out` la portion de [start, end) qui tombe sur `date` (Paris). */
function clip(start: Date, end: Date, date: string, out: Interval[]) {
  const a = toParis(start);
  const b = toParis(end);
  if (b.date < date || a.date > date) return;
  const from = a.date < date ? 0 : a.minutes;
  const to = b.date > date ? 24 * 60 : b.minutes;
  if (to > from) out.push([from, to]);
}

/** Intervalles occupés dans l'agenda iPhone pour une date "YYYY-MM-DD". */
export async function busyIntervals(url: string, date: string): Promise<Interval[]> {
  const events = await loadEvents(url);
  const out: Interval[] = [];
  // fenêtre large autour de la date pour les récurrences
  const dayStart = new Date(`${date}T00:00:00Z`);
  const winStart = new Date(dayStart.getTime() - 2 * 86400000);
  const winEnd = new Date(dayStart.getTime() + 2 * 86400000);

  for (const ev of events) {
    if (!ev.start) continue;
    const allDay = ev.datetype === "date";
    const duration = ev.end ? ev.end.getTime() - ev.start.getTime() : 3600000;

    if (allDay) {
      // événement "journée entière" : on bloque les jours couverts
      const s = new Date(ev.start);
      const days = Math.max(1, Math.round(duration / 86400000));
      for (let i = 0; i < days; i++) {
        const d = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate() + i));
        if (d.toISOString().slice(0, 10) === date) out.push([0, 24 * 60]);
      }
      continue;
    }

    if (ev.rrule) {
      const exdates = new Set(
        Object.values(ev.exdate ?? {}).map((d) => new Date(d as Date).getTime()),
      );
      for (const occ of ev.rrule.between(winStart, winEnd, true)) {
        if (exdates.has(occ.getTime())) continue;
        clip(occ, new Date(occ.getTime() + duration), date, out);
      }
    } else {
      clip(ev.start, ev.end ?? new Date(ev.start.getTime() + duration), date, out);
    }
  }
  return out;
}

/** Les créneaux (début en minutes, durée `len`) qui chevauchent un intervalle occupé. */
export function slotsHit(intervals: Interval[], slotStarts: number[], len: number): number[] {
  return slotStarts.filter((s) => intervals.some(([a, b]) => s < b && s + len > a));
}
