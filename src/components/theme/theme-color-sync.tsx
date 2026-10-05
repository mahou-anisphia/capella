"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import { THEME_BACKGROUND } from "~/lib/theme-colors";

/**
 * The `theme-color` meta tags follow the OS scheme, which colours the phone's status bar.
 * Once the in-app theme is known, point every tag at it so the bar matches a manual choice.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    const color = THEME_BACKGROUND[resolvedTheme];
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", color));
  }, [resolvedTheme]);

  return null;
}
