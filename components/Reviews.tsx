/* ⚠️ Avis de démonstration — à remplacer par de VRAIS avis clients.
   Modifie simplement le tableau REVIEWS ci-dessous. */

const RATING = 4.9;
const COUNT = 120;

const REVIEWS = [
  { name: "Yanis", text: "Meilleur dégradé de la ville, précis au millimètre. Je ne vais plus ailleurs.", presta: "Coupe + Barbe" },
  { name: "Mehdi", text: "Ponctuel, propre, et il prend le temps. La réservation en ligne c’est top.", presta: "Coupe" },
  { name: "Sofiane", text: "Ambiance au top et résultat toujours nickel. Les designs sont incroyables.", presta: "Contours / Finitions" },
];

function Stars({ value = 5 }: { value?: number }) {
  return (
    <div className="flex gap-0.5 text-violet" aria-label={`${value} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4" fill={i < value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21l1.1-6.5L2.6 9.9l6.5-.9L12 2.5z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

export default function Reviews() {
  return (
    <section className="border-y border-line bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">
              Ils ont testé
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              Ce qu’ils en disent
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="font-display text-5xl font-extrabold">{RATING.toString().replace(".", ",")}</div>
            <div>
              <Stars value={5} />
              <div className="mt-1 text-sm text-cream/60">+{COUNT} clients satisfaits</div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.name} data-reveal className="rounded-3xl border border-cream/15 bg-cream/[0.03] p-6">
              <Stars value={5} />
              <blockquote className="mt-4 text-cream/85">“{r.text}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-cream/10 pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet font-display text-sm font-bold text-cream">
                  {r.name[0]}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-cream/50">{r.presta}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
