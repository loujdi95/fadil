"use client";

import { useEffect } from "react";

/**
 * Anime l'apparition au scroll des éléments [data-reveal], y compris ceux
 * ajoutés plus tard (ex : « Voir plus »). Décalage en cascade entre frères.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    const seen = new WeakSet<Element>();
    const scan = () => {
      const counters = new Map<Element, number>();
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const parent = el.parentElement;
        const n = parent ? counters.get(parent) ?? 0 : 0;
        if (parent) counters.set(parent, n + 1);
        el.style.transitionDelay = `${Math.min(n * 80, 400)}ms`;
        io.observe(el);
      });
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
