import { createBookingServer } from "@/lib/book-server";

export const dynamic = "force-dynamic";

/** POST /api/book — réservation publique (client du site). */
export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, reason: "Requête invalide." }, { status: 400 });
  }
  const r = await createBookingServer(body);
  if (!r.ok) return Response.json({ ok: false, reason: r.reason }, { status: r.status });
  return Response.json(r);
}
