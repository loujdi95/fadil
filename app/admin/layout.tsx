import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "FD7 Admin",
  manifest: "/admin.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "FD7 Admin",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f1ea",
  viewportFit: "cover",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
