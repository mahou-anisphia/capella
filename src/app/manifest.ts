import { type MetadataRoute } from "next";

import { THEME_BACKGROUND } from "~/lib/theme-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Capella",
    short_name: "Capella",
    description: "A quiet habit check-in.",
    start_url: "/",
    display: "standalone",
    background_color: THEME_BACKGROUND.light,
    theme_color: THEME_BACKGROUND.light,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
