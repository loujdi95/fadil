"use client";

import { useEffect, useState } from "react";
import { getAllBookings } from "@/lib/store";
import { dateKey, startOfWeek, type Booking } from "@/lib/booking";
import BookingCard from "./BookingCard";
import AddBookingModal from "./AddBookingModal";
import { shortDay } from "./utils";

export default function TodayTab({ goTo }: { goTo: (tab: "resa") => void }) {
  const [all, setAll] = useState<Booking[] | null>(null);
  const [adding, setAdding] = useState(false);

  const load = () => getAllBookings().then(setAll).catch(() => setAll([]));
  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // rafraîchit chaque minute
    return () => clearInterval(t);
  }, []);

  if (!all) return <p className="text-ink/40">Chargement…</p>;

  const now = new Date();
  const today = dateKey(now);
  const tomorrow = dateKey(new Date(now.getTime() + 86400000));
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const ws = dateKey(startOfWeek(now));
  const we = dateKey(new Date(startOfWeek(now).getTime() + 6 * 86400000));
  const month = today.slice(0, 7);

  const active = all.filter((b) => b.status !== "noshow");
  const pending = active.filter((b) => (b.status ?? "pending") === "pending" && b.date >= today);
  const todayList = active.filter((b) => b.date === today).sort((a, b) => a.slot - b.slot);
  const tomorrowList = active.filter((b) => b.date === tomorrow).sort((a, b) => a.slot - b.slot);
  const week = active.filter((b) => b.date >= ws && b.date <= we);
  const noshowMonth = all.filter((b) => b.status === "noshow" && b.date.startsWith(month));
  const next = todayList.find((b) => b.slot + 40 * (b.span ?? 1) > nowMin);

  const hello = now.getHours() < 12 ? "Bonjour" : now.getHours() < 18 ? "Bon aprem" : "Bonsoir";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold capitalize text-violet">{shortDay(today)}</p>
          <h1 className="font-display text-3xl font-bold">{hello} ✂️</h1>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream transition hover:bg-violet"
        >
          + Ajouter un RDV
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="À valider" value={pending.length} accent={pending.length > 0} onClick={() => goTo("resa")} />
        <Stat label="Aujourd’hui" value={todayList.length} />
        <Stat label="Cette semaine" value={week.length} />
        <Stat label="Lapins ce mois" value={noshowMonth.length} />
      </div>

      {/* Prochain client */}
      {next && (
        <div className="mt-6 rounded-3xl bg-ink p-5 text-cream">
          <div className="text-xs font-semibold uppercase tracking-widest text-violet-bright">
            {next.slot <= nowMin ? "En ce moment" : "Prochain client"}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-4xl font-bold">{next.slotLabel}</span>
            <span className="text-xl font-semibold">{next.name}</span>
          </div>
          <div className="mt-1 text-sm text-cream/60">{next.prestation}{next.note ? ` · “${next.note}”` : ""}</div>
        </div>
      )}

      {/* À valider */}
      {pending.length > 0 && (
        <Section title={`À valider (${pending.length})`}>
          {pending.sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot)).map((b) => (
            <BookingCard key={b.id} b={b} onChange={load} />
          ))}
        </Section>
      )}

      <Section title={`Aujourd’hui (${todayList.length})`}>
        {todayList.length === 0 ? (
          <Empty>Aucun RDV aujourd’hui.</Empty>
        ) : (
          todayList.map((b) => <BookingCard key={b.id} b={b} onChange={load} showDate={false} />)
        )}
      </Section>

      <Section title={`Demain (${tomorrowList.length})`}>
        {tomorrowList.length === 0 ? (
          <Empty>Rien de prévu demain pour l’instant.</Empty>
        ) : (
          tomorrowList.map((b) => <BookingCard key={b.id} b={b} onChange={load} showDate={false} />)
        )}
      </Section>

      {adding && <AddBookingModal onClose={() => setAdding(false)} onDone={load} />}
    </div>
  );
}

function Stat({ label, value, accent, onClick }: { label: string; value: number; accent?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        accent ? "border-violet bg-violet text-cream" : "border-line bg-white/50"
      } ${onClick ? "hover:-translate-y-0.5" : "cursor-default"}`}
    >
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-cream/80" : "text-ink/50"}`}>{label}</div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink/40">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/40">{children}</div>;
}
