"use client";

import { useEffect, useState } from "react";
import { isFirebaseReady, auth } from "@/lib/firebase";
import { signIn, signOut, watchAuth, DEMO_PASSCODE } from "@/lib/auth";
import {
  getAvailability,
  saveAvailability,
  getBlocks,
  saveBlocks,
  getIcloudUrl,
  saveIcloudUrl,
  getBookingsForDate,
  DEFAULT_AVAILABILITY,
  DEFAULT_BLOCKS,
  type Availability,
  type Blocks,
} from "@/lib/store";
import {
  WEEKDAYS,
  fmt,
  generateSlots,
  dateKey,
  weekdayIndex,
  startOfWeek,
  occupiedSlots,
} from "@/lib/booking";
import TodayTab from "@/components/admin/TodayTab";
import BookingsTab from "@/components/admin/BookingsTab";
import ClientsTab from "@/components/admin/ClientsTab";

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

type Tab = "today" | "resa" | "clients" | "dispo" | "agenda";

const TABS: { k: Tab; label: string; icon: string }[] = [
  { k: "today", label: "Aujourd’hui", icon: "🏠" },
  { k: "resa", label: "RDV", icon: "📅" },
  { k: "clients", label: "Clients", icon: "👥" },
  { k: "dispo", label: "Planning", icon: "🗓️" },
  { k: "agenda", label: "iPhone", icon: "📱" },
];

