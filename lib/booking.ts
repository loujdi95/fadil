/* ===========================================================
   Logique de créneaux — 40 min par 40 min
   Basé sur le brief fd7.cut :
   10h → 19h20, pause 13h20–14h, after hour dès 20h (+5)
   =========================================================== */

export const SLOT_MINUTES = 40;
export const AFTER_HOUR_FROM = 20 * 60; // 20h00 en minutes
export const AFTER_HOUR_SURCHARGE = 5;

export type Slot = {
  /** minutes depuis minuit, ex: 610 = 10h10 */
  value: number;
  /** label affiché, ex: "10h40" */
  label: string;
  afterHour: boolean;
};

export const WEEKDAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

export function fmt(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/**
 * Génère les créneaux d'une journée.
 * @param open  minutes d'ouverture (défaut 10h)
 * @param close minutes de fermeture (défaut 20h — dernier créneau avant after hour)
 * @param pauses plages [début, fin] fermées (défaut pause déj 13h20–14h)
 */
export function generateSlots(
  open = 10 * 60,
  close = 22 * 60,
  pauses: [number, number][] = [[13 * 60 + 20, 14 * 60]],
): Slot[] {
  const slots: Slot[] = [];
  for (let t = open; t + SLOT_MINUTES <= close; t += SLOT_MINUTES) {
    const inPause = pauses.some(([a, b]) => t >= a && t < b);
    if (inPause) continue;
    slots.push({
      value: t,
      label: fmt(t),
      afterHour: t >= AFTER_HOUR_FROM,
    });
  }
  return slots;
}

export const PRESTATIONS = [
  "Coupe",
  "Coupe + Barbe",
  "Barbe",
  "Coupe enfant",
  "Contours / Finitions",
] as const;

export type BookingStatus = "pending" | "confirmed";

export type Booking = {
  id?: string;
  date: string; // YYYY-MM-DD
  slot: number; // minutes
  slotLabel: string;
  name: string;
  phone: string;
  prestation: string;
  afterHour: boolean;
  note?: string;
  status?: BookingStatus; // "pending" par défaut (à valider par le coiffeur)
  token?: string;         // jeton secret pour valider/annuler depuis l'e-mail
  createdAt?: number;
};

/** clé YYYY-MM-DD en local */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** JS getDay() (0=dim) -> index WEEKDAYS (0=lun) */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Lundi de la semaine contenant `d` */
export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - weekdayIndex(r));
  return r;
}
