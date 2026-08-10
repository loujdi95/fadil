"use client";

import { useEffect, useState } from "react";
import { isFirebaseReady } from "@/lib/firebase";
import { signIn, signOut, watchAuth, DEMO_PASSCODE } from "@/lib/auth";
import {
  getAvailability,
  saveAvailability,
  getAllBookings,
  deleteBooking,
  setBookingStatus,
  getGallery,
  removeGalleryItem,
  DEFAULT_AVAILABILITY,
  type Availability,
  type GalleryItem,
} from "@/lib/store";
import { uploadGalleryImage } from "@/lib/gallery-upload";
import { WEEKDAYS, fmt, type Booking } from "@/lib/booking";

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => watchAuth((v) => { setLogged(v); setReady(true); }), []);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-ink/40">…</div>;
  }
  return logged ? <Dashboard /> : <Login onDone={() => setLogged(true)} />;
}

/* -------------------- Login -------------------- */

function Login({ onDone }: { onDone: () => void }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await signIn(id, pw);
      onDone();
    } catch {
      setErr("Identifiants incorrects.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-white/60 p-8">
        <div className="font-display text-2xl font-extrabold">
          FD7<span className="text-violet">.</span>CUT
        </div>
        <p className="mt-1 text-sm text-ink/50">Espace admin</p>

        {isFirebaseReady ? (
          <input
            className="admin-input mt-6"
            type="email"
            placeholder="Email"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
        ) : (
          <p className="mt-6 rounded-xl bg-violet/10 p-3 text-xs text-violet">
            Mode démo — code d’accès : <strong>{DEMO_PASSCODE}</strong>
          </p>
        )}
        <input
          className="admin-input mt-3"
          type="password"
          placeholder={isFirebaseReady ? "Mot de passe" : "Code d’accès"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button
          disabled={busy}
          className="mt-5 w-full rounded-full bg-ink py-3 font-semibold text-cream transition hover:bg-violet disabled:opacity-50"
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>
        <a href="/" className="mt-4 block text-center text-xs text-ink/40 hover:text-ink">
          ← Retour au site
        </a>
      </form>
      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(11, 11, 13, 0.15);
          background: rgba(255, 255, 255, 0.7);
          padding: 0.75rem 1rem;
          outline: none;
        }
        .admin-input:focus {
          border-color: var(--violet);
          box-shadow: 0 0 0 3px var(--violet-glow);
        }
      `}</style>
    </div>
  );
}

/* -------------------- Dashboard -------------------- */

function Dashboard() {
  const [tab, setTab] = useState<"resa" | "dispo" | "galerie">("resa");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="font-display text-lg font-extrabold">
            FD7<span className="text-violet">.</span>CUT · admin
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-ink/50 hover:text-ink">Voir le site</a>
            <button
              onClick={() => signOut()}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition hover:border-ink"
            >
              Déconnexion
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl gap-1 px-5">
          {([
            ["resa", "Réservations"],
            ["dispo", "Disponibilités"],
            ["galerie", "Galerie"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                tab === k ? "border-violet text-violet" : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        {tab === "resa" && <BookingsTab />}
        {tab === "dispo" && <AvailabilityTab />}
        {tab === "galerie" && <GalleryTab />}
      </main>
    </div>
  );
}

/* -------------------- Onglet Réservations -------------------- */

function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  const load = () => getAllBookings().then(setBookings).catch(() => setBookings([]));
  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (bookings ?? []).filter((b) => b.date >= today);
  const pending = (bookings ?? []).filter((b) => (b.status ?? "pending") === "pending");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Réservations</h1>
      <p className="mt-1 text-sm text-ink/50">
        <span className="font-semibold text-violet">{pending.length} à valider</span>
        {" · "}{upcoming.length} à venir · {bookings?.length ?? 0} au total
      </p>

      <div className="mt-8 space-y-3">
        {bookings === null && <p className="text-ink/40">Chargement…</p>}
        {bookings?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center text-ink/40">
            Aucune réservation pour l’instant.
          </div>
        )}
        {bookings?.map((b) => {
          const st = b.status ?? "pending";
          return (
            <div
              key={b.id}
              className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white/50 p-4 ${
                st === "pending" ? "border-violet/40" : "border-line"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-ink text-cream">
                  <span className="text-[10px] uppercase">{b.date.slice(8, 10)}/{b.date.slice(5, 7)}</span>
                  <span className="font-display text-sm font-bold">{b.slotLabel}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    {b.name}
                    {st === "pending" ? (
                      <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] font-bold uppercase text-violet">
                        En attente
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-600/15 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
                        Confirmé
                      </span>
                    )}
                    {b.afterHour && (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cream">
                        after +5
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-ink/60">
                    {b.prestation} · <a href={`tel:${b.phone}`} className="hover:text-violet">{b.phone}</a>
                  </div>
                  {b.note && <div className="text-xs text-ink/40">“{b.note}”</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {st === "pending" && (
                  <button
                    onClick={async () => { if (b.id) { await setBookingStatus(b.id, "confirmed"); load(); } }}
                    className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition hover:bg-violet"
                  >
                    Confirmer
                  </button>
                )}
                <button
                  onClick={async () => { if (b.id) { await deleteBooking(b.id); load(); } }}
                  className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink/50 transition hover:border-red-500 hover:text-red-600"
                >
                  {st === "pending" ? "Refuser" : "Annuler"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- Onglet Disponibilités -------------------- */

function AvailabilityTab() {
  const [a, setA] = useState<Availability | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getAvailability().then(setA).catch(() => setA(DEFAULT_AVAILABILITY)); }, []);

  if (!a) return <p className="text-ink/40">Chargement…</p>;

  const save = async () => {
    await saveAvailability(a);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Disponibilités</h1>
      <p className="mt-1 text-sm text-ink/50">Coche les jours où tu ouvres. Les autres sont bloqués.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {WEEKDAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => {
              const next = [...a.openDays];
              next[i] = !next[i];
              setA({ ...a, openDays: next });
            }}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
              a.openDays[i] ? "border-violet bg-violet/10" : "border-line bg-white/40"
            }`}
          >
            <span className="font-semibold">{day}</span>
            <span className={`text-sm font-semibold ${a.openDays[i] ? "text-violet" : "text-ink/40"}`}>
              {a.openDays[i] ? "Ouvert" : "Fermé"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid max-w-md gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-ink/50">Ouverture</span>
          <select
            value={a.open}
            onChange={(e) => setA({ ...a, open: Number(e.target.value) })}
            className="admin-input"
          >
            {hoursRange(7, 14).map((m) => (<option key={m} value={m}>{fmt(m)}</option>))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-ink/50">Fermeture</span>
          <select
            value={a.close}
            onChange={(e) => setA({ ...a, close: Number(e.target.value) })}
            className="admin-input"
          >
            {hoursRange(18, 24).map((m) => (<option key={m} value={m}>{fmt(m)}</option>))}
          </select>
        </label>
      </div>

      <button
        onClick={save}
        className="mt-8 rounded-full bg-ink px-6 py-3 font-semibold text-cream transition hover:bg-violet"
      >
        {saved ? "Enregistré ✓" : "Enregistrer"}
      </button>

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(11, 11, 13, 0.15);
          background: rgba(255, 255, 255, 0.7);
          padding: 0.75rem 1rem;
          outline: none;
        }
      `}</style>
    </div>
  );
}

function hoursRange(fromH: number, toH: number): number[] {
  const out: number[] = [];
  for (let m = fromH * 60; m <= toH * 60; m += 40) out.push(m);
  return out;
}

/* -------------------- Onglet Galerie -------------------- */

function GalleryTab() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => getGallery().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadGalleryImage(file, caption.trim() || undefined);
      setCaption("");
      load();
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Galerie</h1>
      <p className="mt-1 text-sm text-ink/50">Ajoute tes coupes. Elles s’affichent sur la page d’accueil.</p>

      <div className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white/50 p-4">
        <label className="block flex-1">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-ink/50">Légende (optionnel)</span>
          <input
            className="admin-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Dégradé + barbe"
          />
        </label>
        <label className={`cursor-pointer rounded-full bg-ink px-6 py-3 font-semibold text-cream transition hover:bg-violet ${busy ? "opacity-50" : ""}`}>
          {busy ? "Envoi…" : "+ Ajouter une photo"}
          <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
        </label>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items?.map((it) => (
          <figure key={it.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-ink/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt={it.caption || ""} className="h-full w-full object-cover" />
            <button
              onClick={async () => { await removeGalleryItem(it.id); load(); }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </figure>
        ))}
      </div>
      {items?.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/20 p-10 text-center text-ink/40">
          Aucune photo. Ajoute ta première coupe ci-dessus.
        </div>
      )}

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(11, 11, 13, 0.15);
          background: rgba(255, 255, 255, 0.7);
          padding: 0.75rem 1rem;
          outline: none;
        }
      `}</style>
    </div>
  );
}
