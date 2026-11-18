import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { ServiceWorker } from "@/components/service-worker";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
/** police « serif » des logotypes de certaines marques fictives : remplacée par une sans-serif neutre */
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: "Démo : le dressing connecté et le styliste IA pour hommes.",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f5f5f4" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${oswald.variable} font-sans antialiased`}>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
