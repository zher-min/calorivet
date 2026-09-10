import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/layout/AppShell";

export const metadata: Metadata = {
  title: "VetCalc — Veterinary Clinical Calculators",
  description: "Fast, practical calculators for veterinary clinical practice.",
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
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
