"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-md bg-cream/80 border-b border-line"
          : "bg-transparent"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between px-5 py-4 transition-colors duration-500 ${
          scrolled ? "text-ink" : "text-cream"
        }`}
      >
        <a href="#top" className="font-display text-lg font-extrabold tracking-tight">
          {SITE.name}
          <span className={scrolled ? "text-violet" : "text-violet-bright"}>.</span>
        </a>

        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#galerie" className="opacity-80 transition hover:opacity-100">Galerie</a>
          <a href="#horaires" className="opacity-80 transition hover:opacity-100">Horaires</a>
          <a href="#reseaux" className="opacity-80 transition hover:opacity-100">Réseaux</a>
        </div>

        <a
          href="#reservation"
          className={`group relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-transform active:scale-95 ${
            scrolled ? "bg-ink text-cream" : "bg-cream text-ink"
          }`}
        >
          <span className="relative z-10 transition-colors group-hover:text-cream">Réserver</span>
          <span className="absolute inset-0 -translate-x-full bg-violet transition-transform duration-300 group-hover:translate-x-0" />
        </a>
      </nav>
    </header>
  );
}
