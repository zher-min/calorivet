import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "../components/layout/AppShell";
import { AppInstallProvider } from "../components/layout/AppInstall";

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#174d42" };

export const metadata: Metadata = {
  title: "VetCalc — Veterinary Clinical Calculators",
  description: "Fast, practical calculators for veterinary clinical practice.",
  applicationName: "VetCalc",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "VetCalc", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
  openGraph: {
    title: "VetCalc — Veterinary Clinical Calculators",
    description: "Fast, practical calculators for veterinary clinical practice.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "CaloriVet veterinary nutrition calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VetCalc — Veterinary Clinical Calculators",
    description: "Fast, practical calculators for veterinary clinical practice.",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppInstallProvider><AppShell>{children}</AppShell></AppInstallProvider></body></html>;
}
