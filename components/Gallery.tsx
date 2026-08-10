"use client";

import { useEffect, useRef, useState } from "react";
import { getGallery, type GalleryItem } from "@/lib/store";
import { getInstagramPosts } from "@/lib/instagram";
import { MEDIA, type Media } from "@/lib/media";
import { SITE } from "@/lib/site";
import { InstagramIcon } from "./icons";

export default function Gallery() {
  // Priorité : médias locaux fournis → flux Instagram → photos admin
  const [extra, setExtra] = useState<GalleryItem[]>([]);

  useEffect(() => {
    if (MEDIA.length) return; // on a déjà les médias locaux
    (async () => {
      const insta = await getInstagramPosts(9).catch(() => []);
      if (insta.length) return setExtra(insta);
      const uploaded = await getGallery().catch(() => []);
      setExtra(uploaded);
    })();
  }, []);

  const localItems: Media[] = MEDIA;

  return (
    <section id="galerie" className="mx-auto max-w-6xl px-5 py-24">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet">
            Le book
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Dernières coupes
          </h2>
        </div>
        <a
          href={SITE.socials.instagram.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 transition hover:text-violet"
        >
          <InstagramIcon className="h-5 w-5" />
          @{SITE.socials.instagram.handle}
        </a>
      </div>

      <div className="mt-12 columns-2 gap-4 md:columns-3 [&>*]:mb-4">
        {localItems.map((m, i) =>
          m.type === "video" ? (
            <VideoCard key={i} src={m.src} />
          ) : (
            <PhotoCard key={i} src={m.src} caption={m.caption} />
          ),
        )}

        {/* fallback si un jour MEDIA est vide */}
        {!localItems.length &&
          extra.map((it) => <PhotoCard key={it.id} src={it.url} caption={it.caption} />)}
      </div>
    </section>
  );
}

function PhotoCard({ src, caption }: { src: string; caption?: string }) {
  return (
    <figure data-reveal className="group relative block break-inside-avoid overflow-hidden rounded-2xl border border-line bg-ink/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={caption || "Coupe FD7.CUT"}
        loading="lazy"
        className="w-full object-cover transition duration-700 group-hover:scale-105"
      />
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-sm font-medium text-white">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function VideoCard({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  // lecture auto quand la vidéo entre à l'écran (mobile & desktop)
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div data-reveal className="group relative block break-inside-avoid overflow-hidden rounded-2xl border border-line bg-ink">
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full object-cover"
      />
      <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Reel
      </span>
    </div>
  );
}
