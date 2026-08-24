import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import superjson from "superjson";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { buildSsrPrefetch } from "./ssrCaller";

type HeadMeta = { title: string; description: string; canonicalPath?: string; noindex?: boolean; notFound?: boolean };
const canonicalOrigin = (process.env.CANONICAL_ORIGIN ?? "https://arthrafin-7qakibfj.manus.space").replace(/\/$/, "");
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const buildHead = (head: HeadMeta) => {
  const title = escapeHtml(head.title); const description = escapeHtml(head.description); const canonical = head.canonicalPath ? `${canonicalOrigin}${head.canonicalPath}` : "";
  return [`<title>${title}</title>`, `<meta name="description" content="${description}" />`, `<meta property="og:type" content="website" />`, `<meta property="og:title" content="${title}" />`, `<meta property="og:description" content="${description}" />`, `<meta property="og:site_name" content="Arthra" />`, `<meta name="twitter:card" content="summary" />`, `<meta name="twitter:title" content="${title}" />`, `<meta name="twitter:description" content="${description}" />`, canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" /><meta property="og:url" content="${escapeHtml(canonical)}" />` : "", head.noindex || head.notFound ? `<meta name="robots" content="noindex, follow" />` : ""].filter(Boolean).join("\n");
};
const composeHtml = (template: string, appHtml: string, head: HeadMeta, state: unknown) => {
  const serialized = JSON.stringify(superjson.serialize(state)).replace(/</g, "\\u003c");
  return template.replace("</body>", () => `<script>window.__RQ_STATE__=${serialized}</script></body>`).replace("<!--app-head-->", () => buildHead(head)).replace("<!--app-html-->", () => appHtml);
};

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({ ...viteConfig, configFile: false, server: { middlewareMode: true, hmr: { server }, allowedHosts: true }, appType: "custom" });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      let template = await fs.promises.readFile(path.resolve(import.meta.dirname, "../..", "client", "index.html"), "utf-8");
      template = template.replace(`src="/src/entry-client.tsx"`, `src="/src/entry-client.tsx?v=${nanoid()}"`);
      template = await vite.transformIndexHtml(req.originalUrl, template);
      template = template.replace("</head>", `<link rel="stylesheet" href="/src/index.css?direct" data-ssr-dev-css></head>`);
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
      const { html, dehydratedState, head } = await render(req.originalUrl, await buildSsrPrefetch(req, res));
      res.status(head.notFound ? 404 : 200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, html, head, dehydratedState));
    } catch (error) { vite.ssrFixStacktrace(error as Error); next(error); }
  });
}

export async function renderStaticSsrPage(req: express.Request, res: express.Response) {
  const distPath = process.env.NODE_ENV === "development" ? path.resolve(import.meta.dirname, "../..", "dist", "public") : path.resolve(import.meta.dirname, "public");
  const templatePath = path.resolve(distPath, "index.html");
  try {
    const template = await fs.promises.readFile(templatePath, "utf-8"); const entry = path.resolve(import.meta.dirname, "server-ssr", "entry-server.js");
    const { render } = await import(entry); const { html, dehydratedState, head } = await render(req.originalUrl, await buildSsrPrefetch(req, res));
    res.status(head.notFound ? 404 : 200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, html, head, dehydratedState));
  } catch (error) {
    console.error("[SSR] render failed, serving client shell", error);
    const template = await fs.promises.readFile(templatePath, "utf-8"); const head = { title: "Arthra — Money with context", description: "A private Indian personal-finance workspace." };
    res.status(200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, "", head, {}));
  }
}

export function serveStatic(app: Express) {
  const distPath = process.env.NODE_ENV === "development" ? path.resolve(import.meta.dirname, "../..", "dist", "public") : path.resolve(import.meta.dirname, "public");
  app.use((req, res, next) => { if (req.path === "/index.html") return res.redirect(301, "/"); if (req.path !== "/" && /\/+$/ .test(req.path)) return res.redirect(301, req.path.replace(/\/+$/, "") + req.originalUrl.slice(req.path.length)); next(); });
  app.use(express.static(distPath, { index: false, redirect: false }));
  app.use("*", renderStaticSsrPage);
}
