"use client";

import { useState } from "react";
import { deleteBooking, setBookingStatus } from "@/lib/store";
import { notifyClientConfirmed } from "@/lib/notify";
import { dateKey, type Booking } from "@/lib/booking";
import {
  shortDay,
  timeRange,
  telUrl,
  smsUrl,
  whatsappUrl,
  confirmMessage,
  reminderMessage,
} from "./utils";

const STATUS = {
  pending: { label: "À valider", cls: "bg-violet/15 text-violet" },
  confirmed: { label: "Confirmé", cls: "bg-green-600/15 text-green-700" },
  noshow: { label: "Lapin 🐰", cls: "bg-red-500/15 text-red-600" },
} as const;

export default function BookingCard({
  b,
  onChange,
  showDate = true,
}: {
  b: Booking;
  onChange: () => void;
  showDate?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const st = b.status ?? "pending";
  const today = dateKey(new Date());
  const past = b.date < today;
  const msg = st === "pending" ? confirmMessage(b) : reminderMessage(b);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-white/60 p-4 transition ${
        st === "pending" ? "border-violet/40 shadow-[0_0_0_3px_rgba(124,58,237,0.06)]" : "border-line"
      } ${busy ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-ink py-2 text-cream">
          {showDate && (
            <span className="text-[10px] uppercase tracking-wide text-cream/60">{shortDay(b.date)}</span>
          )}
          <span className="font-display text-base font-bold">{b.slotLabel}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{b.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS[st].cls}`}>
              {STATUS[st].label}
            </span>
            {b.afterHour && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cream">after +5</span>
            )}
            {b.source === "admin" && (
              <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10px] font-semibold text-ink/50">ajouté par toi</span>
            )}
          </div>
          <div className="mt-0.5 text-sm text-ink/60">
            {b.prestation} · {timeRange(b)}
          </div>
          {b.phone && <div className="text-sm text-ink/50">{b.phone}</div>}
          {b.note && <div className="mt-1 text-xs italic text-ink/40">“{b.note}”</div>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {b.phone && (
          <>
            <a href={telUrl(b.phone)} className="chip">📞 Appeler</a>
            <a href={smsUrl(b.phone, msg)} className="chip">💬 SMS</a>
            <a href={whatsappUrl(b.phone, msg)} target="_blank" rel="noreferrer" className="chip">🟢 WhatsApp</a>
          </>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          {st === "pending" && (
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await setBookingStatus(b.id!, "confirmed");
                  notifyClientConfirmed(b);
                })
              }
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition hover:bg-violet"
            >
              ✓ Confirmer
            </button>
          )}
          {past && st === "confirmed" && (
            <button
              disabled={busy}
              onClick={() => run(() => setBookingStatus(b.id!, "noshow"))}
              className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Pas venu
            </button>
          )}
          {st === "noshow" && (
            <button
              disabled={busy}
              onClick={() => run(() => setBookingStatus(b.id!, "confirmed"))}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-ink"
            >
              Il est venu
            </button>
          )}
          {!past && (
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm(`${st === "pending" ? "Refuser" : "Annuler"} le RDV de ${b.name} ? Le créneau sera libéré.`)) {
                  run(() => deleteBooking(b.id!));
                }
              }}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink/50 transition hover:border-red-400 hover:text-red-600"
            >
              {st === "pending" ? "Refuser" : "Annuler"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
