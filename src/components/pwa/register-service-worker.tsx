"use client";

import { useEffect } from "react";

/** Registers /sw.js in production so the app can be installed as a PWA. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is a nice-to-have; the site works without it.
    });
  }, []);

  return null;
}
