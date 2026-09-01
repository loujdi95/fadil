"use client";

import { useEffect, useMemo, useState } from "react";
import {
  generateSlots,
  dateKey,
  weekdayIndex,
  startOfWeek,
  WEEKDAYS,
  PRESTATIONS,
  AFTER_HOUR_SURCHARGE,
  type Slot,
  type Booking as BookingType,
} from "@/lib/booking";
import {
  getAvailability,
  getBlocks,
  getBookingsForDate,
  createBooking,
  DEFAULT_AVAILABILITY,
  DEFAULT_BLOCKS,
  type Availability,
  type Blocks,
} from "@/lib/store";
import { notifyNewBooking } from "@/lib/notify";
import { ArrowIcon } from "./icons";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function labelDate(d: Date) {
  return `${WEEKDAYS[weekdayIndex(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function Booking() {
  const [avail, setAvail] = useState<Availability>(DEFAULT_AVAILABILITY);
  const [blocks, setBlocks] = useState<Blocks>(DEFAULT_BLOCKS);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState<{ name: string; phone: string; prestation: string; note: string }>(
    { name: "", phone: "", prestation: PRESTATIONS[0], note: "" },
  );
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    getAvailability().then(setAvail).catch(() => setAvail(DEFAULT_AVAILABILITY));
    getBlocks().then(setBlocks).catch(() => setBlocks(DEFAULT_BLOCKS));
  }, []);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const slots = useMemo(
    () => generateSlots(avail.open, avail.close),
    [avail.open, avail.close],
  );

  async function pickDay(d: Date) {
    setSelected(d);
    setSlot(null);
    setStatus("idle");
    setLoadingSlots(true);
    try {
      const b = await getBookingsForDate(dateKey(d));
      setTaken(new Set(b.map((x) => x.slot)));
    } catch {
      setTaken(new Set());
    } finally {
      setLoadingSlots(false);
    }
  }

  function isOpen(d: Date) {
    return (
      avail.openDays[weekdayIndex(d)] &&
      d >= today &&
      !blocks.offDays.includes(dateKey(d))
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !slot) return;
    setStatus("sending");
    setErrorMsg("");
    const booking: BookingType = {
      date: dateKey(selected),
      slot: slot.value,
      slotLabel: slot.label,
      name: form.name.trim(),
      phone: form.phone.trim(),
      prestation: form.prestation,
      afterHour: slot.afterHour,
      note: form.note.trim() || undefined,
    };
    const res = await createBooking(booking);
    if (res.ok) {
      // e-mail au coiffeur avec liens Valider / Annuler (si configuré)
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const base = `${origin}/api/booking`;
      const q = `id=${res.id}&token=${res.token}`;
      notifyNewBooking(booking, {
        confirmUrl: `${base}/confirm?${q}`,
        cancelUrl: `${base}/cancel?${q}`,
        adminUrl: `${origin}/admin`,
      });
      setStatus("done");
    } else {
      setStatus("error");
      setErrorMsg(res.reason || "Une erreur est survenue.");
      await pickDay(selected); // refresh les créneaux pris
    }
  }

  const canPrev = weekStart > startOfWeek(today);

  if (status === "done" && selected && slot) {
    return (
      <section id="reservation" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white/60 p-10 text-center violet-glow">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet text-cream">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="mt-6 font-display text-3xl font-bold">Demande envoyée ✂️</h3>
          <p className="mt-3 text-ink/70">
            {labelDate(selected)} à <strong>{slot.label}</strong> — {form.prestation}.
          </p>
          <p className="mt-2 text-sm text-ink/50">
            {form.name}, ton créneau est réservé. FD7.CUT te confirme le RDV très vite.
          </p>
          <button
            onClick={() => {
              setStatus("idle");
              setSlot(null);
              setSelected(null);
              setForm({ name: "", phone: "", prestation: PRESTATIONS[0], note: "" });
            }}
            className="mt-8 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold transition hover:border-ink"
          >
            Nouvelle réservation
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="reservation" className="mx-auto max-w-6xl px-5 py-24">
      <div data-reveal className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet">
          Réservation
        </p>
        <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
          Choisis ton créneau
        </h2>
        <p className="mt-4 text-ink/70">
          Créneaux de 40 min. Un rendez-vous après 20h ? C’est possible en{" "}
          <span className="font-semibold text-ink">after hour</span> (+{AFTER_HOUR_SURCHARGE} sur la presta).
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Colonne 1 : semaine + jours */}
        <div data-reveal className="rounded-3xl border border-line bg-white/50 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => canPrev && setWeekStart((w) => addDays(w, -7))}
              disabled={!canPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 transition enabled:hover:border-ink disabled:opacity-30"
              aria-label="Semaine précédente"
            >
              <ArrowIcon className="h-4 w-4 rotate-180" />
            </button>
            <div className="text-center text-sm font-semibold">
              {days[0].getDate()} {MONTHS[days[0].getMonth()].slice(0, 4)} —{" "}
              {days[6].getDate()} {MONTHS[days[6].getMonth()].slice(0, 4)}
            </div>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 transition hover:border-ink"
              aria-label="Semaine suivante"
            >
              <ArrowIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2">
            {days.map((d) => {
              const open = isOpen(d);
              const isSel = selected && dateKey(selected) === dateKey(d);
              return (
                <button
                  key={dateKey(d)}
                  disabled={!open}
                  onClick={() => pickDay(d)}
                  className={`flex flex-col items-center rounded-2xl border py-3 transition ${
                    isSel
                      ? "border-violet bg-violet text-cream"
                      : open
                        ? "border-ink/15 hover:border-ink"
                        : "cursor-not-allowed border-transparent bg-ink/[0.03] text-ink/25"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase">
                    {WEEKDAYS[weekdayIndex(d)].slice(0, 3)}
                  </span>
                  <span className="mt-1 font-display text-lg font-bold">{d.getDate()}</span>
                  {!open && <span className="mt-0.5 text-[9px]">fermé</span>}
                </button>
              );
            })}
          </div>

          {/* créneaux */}
          <div className="mt-6 border-t border-line pt-6">
            {!selected && (
              <p className="py-8 text-center text-sm text-ink/50">
                Sélectionne un jour disponible.
              </p>
            )}
            {selected && loadingSlots && (
              <p className="py-8 text-center text-sm text-ink/50">Chargement…</p>
            )}
            {selected && !loadingSlots && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const offForDay = selected ? blocks.offSlots[dateKey(selected)] ?? [] : [];
                  const isTaken = taken.has(s.value) || offForDay.includes(s.value);
                  const isSel = slot?.value === s.value;
                  return (
                    <button
                      key={s.value}
                      disabled={isTaken}
                      onClick={() => setSlot(s)}
                      className={`relative rounded-xl border py-2.5 text-sm font-semibold transition ${
                        isSel
                          ? "border-violet bg-violet text-cream"
                          : isTaken
                            ? "cursor-not-allowed border-transparent bg-ink/[0.04] text-ink/25 line-through"
                            : "border-ink/15 hover:border-ink"
                      }`}
                    >
                      {s.label}
                      {s.afterHour && !isTaken && (
                        <span
                          className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                            isSel ? "bg-cream text-violet" : "bg-violet text-cream"
                          }`}
                        >
                          +
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Colonne 2 : formulaire */}
        <form
          onSubmit={submit}
          data-reveal
          className="rounded-3xl border border-line bg-white/50 p-6 md:p-8"
        >
          <h3 className="font-display text-2xl font-bold">Tes infos</h3>
          <div className="mt-6 space-y-4">
            <Field label="Prénom & nom">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex : Karim B."
                className="input"
              />
            </Field>
            <Field label="Téléphone">
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="06 12 34 56 78"
                className="input"
              />
            </Field>
            <Field label="Prestation">
              <select
                value={form.prestation}
                onChange={(e) => setForm({ ...form, prestation: e.target.value })}
                className="input"
              >
                {PRESTATIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Note (optionnel)">
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Une précision ?"
                className="input"
              />
            </Field>
          </div>

          {/* récap */}
          <div className="mt-6 rounded-2xl bg-ink/[0.04] p-4 text-sm">
            {selected && slot ? (
              <div className="flex items-center justify-between">
                <span className="text-ink/70">
                  {labelDate(selected)} · <strong className="text-ink">{slot.label}</strong>
                </span>
                {slot.afterHour && (
                  <span className="rounded-full bg-violet px-2.5 py-1 text-xs font-semibold text-cream">
                    After hour +{AFTER_HOUR_SURCHARGE}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-ink/50">Choisis un jour et un créneau à gauche.</span>
            )}
          </div>

          {status === "error" && (
            <p className="mt-4 text-sm font-medium text-red-600">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={!selected || !slot || status === "sending"}
            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-base font-semibold text-cream transition enabled:hover:bg-violet disabled:opacity-40"
          >
            {status === "sending" ? "Envoi…" : "Confirmer la réservation"}
            {status !== "sending" && (
              <ArrowIcon className="h-4 w-4 transition-transform group-enabled:group-hover:translate-x-1" />
            )}
          </button>
          <p className="mt-3 text-center text-xs text-ink/40">
            Pas de paiement en ligne — tu règles sur place.
          </p>
        </form>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(11, 11, 13, 0.15);
          background: rgba(255, 255, 255, 0.6);
          padding: 0.8rem 1rem;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        :global(.input:focus) {
          border-color: var(--violet);
          box-shadow: 0 0 0 3px var(--violet-glow);
        }
      `}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
