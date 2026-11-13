"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllBookings } from "@/lib/store";
import { dateKey, type Booking } from "@/lib/booking";
import BookingCard from "./BookingCard";
import AddBookingModal from "./AddBookingModal";
import { shortDay } from "./utils";

type Filter = "pending" | "upcoming" | "past";

export default function BookingsTab() {
  const [all, setAll] = useState<Booking[] | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => getAllBookings().then(setAll).catch(() => setAll([]));
  useEffect(() => { load(); }, []);

  const today = dateKey(new Date());

  const counts = useMemo(() => {
    const a = all ?? [];
    return {
      pending: a.filter((b) => (b.status ?? "pending") === "pending" && b.date >= today).length,
      upcoming: a.filter((b) => b.date >= today).length,
      past: a.filter((b) => b.date < today).length,
    };
  }, [all, today]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = (all ?? [])
      .filter((b) =>
        filter === "pending"
          ? (b.status ?? "pending") === "pending" && b.date >= today
          : filter === "upcoming"
            ? b.date >= today
            : b.date < today,
      )
      .filter(
        (b) =>
          !needle ||
          b.name.toLowerCase().includes(needle) ||
          b.phone.replace(/\s/g, "").includes(needle.replace(/\s/g, "")),
      )
      .sort((a, b) => {
        const k = (a.date + String(a.slot).padStart(4, "0")).localeCompare(b.date + String(b.slot).padStart(4, "0"));
        return filter === "past" ? -k : k;
      });
    const map = new Map<string, Booking[]>();
    list.forEach((b) => map.set(b.date, [...(map.get(b.date) ?? []), b]));
    return [...map.entries()];
  }, [all, filter, q, today]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Réservations</h1>
        <button
          onClick={() => setAdding(true)}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-violet"
        >
          + Ajouter un RDV
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {([
          ["pending", "À valider"],
          ["upcoming", "À venir"],
          ["past", "Passés"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === k ? "border-ink bg-ink text-cream" : "border-ink/15 hover:border-ink"
            }`}
          >
            {label}
            <span className={`ml-1.5 ${filter === k ? "text-cream/60" : "text-ink/40"}`}>{counts[k]}</span>
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Chercher un nom ou un numéro"
        className="admin-input mt-4"
      />

      <div className="mt-6 space-y-8">
        {all === null && <p className="text-ink/40">Chargement…</p>}
        {all && groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-ink/40">
            Aucun rendez-vous ici.
          </div>
        )}
        {groups.map(([date, list]) => (
          <section key={date}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink/40">
              {date === today ? "Aujourd’hui" : shortDay(date)}
              <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] text-ink/50">{list.length}</span>
            </h2>
            <div className="space-y-3">
              {list.map((b) => (
                <BookingCard key={b.id} b={b} onChange={load} showDate={false} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {adding && <AddBookingModal onClose={() => setAdding(false)} onDone={load} />}
    </div>
  );
}
