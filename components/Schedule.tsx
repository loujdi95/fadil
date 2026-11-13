import {
  PRESTATIONS,
  prestationSpan,
  SLOT_MINUTES,
  AFTER_HOUR_FROM,
  AFTER_HOUR_SURCHARGE,
  fmt,
} from "@/lib/booking";
import { ArrowIcon } from "./icons";

export default function Schedule() {
  return (
    <section id="horaires" className="border-y border-line bg-white/40">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet">Prestations</p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Ce que je fais</h2>
          </div>
          <p className="max-w-xs text-sm text-ink/60">
            Choisis ta prestation au moment de réserver, la durée est calculée toute seule.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRESTATIONS.map((p, i) => {
            const min = prestationSpan(p) * SLOT_MINUTES;
            return (
              <a
                key={p}
                href="#reservation"
                data-reveal
                className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-cream p-5 transition hover:-translate-y-0.5 hover:border-ink"
              >
                <div className="flex items-center gap-4">
                  <span className="font-display text-sm font-bold text-violet">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="font-display text-lg font-bold">{p}</div>
                    <div className="text-sm text-ink/50">{min} min</div>
                  </div>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05] transition group-hover:bg-violet group-hover:text-cream">
                  <ArrowIcon className="h-4 w-4" />
                </span>
              </a>
            );
          })}

          {/* after hour */}
          <div data-reveal className="flex items-center gap-4 rounded-2xl bg-ink p-5 text-cream sm:col-span-2 lg:col-span-1">
            <span className="text-2xl">🌙</span>
            <div>
              <div className="font-display text-lg font-bold">After hour</div>
              <div className="text-sm text-cream/60">
                Dès {fmt(AFTER_HOUR_FROM)}, +{AFTER_HOUR_SURCHARGE} sur la prestation
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
