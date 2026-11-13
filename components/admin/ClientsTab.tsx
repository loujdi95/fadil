"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllBookings } from "@/lib/store";
import { dateKey, type Booking } from "@/lib/booking";
import { clientKey, shortDay, telUrl, smsUrl, whatsappUrl } from "./utils";
import {
  SearchIcon,
  StarIcon,
  ScissorsIcon,
  AlertIcon,
  PhoneIcon,
  MessageIcon,
  WhatsAppIcon,
} from "@/components/ui-icons";

type Client = {
  key: string;
  name: string;
  phone: string;
  visits: number;
  noshows: number;
  last?: string;
  next?: Booking;
  favorite: string;
};

export default function ClientsTab() {
  const [all, setAll] = useState<Booking[] | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"visits" | "recent">("visits");

  useEffect(() => {
    getAllBookings().then(setAll).catch(() => setAll([]));
  }, []);

  const clients = useMemo(() => {
    const today = dateKey(new Date());
    const map = new Map<string, Booking[]>();
    (all ?? []).forEach((b) => {
      const k = clientKey(b);
      map.set(k, [...(map.get(k) ?? []), b]);
    });
    const list: Client[] = [...map.entries()].map(([key, bs]) => {
      bs.sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
      const done = bs.filter((b) => b.date < today && b.status === "confirmed");
      const presta = new Map<string, number>();
      done.forEach((b) => presta.set(b.prestation, (presta.get(b.prestation) ?? 0) + 1));
      const latest = bs[bs.length - 1];
      return {
        key,
        name: latest.name,
        phone: bs.find((b) => b.phone)?.phone ?? "",
        visits: done.length,
        noshows: bs.filter((b) => b.status === "noshow").length,
        last: done[done.length - 1]?.date,
        next: bs.find((b) => b.date >= today && b.status !== "noshow"),
        favorite: [...presta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? latest.prestation,
      };
    });
    const needle = q.trim().toLowerCase();
    return list
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.phone.replace(/\s/g, "").includes(needle.replace(/\s/g, "")))
      .sort((a, b) => (sort === "visits" ? b.visits - a.visits : (b.last ?? "").localeCompare(a.last ?? "")));
  }, [all, q, sort]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Clients</h1>
      <p className="mt-1 text-sm text-ink/50">
        {clients.length} client{clients.length > 1 ? "s" : ""} · regroupés par numéro de téléphone
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher un client"
            className="admin-input !pl-10"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as "visits" | "recent")} className="admin-input w-auto">
          <option value="visits">Les plus fidèles</option>
          <option value="recent">Vus récemment</option>
        </select>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {all === null && <p className="text-ink/40">Chargement…</p>}
        {all && clients.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-ink/40 md:col-span-2">
            Pas encore de clients.
          </div>
        )}
        {clients.map((c) => (
          <div key={c.key} className="rounded-2xl border border-line bg-white/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet font-display text-lg font-bold text-cream">
                  {c.name[0]?.toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    {c.name}
                    {c.visits >= 5 && (
                      <span title="Client fidèle" className="inline-flex items-center gap-1 rounded-full bg-violet/10 px-2 py-0.5 text-[10px] font-bold uppercase text-violet">
                        <StarIcon className="h-3 w-3" /> Fidèle
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-ink/50">{c.phone || "pas de numéro"}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold">{c.visits}</div>
                <div className="text-[10px] font-semibold uppercase text-ink/40">visite{c.visits > 1 ? "s" : ""}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
              <span className="inline-flex items-center gap-1"><ScissorsIcon className="h-3.5 w-3.5" /> {c.favorite}</span>
              {c.last && <span>Dernière : {shortDay(c.last)}</span>}
              {c.next && <span className="font-semibold text-violet">Prochain : {shortDay(c.next.date)} {c.next.slotLabel}</span>}
              {c.noshows > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                  <AlertIcon className="h-3.5 w-3.5" /> {c.noshows} absence{c.noshows > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {c.phone && (
              <div className="mt-3 flex gap-2">
                <a href={telUrl(c.phone)} className="chip" aria-label="Appeler"><PhoneIcon /> Appeler</a>
                <a href={smsUrl(c.phone)} className="chip" aria-label="SMS"><MessageIcon /> SMS</a>
                <a href={whatsappUrl(c.phone)} target="_blank" rel="noreferrer" className="chip"><WhatsAppIcon /> WhatsApp</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
