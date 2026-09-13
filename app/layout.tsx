import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "../components/layout/AppShell";
import { AppInstallProvider } from "../components/layout/AppInstall";

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f0e7" }, { media: "(prefers-color-scheme: dark)", color: "#0f1c28" }] };

export const metadata: Metadata = {
  metadataBase: new URL("https://vetslate.com"),
  title: "VetSlate — Clinical support, made simple",
  description: "Clinical support, made simple.",
  applicationName: "VetSlate",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "VetSlate", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
  openGraph: {
    title: "VetSlate — Clinical support, made simple",
    description: "Clinical support, made simple.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "VetSlate — Clinical support, made simple" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VetSlate — Clinical support, made simple",
    description: "Clinical support, made simple.",
    images: ["/og.png"],
  },
  icons: { icon: "/icons/vetslate-192.png", shortcut: "/icons/vetslate-192.png", apple: [{ url: "/icons/vetslate-apple-touch-icon.png", sizes: "180x180" }] },
};

const themeBootstrap = `(() => { try { const saved = localStorage.getItem("vetslate:theme"); const manual = saved === "light" || saved === "dark"; const theme = manual ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); document.documentElement.dataset.theme = theme; document.documentElement.dataset.themePreference = manual ? saved : "auto"; document.documentElement.style.colorScheme = theme; } catch { document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; document.documentElement.dataset.themePreference = "auto"; } })();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head><body><AppInstallProvider><AppShell>{children}</AppShell></AppInstallProvider></body></html>;
}
