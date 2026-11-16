"use client";

import { useEffect } from "react";

/** Enregistre le service worker (mode hors ligne) en production. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/** Précharge toutes les pages, images et la vidéo dans le cache hors ligne. */
export async function warmOfflineCache(onProgress?: (done: number, total: number) => void) {
  const res = await fetch("/offline-manifest.json");
  const urls: string[] = await res.json();
  let done = 0;
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (queue.length) {
        const u = queue.shift()!;
        await fetch(u).catch(() => {});
        onProgress?.(++done, urls.length);
      }
    }),
  );
  return urls.length;
}
