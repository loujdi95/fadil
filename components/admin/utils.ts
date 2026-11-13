import { fmt, SLOT_MINUTES, WEEKDAYS, weekdayIndex, type Booking } from "@/lib/booking";

export const MONTHS = [
  "janv", "févr", "mars", "avr", "mai", "juin",
  "juil", "août", "sept", "oct", "nov", "déc",
];

/** "2026-11-20" -> Date locale (minuit) */
export function parseKey(k: string): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Ven 20 nov" */
export function shortDay(k: string): string {
  const d = parseKey(k);
  return `${WEEKDAYS[weekdayIndex(d)].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "14h → 15h20" */
export function timeRange(b: Booking): string {
  return `${fmt(b.slot)} → ${fmt(b.slot + SLOT_MINUTES * (b.span ?? 1))}`;
}

/** Numéro FR -> format international sans + (pour WhatsApp) */
function intl(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("33")) return d;
  if (d.startsWith("0")) return "33" + d.slice(1);
  return d;
}

export function telUrl(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function smsUrl(phone: string, text = "") {
  return `sms:${phone.replace(/\s/g, "")}${text ? `&body=${encodeURIComponent(text)}` : ""}`;
}

export function whatsappUrl(phone: string, text = "") {
  return `https://wa.me/${intl(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Message tout prêt pour confirmer / rappeler un RDV */
export function confirmMessage(b: Booking) {
  return `Salut ${b.name.split(" ")[0]} ! C'est FD7.CUT ✂️ Ton RDV est confirmé : ${shortDay(b.date)} à ${b.slotLabel} (${b.prestation}). À tout à l'heure !`;
}

export function reminderMessage(b: Booking) {
  return `Salut ${b.name.split(" ")[0]} ! Petit rappel FD7.CUT ✂️ : ton RDV c'est ${shortDay(b.date)} à ${b.slotLabel}. Si t'as un empêchement, préviens-moi stp 🙏`;
}

/** Clé client stable (téléphone normalisé, sinon nom) */
export function clientKey(b: Booking): string {
  const d = b.phone.replace(/\D/g, "");
  return d.length >= 9 ? intl(d) : b.name.trim().toLowerCase();
}
