import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat, Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", axes: ["opsz"] });
const marker = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: { default: "System Sketch Lab: learn system design by breaking it", template: "%s · System Sketch Lab" },
  description:
    "Interactive system design lessons: read a clear explanation, then build the architecture on a live canvas, run real traffic and failures, and earn stars. Playable case studies like How Uber works.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

// Runs before first paint so a dark-mode visitor never sees a light flash. Saved choice wins, otherwise the system setting.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("sf:theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${display.variable} ${marker.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
