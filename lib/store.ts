"use client";

import { db, isFirebaseReady } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import type { Booking, BookingStatus } from "./booking";

/* ===========================================================
   Couche données : Firebase si configuré, sinon localStorage
   (mode démo — le site tourne sans backend)
   =========================================================== */

export type Availability = {
  /** jours ouverts, index 0=lundi … 6=dimanche */
  openDays: boolean[];
  open: number;   // minutes
  close: number;  // minutes
};

export const DEFAULT_AVAILABILITY: Availability = {
  openDays: [true, true, true, true, true, true, true], // full dispo par défaut
  open: 10 * 60,
  close: 22 * 60,
};

export type GalleryItem = { id: string; url: string; caption?: string; permalink?: string };

/* Blocages ponctuels posés semaine par semaine par le coiffeur.
   Par défaut : rien de bloqué = full dispo. */
export type Blocks = {
  offDays: string[];                    // jours OFF, ex ["2026-08-14"]
  offSlots: Record<string, number[]>;   // créneaux bloqués par jour, ex { "2026-08-12": [600, 640] }
};

export const DEFAULT_BLOCKS: Blocks = { offDays: [], offSlots: {} };

const LS = {
  avail: "fd7_availability",
  blocks: "fd7_blocks",
  bookings: "fd7_bookings",
  gallery: "fd7_gallery",
};

function lsGet<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(k: string, v: unknown) {
  if (typeof window !== "undefined") localStorage.setItem(k, JSON.stringify(v));
}

/* -------------------- Disponibilités -------------------- */

export async function getAvailability(): Promise<Availability> {
  if (isFirebaseReady && db) {
    const snap = await getDoc(doc(db, "settings", "availability"));
    if (snap.exists()) return { ...DEFAULT_AVAILABILITY, ...(snap.data() as Availability) };
    return DEFAULT_AVAILABILITY;
  }
  return lsGet(LS.avail, DEFAULT_AVAILABILITY);
}

export async function saveAvailability(a: Availability): Promise<void> {
  if (isFirebaseReady && db) {
    await setDoc(doc(db, "settings", "availability"), a);
    return;
  }
  lsSet(LS.avail, a);
}

/* -------------------- Blocages (jours off / créneaux) -------------------- */

export async function getBlocks(): Promise<Blocks> {
  if (isFirebaseReady && db) {
    const snap = await getDoc(doc(db, "settings", "blocks"));
    if (snap.exists()) return { ...DEFAULT_BLOCKS, ...(snap.data() as Blocks) };
    return DEFAULT_BLOCKS;
  }
  return lsGet(LS.blocks, DEFAULT_BLOCKS);
}

export async function saveBlocks(b: Blocks): Promise<void> {
  if (isFirebaseReady && db) {
    await setDoc(doc(db, "settings", "blocks"), b);
    return;
  }
  lsSet(LS.blocks, b);
}

/* -------------------- Réservations -------------------- */

export async function getBookingsForDate(date: string): Promise<Booking[]> {
  if (isFirebaseReady && db) {
    const q = query(collection(db, "bookings"), where("date", "==", date));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Booking) }));
  }
  return lsGet<Booking[]>(LS.bookings, []).filter((b) => b.date === date);
}

export async function getAllBookings(): Promise<Booking[]> {
  if (isFirebaseReady && db) {
    const snap = await getDocs(collection(db, "bookings"));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Booking) }))
      .sort((a, b) => (a.date + String(a.slot)).localeCompare(b.date + String(b.slot)));
  }
  return lsGet<Booking[]>(LS.bookings, []).sort((a, b) =>
    (a.date + String(a.slot)).localeCompare(b.date + String(b.slot)),
  );
}

export async function createBooking(
  b: Booking,
): Promise<{ ok: boolean; reason?: string; id?: string; token?: string }> {
  // anti double-booking
  const existing = await getBookingsForDate(b.date);
  if (existing.some((e) => e.slot === b.slot)) {
    return { ok: false, reason: "Ce créneau vient d'être pris." };
  }
  // statut "pending" : le créneau est bloqué mais le coiffeur doit valider
  const token = b.token ?? crypto.randomUUID().replace(/-/g, "");
  const payload: Booking = { ...b, status: b.status ?? "pending", token, createdAt: Date.now() };
  if (isFirebaseReady && db) {
    const ref = await addDoc(collection(db, "bookings"), payload);
    return { ok: true, id: ref.id, token };
  }
  const id = crypto.randomUUID();
  const all = lsGet<Booking[]>(LS.bookings, []);
  all.push({ ...payload, id });
  lsSet(LS.bookings, all);
  return { ok: true, id, token };
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (isFirebaseReady && db) {
    await updateDoc(doc(db, "bookings", id), { status });
    return;
  }
  const all = lsGet<Booking[]>(LS.bookings, []).map((b) =>
    b.id === id ? { ...b, status } : b,
  );
  lsSet(LS.bookings, all);
}

export async function deleteBooking(id: string): Promise<void> {
  if (isFirebaseReady && db) {
    await deleteDoc(doc(db, "bookings", id));
    return;
  }
  const all = lsGet<Booking[]>(LS.bookings, []).filter((b) => b.id !== id);
  lsSet(LS.bookings, all);
}

/* -------------------- Galerie -------------------- */

export async function getGallery(): Promise<GalleryItem[]> {
  if (isFirebaseReady && db) {
    const snap = await getDocs(collection(db, "gallery"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, "id">) }));
  }
  return lsGet<GalleryItem[]>(LS.gallery, []);
}

export async function addGalleryItem(url: string, caption?: string): Promise<void> {
  if (isFirebaseReady && db) {
    await addDoc(collection(db, "gallery"), { url, caption: caption ?? "" });
    return;
  }
  const all = lsGet<GalleryItem[]>(LS.gallery, []);
  all.push({ id: crypto.randomUUID(), url, caption });
  lsSet(LS.gallery, all);
}

export async function removeGalleryItem(id: string): Promise<void> {
  if (isFirebaseReady && db) {
    await deleteDoc(doc(db, "gallery", id));
    return;
  }
  const all = lsGet<GalleryItem[]>(LS.gallery, []).filter((g) => g.id !== id);
  lsSet(LS.gallery, all);
}
