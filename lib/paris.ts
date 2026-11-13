/* Conversions d'heure en fuseau Europe/Paris (le serveur tourne en UTC). */

const fmt = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Instant -> { date: "YYYY-MM-DD", minutes } en heure de Paris. */
export function toParis(d: Date): { date: string; minutes: number } {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
  };
}

/** Date du jour à Paris, décalée de `plusDays`. */
export function parisDate(plusDays = 0): string {
  const d = new Date(Date.now() + plusDays * 86400000);
  return toParis(d).date;
}
