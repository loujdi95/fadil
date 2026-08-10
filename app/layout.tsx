import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans-app",
  subsets: ["latin"],
  display: "swap",
});

const display = Bricolage_Grotesque({
  variable: "--font-display-app",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fd7cut.com"),
  title: "FD7.CUT — Barber",
  description:
    "Prends ton rendez-vous chez FD7.CUT. Coupe, barbe, finitions. Réservation en ligne, créneaux de 40 min.",
  keywords: ["barber", "coiffeur", "fd7", "fd7.cut", "coupe", "barbe", "rendez-vous"],
  openGraph: {
    title: "FD7.CUT — Barber",
    description: "Réserve ta coupe en ligne. Coupe · Barbe · Finitions.",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${display.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}
