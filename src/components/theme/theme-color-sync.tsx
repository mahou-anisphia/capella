"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import { THEME_BACKGROUND } from "~/lib/theme-colors";

const SELECTOR = 'meta[name="theme-color"]';

/**
 * The `theme-color` meta tags follow the OS scheme, which colours the phone's status bar.
 * Once the in-app theme is known, point every tag at it so the bar matches a manual choice.
 * Next.js re-renders the tags on client-side navigation (resetting them to the OS colours),
 * so keep watching <head> and re-apply whenever they come back.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    const color = THEME_BACKGROUND[resolvedTheme];

    const apply = () => {
      document.querySelectorAll<HTMLMetaElement>(SELECTOR).forEach((meta) => {
        // Only write on a mismatch, so our own writes don't retrigger the observer forever.
        if (meta.content !== color) meta.content = color;
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content"],
    });
    return () => observer.disconnect();
  }, [resolvedTheme]);

  return null;
}
