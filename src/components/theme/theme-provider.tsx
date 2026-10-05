"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Follows the system on first visit, then remembers the manual choice (localStorage). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
