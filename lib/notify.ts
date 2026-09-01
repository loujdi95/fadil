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
const TEMPLATE = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE; // -> coiffeur (nouvelle résa)
const TEMPLATE_CLIENT = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_CLIENT; // -> client (reçu)
const TEMPLATE_CONFIRMED = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_CONFIRMED; // -> client (confirmé)
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export const emailNotifyReady = Boolean(SERVICE && TEMPLATE && PUBLIC_KEY);

function clientParams(b: Booking) {
  return {
    to_email: b.email || "",
    name: b.name,
    prestation: b.prestation,
    date: b.date,
    slot: b.slotLabel,
    after_hour: b.afterHour ? "Oui (+5)" : "Non",
  };
}

/** E-mail au CLIENT : « demande bien reçue ». */
export async function notifyClientReceived(b: Booking): Promise<void> {
  if (!SERVICE || !PUBLIC_KEY || !TEMPLATE_CLIENT || !b.email) return;
  try {
    await emailjs.send(SERVICE, TEMPLATE_CLIENT, clientParams(b), { publicKey: PUBLIC_KEY });
  } catch (e) {
    console.warn("E-mail client (reçu) non envoyé :", e);
  }
}

/** E-mail au CLIENT : « RDV confirmé ». */
export async function notifyClientConfirmed(b: Booking): Promise<void> {
  if (!SERVICE || !PUBLIC_KEY || !TEMPLATE_CONFIRMED || !b.email) return;
  try {
    await emailjs.send(SERVICE, TEMPLATE_CONFIRMED, clientParams(b), { publicKey: PUBLIC_KEY });
  } catch (e) {
    console.warn("E-mail client (confirmé) non envoyé :", e);
  }
}

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
        email: b.email || "—",
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
