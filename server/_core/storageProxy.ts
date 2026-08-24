import type { Express } from "express";
import { ENV } from "./env";

export function isValidPublicStorageKey(key: string) {
  if (key.length === 0 || key.length > 512) return false;
  if (key.startsWith("/") || key.includes("\\") || key.includes("//")) return false;
  if (!/^[A-Za-z0-9._/-]+$/.test(key)) return false;
  return !key.split("/").some(part => part.length === 0 || part === "." || part === "..");
}

export function isSafeSignedRedirect(url: string) {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key || !isValidPublicStorageKey(key)) {
      res.status(400).send("Invalid storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url || !isSafeSignedRedirect(url)) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
