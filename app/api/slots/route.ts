import { takenSlots } from "@/lib/server-slots";

export const dynamic = "force-dynamic";

/** GET /api/slots?date=YYYY-MM-DD -> { taken: number[] } (sans aucune donnée client) */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "date invalide" }, { status: 400 });
  }
  try {
    return Response.json({ taken: await takenSlots(date) });
  } catch {
    return Response.json({ error: "indisponible" }, { status: 503 });
  }
}
