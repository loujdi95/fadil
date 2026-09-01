"use client";

import { useEffect, useState } from "react";
import { isFirebaseReady } from "@/lib/firebase";
import { signIn, signOut, watchAuth, DEMO_PASSCODE } from "@/lib/auth";
import {
  getAvailability,
  saveAvailability,
  getBlocks,
  saveBlocks,
  getAllBookings,
  getBookingsForDate,
  deleteBooking,
  setBookingStatus,
  getGallery,
  removeGalleryItem,
  DEFAULT_AVAILABILITY,
  DEFAULT_BLOCKS,
  type Availability,
  type Blocks,
  type GalleryItem,
} from "@/lib/store";
import { uploadGalleryImage } from "@/lib/gallery-upload";
import {
  WEEKDAYS,
  fmt,
  generateSlots,
  dateKey,
  weekdayIndex,
  startOfWeek,
  type Booking,
} from "@/lib/booking";

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
  const [tab, setTab] = useState<"resa" | "dispo" | "galerie" | "agenda">("resa");

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
            ["agenda", "Agenda"],
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
        {tab === "agenda" && <AgendaTab />}
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

const MONTHS_SHORT = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];

function AvailabilityTab() {
  const [a, setA] = useState<Availability | null>(null);
  const [blocks, setBlocks] = useState<Blocks | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);
  const [dayBookings, setDayBookings] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState(false);
  const [showAdv, setShowAdv] = useState(false);

  useEffect(() => {
    getAvailability().then(setA).catch(() => setA(DEFAULT_AVAILABILITY));
    getBlocks().then(setBlocks).catch(() => setBlocks(DEFAULT_BLOCKS));
  }, []);

  useEffect(() => {
    if (!selected) return;
    getBookingsForDate(dateKey(selected))
      .then((b) => setDayBookings(new Set(b.map((x) => x.slot))))
      .catch(() => setDayBookings(new Set()));
  }, [selected]);

  if (!a || !blocks) return <p className="text-ink/40">Chargement…</p>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const slots = generateSlots(a.open, a.close);
  const canPrev = weekStart > startOfWeek(today);

  const ping = () => {
    setToast(true);
    setTimeout(() => setToast(false), 1500);
  };

  const persist = async (nextBlocks: Blocks) => {
    setBlocks(nextBlocks);
    await saveBlocks(nextBlocks);
    ping();
  };

  const toggleDayOff = (d: Date) => {
    const k = dateKey(d);
    const off = blocks.offDays.includes(k);
    const nextOff = off ? blocks.offDays.filter((x) => x !== k) : [...blocks.offDays, k];
    if (!off && selected && dateKey(selected) === k) setSelected(null);
    persist({ ...blocks, offDays: nextOff });
  };

  const toggleSlot = (d: Date, slot: number) => {
    const k = dateKey(d);
    const cur = blocks.offSlots[k] ?? [];
    const next = cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot];
    const offSlots = { ...blocks.offSlots };
    if (next.length) offSlots[k] = next;
    else delete offSlots[k];
    persist({ ...blocks, offSlots });
  };

  const saveAdv = async () => {
    await saveAvailability(a);
    ping();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Ton planning</h1>
        {toast && <span className="text-sm font-semibold text-violet">Enregistré ✓</span>}
      </div>
      <p className="mt-1 text-sm text-ink/50">
        Tu es <strong>dispo par défaut</strong>. Mets un jour <strong>OFF</strong>, ou clique
        un jour pour bloquer des créneaux précis.
      </p>

      {/* Navigation semaine */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => canPrev && setWeekStart((w) => { const n = new Date(w); n.setDate(n.getDate() - 7); return n; })}
          disabled={!canPrev}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition enabled:hover:border-ink disabled:opacity-30"
        >
          ← Semaine préc.
        </button>
        <div className="text-sm font-semibold">
          {days[0].getDate()} {MONTHS_SHORT[days[0].getMonth()]} — {days[6].getDate()} {MONTHS_SHORT[days[6].getMonth()]}
        </div>
        <button
          onClick={() => setWeekStart((w) => { const n = new Date(w); n.setDate(n.getDate() + 7); return n; })}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition hover:border-ink"
        >
          Semaine suiv. →
        </button>
      </div>

      {/* Grille des 7 jours */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((d) => {
          const k = dateKey(d);
          const past = d < today;
          const off = blocks.offDays.includes(k);
          const blockedCount = (blocks.offSlots[k] ?? []).length;
          const isSel = selected && dateKey(selected) === k;
          return (
            <div
              key={k}
              className={`rounded-2xl border p-4 transition ${
                past
                  ? "border-line bg-ink/[0.02] opacity-50"
                  : off
                    ? "border-red-300 bg-red-50"
                    : isSel
                      ? "border-violet bg-violet/10"
                      : "border-line bg-white/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-ink/50">
                    {WEEKDAYS[weekdayIndex(d)].slice(0, 3)}
                  </div>
                  <div className="font-display text-lg font-bold">
                    {d.getDate()} {MONTHS_SHORT[d.getMonth()]}
                  </div>
                </div>
                {!past && (
                  <button
                    onClick={() => toggleDayOff(d)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      off ? "bg-red-500 text-white" : "bg-ink/[0.06] text-ink/60 hover:bg-ink/10"
                    }`}
                  >
                    {off ? "OFF" : "Dispo"}
                  </button>
                )}
              </div>

              {!past && !off && (
                <button
                  onClick={() => setSelected(isSel ? null : d)}
                  className="mt-3 w-full rounded-xl border border-ink/10 py-2 text-xs font-semibold text-ink/60 transition hover:border-ink/30"
                >
                  {isSel ? "Fermer" : blockedCount ? `Créneaux · ${blockedCount} bloqué${blockedCount > 1 ? "s" : ""}` : "Gérer les créneaux"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Créneaux du jour sélectionné */}
      {selected && !blocks.offDays.includes(dateKey(selected)) && (
        <div className="mt-6 rounded-2xl border border-violet/30 bg-white/50 p-5">
          <div className="text-sm font-semibold">
            Créneaux du {selected.getDate()} {MONTHS_SHORT[selected.getMonth()]}
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Clique pour bloquer/débloquer. Les créneaux déjà réservés sont marqués.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map((s) => {
              const booked = dayBookings.has(s.value);
              const blocked = (blocks.offSlots[dateKey(selected)] ?? []).includes(s.value);
              return (
                <button
                  key={s.value}
                  disabled={booked}
                  onClick={() => toggleSlot(selected, s.value)}
                  className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                    booked
                      ? "cursor-not-allowed border-green-300 bg-green-50 text-green-700"
                      : blocked
                        ? "border-red-300 bg-red-50 text-red-600 line-through"
                        : "border-ink/15 hover:border-ink"
                  }`}
                >
                  {s.label}
                  {booked && <span className="block text-[9px] font-normal">réservé</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Réglages avancés */}
      <button
        onClick={() => setShowAdv((v) => !v)}
        className="mt-8 text-sm font-semibold text-ink/50 hover:text-ink"
      >
        {showAdv ? "▾" : "▸"} Réglages avancés (horaires & jours de fermeture fixes)
      </button>
      {showAdv && (
        <div className="mt-4 rounded-2xl border border-line bg-white/40 p-5">
          <div className="text-xs font-semibold uppercase text-ink/50">Jours de fermeture habituels</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {WEEKDAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setA({ ...a, openDays: a.openDays.map((v, j) => (j === i ? !v : v)) })}
                className={`rounded-xl border p-3 text-sm font-semibold transition ${
                  a.openDays[i] ? "border-line bg-white/50" : "border-red-300 bg-red-50 text-red-600"
                }`}
              >
                {day.slice(0, 3)} · {a.openDays[i] ? "ouvert" : "fermé"}
              </button>
            ))}
          </div>
          <div className="mt-4 grid max-w-md gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-ink/50">Ouverture</span>
              <select value={a.open} onChange={(e) => setA({ ...a, open: Number(e.target.value) })} className="admin-input">
                {hoursRange(7, 14).map((m) => (<option key={m} value={m}>{fmt(m)}</option>))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-ink/50">Fermeture</span>
              <select value={a.close} onChange={(e) => setA({ ...a, close: Number(e.target.value) })} className="admin-input">
                {hoursRange(18, 24).map((m) => (<option key={m} value={m}>{fmt(m)}</option>))}
              </select>
            </label>
          </div>
          <button onClick={saveAdv} className="mt-5 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:bg-violet">
            Enregistrer les réglages
          </button>
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

/* -------------------- Onglet Agenda (abonnement iPhone) -------------------- */

function AgendaTab() {
  const [origin, setOrigin] = useState("https://ton-site.vercel.app");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const httpsUrl = `${origin}/api/calendar?key=TA_CLE`;
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(webcalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Agenda iPhone</h1>
      <p className="mt-1 text-sm text-ink/50">
        Abonne ton iPhone une seule fois : chaque RDV apparaît ensuite tout seul
        dans ton agenda.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-white/50 p-5">
        <div className="text-xs font-semibold uppercase text-ink/50">
          Lien d’abonnement
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="flex-1 break-all rounded-xl bg-ink/[0.05] px-3 py-2 text-sm">
            {webcalUrl}
          </code>
          <button
            onClick={copy}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition hover:bg-violet"
          >
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Remplace <strong>TA_CLE</strong> par le code que tu as défini dans la
          variable <code>CALENDAR_FEED_KEY</code> (sur Vercel). Garde ce lien
          privé : il donne accès à tes RDV.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white/50 p-5">
        <div className="text-sm font-semibold">Étapes sur iPhone</div>
        <ol className="mt-3 space-y-2 text-sm text-ink/70">
          {[
            "Copie le lien ci-dessus (avec ta vraie clé).",
            "iPhone → Réglages → Applications → Calendrier → Comptes.",
            "Ajouter un compte → Autre → Ajouter un calendrier avec abonnement.",
            "Colle le lien, valide.",
            "Tes RDV FD7.CUT apparaissent maintenant dans l’app Calendrier 🎉",
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet text-[11px] font-bold text-cream">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border border-violet/30 bg-violet/5 p-5 text-sm text-ink/70">
        ⚡ Fonctionne uniquement quand le site tourne sur <strong>Firebase</strong>{" "}
        (les RDV doivent être stockés en ligne). En mode démo, l’agenda reste vide.
        L’iPhone actualise le calendrier automatiquement (toutes les ~15 min à
        quelques heures selon les réglages).
      </div>
    </div>
  );
}
