import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "../components/layout/AppShell";
import { AppInstallProvider } from "../components/layout/AppInstall";

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f0e7" }, { media: "(prefers-color-scheme: dark)", color: "#0f1c28" }] };

export const metadata: Metadata = {
  title: "VetSlate — Tools for the Veterinarian",
  description: "Fast, practical clinical tools for veterinarians.",
  applicationName: "VetSlate",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "VetSlate", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
  openGraph: {
    title: "VetSlate — Tools for the Veterinarian",
    description: "Fast, practical clinical tools for veterinarians.",
    images: [{ url: "/icons/vetslate-1024.png", width: 1024, height: 1024, alt: "VetSlate" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VetSlate — Tools for the Veterinarian",
    description: "Fast, practical clinical tools for veterinarians.",
    images: ["/icons/vetslate-1024.png"],
  },
  icons: { icon: "/icons/vetslate-192.png", shortcut: "/icons/vetslate-192.png", apple: [{ url: "/icons/vetslate-apple-touch-icon.png", sizes: "180x180" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppInstallProvider><AppShell>{children}</AppShell></AppInstallProvider></body></html>;
}
