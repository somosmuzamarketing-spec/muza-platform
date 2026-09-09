import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";
import ServiceWorkerRegister from "./sw-register";

export const metadata: Metadata = {
  title: "Muza",
  description: "Plataforma privada de la comunidad Muza",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Muza",
  },
};

export const viewport: Viewport = {
  themeColor: "#4A1C39",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
