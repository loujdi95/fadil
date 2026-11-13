import { randomUUID } from "node:crypto";
import { adminDb } from "./firebase-admin";
import { takenSlots } from "./server-slots";
import {
  occupiedSlots,
  prestationSpan,
  PRESTATIONS,
  AFTER_HOUR_FROM,
  fmt,
  type Booking,
  type BookingStatus,
} from "./booking";
import { parisDate } from "./paris";

export type BookResult =
  | { ok: true; id: string; token: string }
  | { ok: false; reason: string; status: number };

type Options = {
  /** RDV ajouté par le coiffeur : pas de contrôle jours off / agenda iPhone, déjà confirmé */
  byAdmin?: boolean;
};

/** Crée une réservation de façon sûre (validation + anti-chevauchement atomique). */
export async function createBookingServer(
  body: Partial<Booking>,
  { byAdmin = false }: Options = {},
): Promise<BookResult> {
  const db = adminDb();
  if (!db) return { ok: false, reason: "Service indisponible.", status: 503 };

  const name = String(body.name ?? "").trim().slice(0, 80);
  const phone = String(body.phone ?? "").trim().slice(0, 30);
  const email = String(body.email ?? "").trim().slice(0, 120);
  const note = String(body.note ?? "").trim().slice(0, 300);
  const date = String(body.date ?? "");
  const slot = Number(body.slot);
  const prestation = String(body.prestation ?? "");

  if (!name) return { ok: false, reason: "Nom manquant.", status: 400 };
  if (!byAdmin && phone.replace(/\D/g, "").length < 9) {
    return { ok: false, reason: "Numéro de téléphone invalide.", status: 400 };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(slot) || slot < 0 || slot >= 1440) {
    return { ok: false, reason: "Créneau invalide.", status: 400 };
  }
  if (!(PRESTATIONS as readonly string[]).includes(prestation)) {
    return { ok: false, reason: "Prestation invalide.", status: 400 };
  }
  if (!byAdmin && date < parisDate(0)) {
    return { ok: false, reason: "Date passée.", status: 400 };
  }

  const span = prestationSpan(prestation);
  const wanted = occupiedSlots(slot, span);

  if (!byAdmin) {
    // jour off / créneau bloqué par le coiffeur
    const blocksSnap = await db.collection("settings").doc("blocks").get();
    const blocks = (blocksSnap.data() ?? {}) as {
      offDays?: string[];
      offSlots?: Record<string, number[]>;
    };
    if (
      blocks.offDays?.includes(date) ||
      wanted.some((m) => blocks.offSlots?.[date]?.includes(m))
    ) {
      return { ok: false, reason: "Ce créneau n'est pas disponible.", status: 409 };
    }
    // réservations + agenda iPhone
    const taken = new Set(await takenSlots(date));
    if (wanted.some((m) => taken.has(m))) {
      return { ok: false, reason: "Ce créneau vient d'être pris.", status: 409 };
    }
  }

  const token = randomUUID().replace(/-/g, "");
  const status: BookingStatus = byAdmin ? "confirmed" : "pending";
  const booking: Booking = {
    date,
    slot,
    slotLabel: fmt(slot),
    name,
    phone,
    ...(email ? { email } : {}),
    prestation,
    span,
    afterHour: slot >= AFTER_HOUR_FROM,
    ...(note ? { note } : {}),
    status,
    token,
    createdAt: Date.now(),
    ...(byAdmin ? { source: "admin" as const } : { source: "site" as const }),
  };

  // transaction : re-vérifie les réservations du jour et écrit de façon atomique
  const ref = db.collection("bookings").doc();
  const clash = await db.runTransaction(async (tx) => {
    const day = await tx.get(db.collection("bookings").where("date", "==", date));
    const busy = day.docs.some((d) => {
      const b = d.data() as Booking;
      if (b.status === "noshow") return false;
      return occupiedSlots(b.slot, b.span ?? 1).some((m) => wanted.includes(m));
    });
    if (busy) return true;
    tx.create(ref, booking);
    return false;
  });
  if (clash) return { ok: false, reason: "Ce créneau est déjà réservé.", status: 409 };

  return { ok: true, id: ref.id, token };
}
