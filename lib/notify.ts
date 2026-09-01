"use client";

import emailjs from "@emailjs/browser";
import type { Booking } from "./booking";

/* ===========================================================
   Notification e-mail au coiffeur à chaque réservation.
   Via EmailJS (gratuit, sans serveur).
   -----------------------------------------------------------
   Mise en place (une seule fois) sur https://emailjs.com :
   1. Crée un compte, ajoute un "Email Service" (Gmail…)
   2. Crée un "Email Template" avec ces variables :
      {{name}} {{phone}} {{prestation}} {{date}} {{slot}} {{note}} {{after_hour}}
   3. Récupère : Service ID, Template ID, Public Key
   4. Colle-les dans .env.local :
      NEXT_PUBLIC_EMAILJS_SERVICE=...
      NEXT_PUBLIC_EMAILJS_TEMPLATE=...
      NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=...
   =========================================================== */

const SERVICE = process.env.NEXT_PUBLIC_EMAILJS_SERVICE;
const TEMPLATE = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export const emailNotifyReady = Boolean(SERVICE && TEMPLATE && PUBLIC_KEY);

type Links = { confirmUrl?: string; cancelUrl?: string; adminUrl?: string };

/** Envoie l'e-mail de notification. Ne bloque jamais la réservation en cas d'échec. */
export async function notifyNewBooking(b: Booking, links: Links = {}): Promise<void> {
  if (!emailNotifyReady) return;
  try {
    await emailjs.send(
      SERVICE!,
      TEMPLATE!,
      {
        name: b.name,
        phone: b.phone,
        prestation: b.prestation,
        date: b.date,
        slot: b.slotLabel,
        note: b.note || "—",
        after_hour: b.afterHour ? "Oui (+5)" : "Non",
        confirm_url: links.confirmUrl || "",
        cancel_url: links.cancelUrl || "",
        admin_url: links.adminUrl || "",
      },
      { publicKey: PUBLIC_KEY! },
    );
  } catch (e) {
    console.warn("Notification e-mail non envoyée :", e);
  }
}
