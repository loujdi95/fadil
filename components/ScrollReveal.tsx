"use client";

import { useEffect } from "react";

/**
 * Anime l'apparition au scroll de tous les éléments [data-reveal].
 * Décalage automatique (stagger) pour les éléments frères d'un même parent.
 * À monter une seule fois dans la page.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    // délai en cascade entre frères directs
    const seen = new Map<Element, number>();
    els.forEach((el) => {
      const parent = el.parentElement;
      if (!parent) return;
      const n = seen.get(parent) ?? 0;
      el.style.transitionDelay = `${Math.min(n * 90, 450)}ms`;
      seen.set(parent, n + 1);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
