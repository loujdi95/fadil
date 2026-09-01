import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

function page(title: string, message: string, ok = true) {
  const color = ok ? "#7c3aed" : "#dc2626";
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — FD7.CUT</title></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#f4f1ea;color:#0b0b0d;
display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">
<div style="max-width:420px;padding:40px">
<div style="font-weight:800;font-size:22px;letter-spacing:-.02em">FD7<span style="color:${color}">.</span>CUT</div>
<h1 style="margin:24px 0 8px;font-size:28px">${title}</h1>
<p style="color:#555;line-height:1.5">${message}</p>
<a href="/admin" style="display:inline-block;margin-top:24px;background:#0b0b0d;color:#f4f1ea;
text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">Ouvrir l'espace admin</a>
</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ action: string }> },
) {
  const { action } = await ctx.params;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (action !== "confirm" && action !== "cancel") {
    return page("Action inconnue", "Ce lien n'est pas valide.", false);
  }
  if (!id || !token) {
    return page("Lien incomplet", "Il manque des informations dans le lien.", false);
  }

  const db = adminDb();
  if (!db) {
    return page(
      "Validation par lien non activée",
      "Ouvre l'espace admin pour confirmer ou annuler ce rendez-vous.",
      false,
    );
  }

  const ref = db.collection("bookings").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return page("Introuvable", "Ce rendez-vous n'existe plus (déjà annulé ?).", false);
  }
  const data = snap.data() as { token?: string; name?: string; slotLabel?: string; date?: string };
  if (data.token !== token) {
    return page("Lien invalide", "Ce lien n'est pas autorisé.", false);
  }

  const who = `${data.name ?? ""} — ${data.date ?? ""} à ${data.slotLabel ?? ""}`;

  if (action === "confirm") {
    await ref.update({ status: "confirmed" });
    return page("Rendez-vous confirmé ✂️", `${who} est validé. Le créneau est réservé.`);
  }
  await ref.delete();
  return page("Rendez-vous annulé", `${who} a été annulé. Le créneau est de nouveau libre.`);
}
