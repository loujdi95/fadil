import { isAdminRequest } from "@/lib/firebase-admin";
import { createBookingServer } from "@/lib/book-server";

export const dynamic = "force-dynamic";

/** POST /api/admin/book — RDV ajouté par le coiffeur (téléphone, sans RDV…). */
export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return Response.json({ ok: false, reason: "Non autorisé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, reason: "Requête invalide." }, { status: 400 });
  }
  const r = await createBookingServer(body, { byAdmin: true });
  if (!r.ok) return Response.json({ ok: false, reason: r.reason }, { status: r.status });
  return Response.json(r);
}
