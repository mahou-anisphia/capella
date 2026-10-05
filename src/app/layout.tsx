import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Nunito, Quicksand } from "next/font/google";

import { SiteHeader } from "~/components/layout/site-header";
import { RegisterServiceWorker } from "~/components/pwa/register-service-worker";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

// Every page depends on "today" and live data, so never prerender at build time.
export const dynamic = "force-dynamic";

// Icons come from the file conventions in this folder: favicon.ico, icon.svg, apple-icon.png.
export const metadata: Metadata = {
  title: { default: "Capella", template: "%s · Capella" },
  description: "A quiet habit check-in.",
  applicationName: "Capella",
  appleWebApp: { capable: true, title: "Capella", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF3F8" },
    { media: "(prefers-color-scheme: dark)", color: "#1C2340" },
  ],
};

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // next-themes sets data-theme before hydration.
    <html
      lang="en"
      className={`${nunito.variable} ${quicksand.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <ThemeProvider>
          <TRPCReactProvider>
            <SiteHeader />
            <main className="mx-auto w-full max-w-2xl px-4 pb-16">
              {children}
            </main>
          </TRPCReactProvider>
          <Toaster position="bottom-center" />
        </ThemeProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
