// Minimal service worker: makes the site installable and shows a small offline note for page
// loads. Postgres is the source of truth, so nothing is cached and there is no offline queue.

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Capella</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;font-family:system-ui,sans-serif;
background:#FFF3F8;color:#3A2F4A;text-align:center;padding:16px}
@media (prefers-color-scheme:dark){body{background:#1C2340;color:#FDEFF5}}</style></head>
<body><div><h1 style="font-size:1.25rem">You're offline</h1>
<p>Check-ins will be here when the connection is back.</p></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
    ),
  );
});