function Dashboard() {
  const [tab, setTab] = useState<Tab>("today");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-dark.png" alt="FD7" className="h-7 w-auto" />
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="rounded-full px-3 py-2 text-sm text-ink/50 hover:text-ink">Voir le site ↗</a>
            <button
              onClick={async () => { await signOut(); window.location.reload(); }}
              className="rounded-full border border-ink/15 px-3 py-2 text-sm font-semibold transition hover:border-ink"
            >
              Déconnexion
            </button>
          </div>
        </div>
        {/* onglets (ordi) */}
        <nav className="mx-auto hidden max-w-5xl gap-1 px-5 md:flex">
          {TABS.map(({ k, label }) => (
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
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {tab === "today" && <TodayTab goTo={setTab} />}
        {tab === "resa" && <BookingsTab />}
        {tab === "clients" && <ClientsTab />}
        {tab === "dispo" && <AvailabilityTab />}
        {tab === "agenda" && <AgendaTab />}
      </main>

      {/* barre du bas (téléphone) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {TABS.map(({ k, label, icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
              tab === k ? "text-violet" : "text-ink/45"
            }`}
          >
            <span className={`text-lg transition ${tab === k ? "scale-110" : "grayscale"}`}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

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
        .lbl {
          display: block;
          margin-bottom: 0.4rem;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(11, 11, 13, 0.5);
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          border-radius: 999px;
          border: 1px solid rgba(11, 11, 13, 0.12);
          background: rgba(255, 255, 255, 0.7);
          padding: 0.45rem 0.8rem;
          font-size: 0.8rem;
          font-weight: 600;
          transition: border-color 0.2s;
        }
        .chip:hover {
          border-color: var(--ink);
        }
      `}</style>
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
      .then((b) =>
        setDayBookings(
          new Set(
            b.filter((x) => x.status !== "noshow").flatMap((x) => occupiedSlots(x.slot, x.span ?? 1)),
          ),
        ),
      )
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
  for (let m = fromH * 60; m <= toH * 60; m += 30) out.push(m);
  return out;
}

/* -------------------- Onglet Agenda (iPhone <-> site) -------------------- */

function AgendaTab() {
  const [icloud, setIcloud] = useState("");
  const [savedIcloud, setSavedIcloud] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [feed, setFeed] = useState<string | null>(null);
  const [feedErr, setFeedErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getIcloudUrl().then((u) => { setIcloud(u); setSavedIcloud(u); }).catch(() => {});
    (async () => {
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) { setFeedErr("Disponible une fois Firebase connecté."); return; }
        const res = await fetch("/api/admin/feed", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setFeed(data.webcal);
        else setFeedErr(data.error === "CALENDAR_FEED_KEY manquant"
          ? "Ajoute la variable CALENDAR_FEED_KEY sur Vercel."
          : "Lien indisponible pour le moment.");
      } catch {
        setFeedErr("Lien indisponible pour le moment.");
      }
    })();
  }, []);

  const valid = /^(webcal|https):\/\/.+/i.test(icloud.trim()) || icloud.trim() === "";

  const saveIcloud = async () => {
    if (!valid) return;
    setState("saving");
    try {
      await saveIcloudUrl(icloud);
      setSavedIcloud(icloud.trim());
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
    }
  };

  const copy = async () => {
    if (!feed) return;
    try {
      await navigator.clipboard.writeText(feed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Agenda iPhone</h1>
        <p className="mt-1 text-sm text-ink/50">Relie ton iPhone au site, dans les deux sens.</p>
      </div>

      {/* 1. iPhone -> site */}
      <section className="rounded-2xl border border-line bg-white/50 p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet px-2.5 py-0.5 text-[11px] font-bold text-cream">1</span>
          <h2 className="font-semibold">Ton agenda iPhone bloque le site</h2>
        </div>
        <p className="mt-2 text-sm text-ink/60">
          Chaque événement de ton agenda (rdv perso, sport, vacances…) rend les créneaux
          indisponibles sur le site, automatiquement.
        </p>
        <ol className="mt-4 space-y-2 text-sm text-ink/70">
          {[
            "Sur iPhone, ouvre Calendrier → touche « Calendriers » en bas.",
            "Crée un calendrier dédié, ex. « FD7 indispo » (conseillé), ou utilise un existant.",
            "Touche le ⓘ à côté → active « Calendrier public » → « Partager le lien » → Copier.",
            "Colle le lien ci-dessous et enregistre.",
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[11px] font-bold">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="admin-input flex-1"
            placeholder="webcal://p00-caldav.icloud.com/published/2/…"
            value={icloud}
            onChange={(e) => setIcloud(e.target.value)}
          />
          <button
            onClick={saveIcloud}
            disabled={!valid || state === "saving" || icloud.trim() === savedIcloud}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-violet disabled:opacity-40"
          >
            {state === "saving" ? "…" : state === "saved" ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </div>
        {!valid && <p className="mt-2 text-xs text-red-600">Le lien doit commencer par webcal:// ou https://</p>}
        {state === "error" && <p className="mt-2 text-xs text-red-600">Erreur d’enregistrement.</p>}
        <p className="mt-3 text-xs text-ink/50">
          Les événements « journée entière » bloquent toute la journée. Mise à jour toutes les ~5 min.
          Seuls les créneaux occupés sont utilisés : le contenu de tes événements n’est jamais affiché.
        </p>
      </section>

      {/* 2. site -> iPhone */}
      <section className="rounded-2xl border border-line bg-white/50 p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet px-2.5 py-0.5 text-[11px] font-bold text-cream">2</span>
          <h2 className="font-semibold">Les RDV du site apparaissent dans ton iPhone</h2>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="flex-1 break-all rounded-xl bg-ink/[0.05] px-3 py-2 text-sm">
            {feed || feedErr || "Chargement…"}
          </code>
          <button
            onClick={copy}
            disabled={!feed}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition hover:bg-violet disabled:opacity-40"
          >
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
        <ol className="mt-4 space-y-2 text-sm text-ink/70">
          {[
            "Copie le lien ci-dessus (envoie-le toi par message pour l’avoir sur l’iPhone).",
            "iPhone → Réglages → Apps → Calendrier → Comptes → Ajouter un compte.",
            "Autre → « Ajouter un calendrier avec abonnement » → colle le lien.",
            "Les RDV FD7.CUT apparaissent dans Calendrier (⏳ = en attente de validation).",
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[11px] font-bold">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink/50">Garde ce lien privé : il donne accès à la liste de tes RDV.</p>
      </section>

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
