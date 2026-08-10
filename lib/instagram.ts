"use client";

import type { GalleryItem } from "./store";

/* ===========================================================
   Flux Instagram via Behold.so (gratuit, officiel Instagram API)
   -----------------------------------------------------------
   Mise en place (une seule fois) :
   1. Va sur https://behold.so → crée un compte
   2. Connecte le compte Instagram @fd7.cut
   3. Crée un "feed", copie son ID
   4. Mets-le dans .env.local :  NEXT_PUBLIC_BEHOLD_FEED=xxxxxxxx
   Dès qu'il poste sur Insta, ça apparaît sur le site automatiquement.
   =========================================================== */

const FEED_ID = process.env.NEXT_PUBLIC_BEHOLD_FEED;

export const hasInstagramFeed = Boolean(FEED_ID);

type BeholdPost = {
  id: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink?: string;
  caption?: string;
  prompt?: string;
};

/** Récupère les dernières publications Instagram. [] si non configuré ou erreur. */
export async function getInstagramPosts(limit = 9): Promise<GalleryItem[]> {
  if (!FEED_ID) return [];
  try {
    const res = await fetch(`https://feeds.behold.so/${FEED_ID}`, {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    const posts: BeholdPost[] = Array.isArray(data)
      ? (data as BeholdPost[])
      : ((data as { posts?: BeholdPost[] }).posts ?? []);

    return posts
      .filter((p) => p.mediaUrl || p.thumbnailUrl)
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        url: (p.mediaType === "VIDEO" ? p.thumbnailUrl : p.mediaUrl) || p.mediaUrl || "",
        caption: p.caption || p.prompt || "",
        permalink: p.permalink,
      }));
  } catch {
    return [];
  }
}
