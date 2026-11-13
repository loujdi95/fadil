"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MEDIA, type Media } from "@/lib/media";
import { SITE } from "@/lib/site";
import { InstagramIcon } from "./icons";
import { CloseIcon, ChevronIcon } from "./ui-icons";

const INITIAL = 6;

export default function Gallery() {
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const items = showAll ? MEDIA : MEDIA.slice(0, INITIAL);

  return (
    <section id="galerie" className="mx-auto max-w-6xl px-5 py-24">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet">Le book</p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Dernières coupes</h2>
        </div>
        <a
          href={SITE.socials.instagram.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 transition hover:text-violet"
        >
          <InstagramIcon className="h-5 w-5" />@{SITE.socials.instagram.handle}
        </a>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {items.map((m, i) => (
          <Tile key={m.src} m={m} index={i} onOpen={() => setOpen(i)} />
        ))}
      </div>

      {MEDIA.length > INITIAL && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="rounded-full border border-ink/20 px-7 py-3.5 text-sm font-semibold transition hover:border-ink"
          >
            {showAll ? "Voir moins" : `Voir plus de coupes (${MEDIA.length - INITIAL})`}
          </button>
        </div>
      )}

      {open !== null &&
        createPortal(
          <Lightbox index={open} onClose={() => setOpen(null)} onIndex={setOpen} />,
          document.body,
        )}
    </section>
  );
}

function Tile({ m, index, onOpen }: { m: Media; index: number; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()),
      { threshold: 0.5 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <button
      data-reveal
      onClick={onOpen}
      aria-label={`Ouvrir la coupe ${index + 1}`}
      className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet/40"
    >
      {m.type === "video" ? (
        <video
          ref={ref}
          src={`${m.src}#t=0.1`}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.src}
          alt={m.caption || "Coupe FD7.CUT"}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      {m.type === "video" && (
        <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-bright" /> Reel
        </span>
      )}
      <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 scale-75 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" />
        </svg>
      </span>
    </button>
  );
}

function Lightbox({
  index,
  onClose,
  onIndex,
}: {
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const m = MEDIA[index];
  const touch = useRef<number | null>(null);

  const go = useCallback(
    (d: number) => onIndex((index + d + MEDIA.length) % MEDIA.length),
    [index, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="relative max-h-[86vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        {m.type === "video" ? (
          <video
            key={m.src}
            src={m.src}
            autoPlay
            loop
            playsInline
            controls
            className="max-h-[86vh] max-w-[92vw] rounded-2xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={m.src} src={m.src} alt="Coupe FD7.CUT" className="max-h-[86vh] max-w-[92vw] rounded-2xl object-contain" />
        )}
      </div>

      <button onClick={onClose} aria-label="Fermer" className="lb-btn right-4 top-4">
        <CloseIcon className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); go(-1); }}
        aria-label="Précédent"
        className="lb-btn left-3 top-1/2 hidden -translate-y-1/2 sm:flex"
      >
        <ChevronIcon dir="left" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); go(1); }}
        aria-label="Suivant"
        className="lb-btn right-3 top-1/2 hidden -translate-y-1/2 sm:flex"
      >
        <ChevronIcon />
      </button>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
        {index + 1} / {MEDIA.length}
      </div>
    </div>
  );
}
