import { generateSlots, fmt, AFTER_HOUR_FROM, AFTER_HOUR_SURCHARGE } from "@/lib/booking";

export default function Schedule() {
  const slots = generateSlots(10 * 60, 20 * 60); // journée standard affichée
  const pause = { start: 13 * 60 + 20, end: 14 * 60 };

  return (
    <section id="horaires" className="border-y border-line bg-white/40">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet">
              Horaires
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              Comment ça marche
            </h2>
            <ul className="mt-8 space-y-5">
              {[
                ["Créneaux de 40 min", "Chaque rendez-vous dure 40 minutes, de 10h à 20h."],
                ["Pause déjeuner", `Fermé de ${fmt(pause.start)} à ${fmt(pause.end)}.`],
                ["After hour", `Un rendez-vous dès ${fmt(AFTER_HOUR_FROM)} ? Possible, +${AFTER_HOUR_SURCHARGE} sur la prestation.`],
                ["Semaine par semaine", "Seuls les jours ouverts sont réservables. Le reste est bloqué."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet text-[11px] font-bold text-cream">
                    ✦
                  </span>
                  <div>
                    <div className="font-semibold">{t}</div>
                    <div className="text-sm text-ink/60">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* grille de créneaux type "planning" */}
          <div data-reveal className="rounded-3xl border border-line bg-cream p-6 md:p-8">
            <div className="mb-4 text-sm font-semibold text-ink/50">
              Une journée type
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {slots.map((s) => (
                <div
                  key={s.value}
                  className={`rounded-xl border px-2 py-3 text-center text-sm font-semibold ${
                    s.afterHour
                      ? "border-violet/40 bg-violet/10 text-violet"
                      : "border-ink/10 text-ink/80"
                  }`}
                >
                  {s.label}
                </div>
              ))}
              <div className="col-span-2 flex items-center justify-center rounded-xl border border-dashed border-ink/20 px-2 py-3 text-center text-xs font-medium text-ink/40 sm:col-span-1">
                {fmt(pause.start)}
                <br />
                Pause
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
