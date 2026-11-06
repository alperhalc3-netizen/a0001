
import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import { SettingsProvider } from "@/components/editor/SettingsProvider";
import { BrushCursor } from "@/components/BrushCursor";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LightboxProvider } from "@/components/LightboxProvider";
import { site } from "@/lib/content";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "900"],
  variable: "--font-display",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline.replace(/\.$/, "")}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SettingsProvider>
          <LightboxProvider>
            <BrushCursor />
            <Header />
            <main id="main" className="site-main">
              {children}
            </main>
            <Footer />
          </LightboxProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
