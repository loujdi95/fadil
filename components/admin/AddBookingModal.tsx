"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminCreateBooking,
  getAvailability,
  getBookingsForDate,
  DEFAULT_AVAILABILITY,
  type Availability,
} from "@/lib/store";
import {
  dateKey,
  generateSlots,
  occupiedSlots,
  prestationSpan,
  PRESTATIONS,
  AFTER_HOUR_FROM,
} from "@/lib/booking";
import { CloseIcon } from "@/components/ui-icons";

export default function AddBookingModal({
  onClose,
  onDone,
  defaultDate,
}: {
  onClose: () => void;
  onDone: () => void;
  defaultDate?: string;
}) {
  const [avail, setAvail] = useState<Availability>(DEFAULT_AVAILABILITY);
  const [date, setDate] = useState(defaultDate ?? dateKey(new Date()));
  const [prestation, setPrestation] = useState<string>(PRESTATIONS[0]);
  const [slot, setSlot] = useState<number | null>(null);
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAvailability().then(setAvail).catch(() => {});
  }, []);

  useEffect(() => {
    setSlot(null);
    getBookingsForDate(date)
      .then((bs) =>
        setTaken(
          new Set(
            bs
              .filter((b) => b.status !== "noshow")
              .flatMap((b) => occupiedSlots(b.slot, b.span ?? 1)),
          ),
        ),
      )
      .catch(() => setTaken(new Set()));
  }, [date]);

  const slots = useMemo(() => generateSlots(avail.open, avail.close), [avail]);
  const values = useMemo(() => new Set(slots.map((s) => s.value)), [slots]);
  const span = prestationSpan(prestation);

  const free = (start: number) =>
    occupiedSlots(start, span).every((m) => values.has(m) && !taken.has(m));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (slot === null) return setErr("Choisis un créneau.");
    setBusy(true);
    setErr("");
    const s = slots.find((x) => x.value === slot)!;
    const r = await adminCreateBooking({
      date,
      slot,
      slotLabel: s.label,
      name: name.trim(),
      phone: phone.trim(),
      prestation,
      span,
      afterHour: slot >= AFTER_HOUR_FROM,
      note: note.trim() || undefined,
    });
    setBusy(false);
    if (r.ok) {
      onDone();
      onClose();
    } else setErr(r.reason ?? "Erreur.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-5" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Ajouter un RDV</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5" aria-label="Fermer">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink/50">Client au téléphone ou passé au salon. Confirmé direct.</p>

        <label className="mt-5 block">
          <span className="lbl">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="admin-input" required />
        </label>

        <div className="mt-4">
          <span className="lbl">Prestation</span>
          <div className="flex flex-wrap gap-2">
            {PRESTATIONS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => { setPrestation(p); setSlot(null); }}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  prestation === p ? "border-violet bg-violet text-cream" : "border-ink/15 hover:border-ink"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="lbl">Heure</span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {slots.map((s) => {
              const ok = free(s.value);
              return (
                <button
                  type="button"
                  key={s.value}
                  disabled={!ok}
                  onClick={() => setSlot(s.value)}
                  className={`rounded-xl border py-2 text-sm font-semibold transition ${
                    slot === s.value
                      ? "border-violet bg-violet text-cream"
                      : ok
                        ? "border-ink/15 hover:border-ink"
                        : "cursor-not-allowed border-transparent bg-ink/[0.04] text-ink/25 line-through"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="lbl">Nom du client</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="admin-input" placeholder="Karim" required />
          </label>
          <label className="block">
            <span className="lbl">Téléphone (optionnel)</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="admin-input" placeholder="06…" />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="lbl">Note (optionnel)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="admin-input" placeholder="Dégradé bas, contour…" />
        </label>

        {err && <p className="mt-3 text-sm font-medium text-red-600">{err}</p>}

        <button
          disabled={busy}
          className="mt-5 w-full rounded-full bg-ink py-3.5 font-semibold text-cream transition hover:bg-violet disabled:opacity-50"
        >
          {busy ? "Ajout…" : "Ajouter le RDV"}
        </button>
      </form>
    </div>
  );
}
