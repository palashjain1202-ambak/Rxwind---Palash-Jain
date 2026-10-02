import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/mukta/400.css";
import "@fontsource/mukta/600.css";
import "@fontsource/mukta/700.css";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: "Rxwind — Remember what worked",
  description:
    "Snap every prescription. Rxwind turns your parchis into a health memory: dose plans, what worked, what didn't, and what's coming back this season.",
  applicationName: "Rxwind",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    title: "Rxwind — Remember what worked",
    description: "Your health has a history. Rewind it.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ecf6ee",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="grain min-h-dvh antialiased">{children}</body>
    </html>
  );
}
