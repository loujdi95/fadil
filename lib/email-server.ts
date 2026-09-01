/* Envoi d'e-mail côté serveur via l'API REST EmailJS (pour le cron de rappel).
   Nécessite la clé privée EmailJS (EMAILJS_PRIVATE_KEY). */

const SERVICE = process.env.NEXT_PUBLIC_EMAILJS_SERVICE;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

export const serverEmailReady = Boolean(SERVICE && PUBLIC_KEY && PRIVATE_KEY);

export async function sendServerEmail(
  templateId: string,
  params: Record<string, string>,
): Promise<boolean> {
  if (!serverEmailReady || !templateId) return false;
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE,
        template_id: templateId,
        user_id: PUBLIC_KEY,
        accessToken: PRIVATE_KEY,
        template_params: params,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
