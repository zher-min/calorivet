import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaloriVet — Body-Weight Calorie Calculator",
  description: "Estimate daily calories, feeding amounts, caloric distribution, and lactation needs for dogs and cats.",
  openGraph: {
    title: "CaloriVet — Body-Weight Calorie Calculator",
    description: "A clear veterinary nutrition calculator for food energy, daily feeding, and lactation needs.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "CaloriVet veterinary nutrition calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CaloriVet — Body-Weight Calorie Calculator",
    description: "Food energy, daily feeding, and lactation needs in one clear calculator.",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
