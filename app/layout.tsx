import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VND to MYR Converter | Duit Exchange",
  description: "Quickly convert Vietnamese dong and Malaysian ringgit with an adjustable indicative rate.",
  openGraph: {
    title: "VND to MYR Converter | Duit Exchange",
    description: "Fast, clear conversion between Vietnamese dong and Malaysian ringgit.",
    images: [{ url: "/og-vnd-myr.png", width: 1536, height: 1024, alt: "Duit Exchange VND to MYR converter" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-vnd-myr.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
