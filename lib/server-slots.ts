import { adminDb } from "./firebase-admin";
import { busyIntervals, slotsHit } from "./icloud";
import { occupiedSlots, SLOT_MINUTES, type Booking } from "./booking";

/** Créneaux indisponibles d'une date : réservations + agenda iPhone. */
export async function takenSlots(date: string): Promise<number[]> {
  const db = adminDb();
  if (!db) throw new Error("admin_not_configured");

  const snap = await db.collection("bookings").where("date", "==", date).get();
  const taken = new Set<number>();
  snap.docs.forEach((d) => {
    const b = d.data() as Booking;
    occupiedSlots(b.slot, b.span ?? 1).forEach((m) => taken.add(m));
  });

  // agenda iPhone (si un lien iCloud est enregistré)
  try {
    const priv = await db.collection("private").doc("icloud").get();
    const url = priv.exists ? (priv.data()?.url as string | undefined) : undefined;
    if (url) {
      // tous les débuts possibles (pas de 10 min, couvre n'importe quel horaire d'ouverture)
      const all = Array.from({ length: 144 }, (_, i) => i * 10);
      const busy = await busyIntervals(url, date);
      slotsHit(busy, all, SLOT_MINUTES).forEach((m) => taken.add(m));
    }
  } catch (e) {
    console.warn("Lecture agenda iPhone impossible :", e);
  }

  return [...taken].sort((a, b) => a - b);
}
