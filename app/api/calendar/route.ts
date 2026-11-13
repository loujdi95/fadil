import { adminDb } from "@/lib/firebase-admin";
import { parisDate } from "@/lib/paris";
import type { Booking } from "@/lib/booking";
import { SLOT_MINUTES } from "@/lib/booking";

/* ===========================================================
   Flux calendrier (.ics) — abonnement iPhone / Google / Outlook.
   URL : /api/calendar?key=VOTRE_CLE
   Protégé par CALENDAR_FEED_KEY (variable serveur, jamais exposée).
   =========================================================== */

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** "2026-08-12" + minutes -> "20260812T100000" (heure locale, format iCal) */
function icsLocal(date: string, minutes: number): string {
  const [y, m, d] = date.split("-");
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${y}${m}${d}T${pad(h)}${pad(min)}00`;
}

function esc(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  const expected = process.env.CALENDAR_FEED_KEY;
  if (!expected) {
    return new Response("Flux non configuré (CALENDAR_FEED_KEY manquant).", { status: 503 });
  }
  if (key !== expected) {
    return new Response("Clé invalide.", { status: 401 });
  }
  const db = adminDb();
  if (!db) {
    return new Response("Firebase non configuré.", { status: 503 });
  }

  // RDV des 30 derniers jours et à venir
  const since = parisDate(-30);
  const snap = await db.collection("bookings").where("date", ">=", since).get();
  const bookings: Booking[] = snap.docs.map((d) => ({ ...(d.data() as Booking), id: d.id }));

  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate(),
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FD7.CUT//Reservations//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:FD7.CUT — Rendez-vous",
    "X-WR-TIMEZONE:Europe/Paris",
  ];

  for (const b of bookings) {
    const start = icsLocal(b.date, b.slot);
    const end = icsLocal(b.date, b.slot + SLOT_MINUTES * (b.span ?? 1));
    const confirmed = (b.status ?? "pending") === "confirmed";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.id ?? `${b.date}-${b.slot}`}@fd7cut`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${esc(`${confirmed ? "" : "⏳ "}${b.prestation} — ${b.name}`)}`,
      `DESCRIPTION:${esc(
        `Tél : ${b.phone}${b.afterHour ? "\nAfter hour (+5)" : ""}${
          b.note ? `\nNote : ${b.note}` : ""
        }`,
      )}`,
      `STATUS:${confirmed ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="fd7cut.ics"',
      "Cache-Control": "no-store",
    },
  });
}
