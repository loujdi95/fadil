import { isAdminRequest } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/** Renvoie le lien d'abonnement agenda complet — réservé à l'admin connecté. */
export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.CALENDAR_FEED_KEY;
  if (!key) return Response.json({ error: "CALENDAR_FEED_KEY manquant" }, { status: 503 });
  const host = new URL(req.url).host;
  return Response.json({
    webcal: `webcal://${host}/api/calendar?key=${encodeURIComponent(key)}`,
    https: `https://${host}/api/calendar?key=${encodeURIComponent(key)}`,
  });
}
