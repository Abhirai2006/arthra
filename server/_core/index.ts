import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { weeklyDigestHandler } from "../digest";
import { renderStaticSsrPage, serveStatic, setupVite } from "./vite";
import { applySecurityHeaders, createApiRateLimiter } from "./security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(applySecurityHeaders);
  app.use("/api", createApiRateLimiter());
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  // Receipts are independently capped at 7 MB; 12 MB permits their encoded upload
  // while rejecting oversized request payloads before application processing.
  app.use(express.json({ limit: "12mb", strict: true }));
  app.use(express.urlencoded({ limit: "12mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/weekly-digest", weeklyDigestHandler);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.get(["/architecture", "/architecture-map.html"], (_req, res) => {
    const candidates = process.env.NODE_ENV === "development"
      ? [path.resolve(import.meta.dirname, "../../client/public/architecture-map.html")]
      : [
          path.resolve(process.cwd(), "dist/public/architecture-map.html"),
          path.resolve(import.meta.dirname, "public/architecture-map.html"),
        ];
    const file = candidates.find(candidate => fs.existsSync(candidate));
    if (!file) return res.status(404).type("text").send("Architecture documentation is unavailable.");
    res.set({ "Cache-Control": "no-store", "X-Architecture-Map-Revision": "2026-08-23-final" }).sendFile(file, error => {
      if (error && !res.headersSent) res.status(404).type("text").send("Architecture documentation is unavailable.");
    });
  });
  if (process.env.NODE_ENV !== "development") {
    app.get("/", (req, res) => {
      res.set("X-Public-Release", "security-hardening-release-ea8c14ed");
      return renderStaticSsrPage(req, res);
    });
    app.get("/feedback", renderStaticSsrPage);
    app.get(["/about", "/contact", "/waitlist", "/thank-you"], renderStaticSsrPage);
    app.get("/transactions", (req, res) => {
      res.set("X-Transaction-Import-Revision", "2026-08-23-import");
      return renderStaticSsrPage(req, res);
    });
  }
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
