import { randomUUID } from "node:crypto";
import { adminDb } from "@/lib/firebase-admin";
import { takenSlots } from "@/lib/server-slots";
import { occupiedSlots, prestationSpan, PRESTATIONS, AFTER_HOUR_FROM, fmt, type Booking } from "@/lib/booking";
import { parisDate } from "@/lib/paris";

export const dynamic = "force-dynamic";

/** POST /api/book — crée une réservation (validation + anti-chevauchement côté serveur). */
export async function POST(req: Request) {
  const db = adminDb();
  if (!db) return Response.json({ ok: false, reason: "Service indisponible." }, { status: 503 });

  let body: Partial<Booking>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, reason: "Requête invalide." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 80);
  const phone = String(body.phone ?? "").trim().slice(0, 30);
  const email = String(body.email ?? "").trim().slice(0, 120);
  const note = String(body.note ?? "").trim().slice(0, 300);
  const date = String(body.date ?? "");
  const slot = Number(body.slot);
  const prestation = String(body.prestation ?? "");

  if (!name || phone.replace(/\D/g, "").length < 9) {
    return Response.json({ ok: false, reason: "Nom ou téléphone invalide." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(slot) || slot < 0 || slot >= 1440) {
    return Response.json({ ok: false, reason: "Créneau invalide." }, { status: 400 });
  }
  if (!(PRESTATIONS as readonly string[]).includes(prestation)) {
    return Response.json({ ok: false, reason: "Prestation invalide." }, { status: 400 });
  }
  if (date < parisDate(0)) {
    return Response.json({ ok: false, reason: "Date passée." }, { status: 400 });
  }

  // jour off / créneau bloqué par le coiffeur
  const blocksSnap = await db.collection("settings").doc("blocks").get();
  const blocks = (blocksSnap.data() ?? {}) as { offDays?: string[]; offSlots?: Record<string, number[]> };
  const span = prestationSpan(prestation);
  const wanted = occupiedSlots(slot, span);
  if (blocks.offDays?.includes(date) || wanted.some((m) => blocks.offSlots?.[date]?.includes(m))) {
    return Response.json({ ok: false, reason: "Ce créneau n'est pas disponible." }, { status: 409 });
  }

  // réservations existantes + agenda iPhone
  const taken = new Set(await takenSlots(date));
  if (wanted.some((m) => taken.has(m))) {
    return Response.json({ ok: false, reason: "Ce créneau vient d'être pris." }, { status: 409 });
  }

  const token = randomUUID().replace(/-/g, "");
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
    status: "pending",
    token,
    createdAt: Date.now(),
  };
  // transaction : re-vérifie les réservations du jour et écrit de façon atomique
  const ref = db.collection("bookings").doc();
  const clash = await db.runTransaction(async (tx) => {
    const day = await tx.get(db.collection("bookings").where("date", "==", date));
    const busy = day.docs.some((d) => {
      const b = d.data() as Booking;
      return occupiedSlots(b.slot, b.span ?? 1).some((m) => wanted.includes(m));
    });
    if (busy) return true;
    tx.create(ref, booking);
    return false;
  });
  if (clash) {
    return Response.json({ ok: false, reason: "Ce créneau vient d'être pris." }, { status: 409 });
  }
  return Response.json({ ok: true, id: ref.id, token });
}
