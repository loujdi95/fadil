import { SITE } from "@/lib/site";
import { InstagramIcon, TikTokIcon, SnapchatIcon } from "./icons";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 md:flex-row md:items-end md:justify-between">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-light.png" alt={SITE.name} className="h-10 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-cream/60">
            Barbershop sur rendez-vous. Coupe · Barbe · Finitions.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a href={SITE.socials.instagram.url} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition hover:border-violet hover:text-violet">
            <InstagramIcon className="h-5 w-5" />
          </a>
          <a href={SITE.socials.tiktok.url} target="_blank" rel="noreferrer" aria-label="TikTok" className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition hover:border-violet hover:text-violet">
            <TikTokIcon className="h-5 w-5" />
          </a>
          <a href={SITE.socials.snapchat.url} target="_blank" rel="noreferrer" aria-label="Snapchat" className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition hover:border-violet hover:text-violet">
            <SnapchatIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {SITE.name}. Tous droits réservés.</span>
          <a href="/admin" className="transition hover:text-cream/80">Espace admin</a>
        </div>
      </div>
    </footer>
  );
}
