import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "../components/layout/AppShell";
import { AppInstallProvider } from "../components/layout/AppInstall";

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#174d42" };

export const metadata: Metadata = {
  title: "VetTools — Veterinary Clinical Calculators",
  description: "Fast, practical calculators for veterinary clinical practice.",
  applicationName: "VetTools",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "VetTools", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
  openGraph: {
    title: "VetTools — Veterinary Clinical Calculators",
    description: "Fast, practical calculators for veterinary clinical practice.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "CaloriVet veterinary nutrition calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VetTools — Veterinary Clinical Calculators",
    description: "Fast, practical calculators for veterinary clinical practice.",
    images: ["/og.png"],
  },
  icons: { icon: "/icons/vettools-192.png", shortcut: "/icons/vettools-192.png", apple: [{ url: "/icons/vettools-apple-touch-icon.png", sizes: "180x180" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppInstallProvider><AppShell>{children}</AppShell></AppInstallProvider></body></html>;
}
