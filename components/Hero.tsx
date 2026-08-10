import { ScissorsIcon, ArrowIcon } from "./icons";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Vidéo de fond plein écran */}
      <div className="relative min-h-screen w-full">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/media/videos/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/media/photos/coupe-3.jpg"
        />
        {/* Voiles pour lisibilité + teinte violette */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,58,237,0.35),transparent)]" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-5 pb-16 pt-32 text-cream">
          <div className="reveal flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">
            <ScissorsIcon className="h-4 w-4" />
            Barbershop · sur rendez-vous
          </div>

          <h1
            className="reveal mt-5 font-display text-[17vw] font-extrabold leading-[0.82] tracking-tight md:text-[10rem]"
            style={{ animationDelay: "0.08s" }}
          >
            FD7<span className="text-violet-bright">.</span>CUT
          </h1>

          <div
            className="reveal mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
            style={{ animationDelay: "0.18s" }}
          >
            <p className="max-w-md text-lg leading-relaxed text-cream/80">
              Coupe nette, barbe taillée au millimètre. Prends ton créneau en
              ligne, en 30 secondes.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#reservation"
                className="group inline-flex items-center gap-2 rounded-full bg-cream px-7 py-4 text-base font-semibold text-ink transition hover:bg-violet hover:text-cream"
              >
                Réserver un créneau
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#galerie"
                className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-7 py-4 text-base font-semibold text-cream transition hover:border-cream"
              >
                Voir les coupes
              </a>
            </div>
          </div>

          <div
            className="reveal mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-cream/15 pt-6"
            style={{ animationDelay: "0.28s" }}
          >
            {[
              ["40 min", "par créneau"],
              ["10h–20h", "du lundi au samedi"],
              ["+ tard", "after hour dès 20h"],
            ].map(([a, b]) => (
              <div key={a}>
                <div className="font-display text-2xl font-bold">{a}</div>
                <div className="mt-1 text-sm text-cream/60">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bande prestations — noire, prolonge la vidéo */}
      <div className="bg-ink text-cream">
        <div className="mx-auto max-w-6xl px-5">
          <ul className="grid grid-cols-2 divide-cream/10 sm:grid-cols-3 md:grid-cols-6 md:divide-x">
            {["Coupe", "Barbe", "Dégradé", "Contours", "Finitions", "Enfant"].map(
              (w, i) => (
                <li
                  key={w}
                  className="flex items-center gap-3 border-b border-cream/10 py-6 md:justify-center md:border-b-0"
                >
                  <span className="font-display text-xs font-bold text-violet-bright">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    {w}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
