import { SITE } from "@/lib/site";
import { InstagramIcon, TikTokIcon, SnapchatIcon, ArrowIcon } from "./icons";

const links = [
  {
    name: "Instagram",
    handle: SITE.socials.instagram.handle,
    url: SITE.socials.instagram.url,
    Icon: InstagramIcon,
    hover: "group-hover:bg-gradient-to-br group-hover:from-[#f58529] group-hover:via-[#dd2a7b] group-hover:to-[#8134af]",
  },
  {
    name: "TikTok",
    handle: SITE.socials.tiktok.handle,
    url: SITE.socials.tiktok.url,
    Icon: TikTokIcon,
    hover: "group-hover:bg-gradient-to-br group-hover:from-[#25F4EE] group-hover:to-[#FE2C55]",
  },
  {
    name: "Snapchat",
    handle: SITE.socials.snapchat.handle,
    url: SITE.socials.snapchat.url,
    Icon: SnapchatIcon,
    hover: "group-hover:bg-[#FFFC00] group-hover:text-ink",
  },
];

export default function Socials() {
  return (
    <section id="reseaux" className="border-y border-line bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-bright">
              Suis le travail
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              On se suit ?
            </h2>
            <p className="mt-5 max-w-sm text-cream/60">
              Retrouve FD7.CUT sur tes réseaux.
            </p>
            <a
              href={SITE.socials.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-semibold text-ink transition hover:bg-violet hover:text-cream"
            >
              Voir l’Instagram
              <ArrowIcon className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {links.map(({ name, handle, url, Icon, hover }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                data-reveal
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-cream/15 bg-cream/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-cream/40"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-soft text-cream transition-all duration-300 ${hover}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <ArrowIcon className="h-5 w-5 text-cream/30 transition group-hover:-rotate-45 group-hover:text-cream" />
                </div>

                <div className="mt-10">
                  <div className="text-xs font-medium uppercase tracking-wider text-cream/40">
                    {name}
                  </div>
                  <div className="font-display text-xl font-bold">@{handle}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
