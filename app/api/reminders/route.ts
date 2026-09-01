import { adminDb } from "@/lib/firebase-admin";
import { sendServerEmail } from "@/lib/email-server";
import type { Booking } from "@/lib/booking";

/* Rappel automatique la veille — appelé chaque jour par le cron Vercel.
   Envoie un e-mail aux clients qui ont un RDV confirmé DEMAIN. */

export const dynamic = "force-dynamic";

/** Date locale (Europe/Paris) au format YYYY-MM-DD, décalée de `plusDays`. */
function parisDate(plusDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + plusDays);
  const parts = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts; // fr-CA -> "YYYY-MM-DD"
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  // repli : clé en query (pour test manuel)
  const key = new URL(req.url).searchParams.get("key");
  if (secret && key === secret) return true;
  if (!secret) return true; // pas de secret configuré : on autorise (démo)
  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const template = process.env.EMAILJS_TEMPLATE_REMINDER;
  if (!db || !template) {
    return Response.json({ ok: false, error: "not_configured", sent: 0 });
  }

  const tomorrow = parisDate(1);
  const snap = await db
    .collection("bookings")
    .where("date", "==", tomorrow)
    .where("status", "==", "confirmed")
    .get();

  let sent = 0;
  for (const doc of snap.docs) {
    const b = doc.data() as Booking;
    if (!b.email) continue;
    const ok = await sendServerEmail(template, {
      to_email: b.email,
      name: b.name,
      prestation: b.prestation,
      date: b.date,
      slot: b.slotLabel,
    });
    if (ok) sent++;
  }

  return Response.json({ ok: true, date: tomorrow, found: snap.size, sent });
}
