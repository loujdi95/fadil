"use client";

import { useEffect, useState } from "react";
import { ArrowIcon } from "./icons";

/** Bouton « Réserver » fixe en bas de l'écran sur téléphone. */
export default function MobileCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const resa = document.getElementById("reservation");
    let inResa = false;
    const io = resa
      ? new IntersectionObserver(([e]) => {
          inResa = e.isIntersecting;
          update();
        }, { threshold: 0.05 })
      : null;
    if (resa && io) io.observe(resa);

    function update() {
      setShow(window.scrollY > window.innerHeight * 0.7 && !inResa);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      io?.disconnect();
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-300 md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <a
        href="#reservation"
        className="flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-base font-semibold text-cream shadow-[0_10px_40px_-10px_rgba(124,58,237,0.6)]"
      >
        Réserver un créneau
        <ArrowIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
