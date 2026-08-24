import { randomBytes } from "crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

const DEFAULT_RATE_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT = 240;
const analyticsOrigin = "https://manus-analytics.com";

type RateBucket = {
  count: number;
  resetAt: number;
};

function requestAddress(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0];
  return firstForwarded?.trim() || req.ip || "unknown";
}

function createCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${analyticsOrigin}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${analyticsOrigin}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  const nonce = randomBytes(18).toString("base64url");
  res.locals.cspNonce = nonce;
  res.set({
    "Content-Security-Policy": createCsp(nonce),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "X-Permitted-Cross-Domain-Policies": "none",
  });
  next();
}

export function createApiRateLimiter(options?: {
  windowMs?: number;
  maxRequests?: number;
}): RequestHandler {
  const windowMs = options?.windowMs ?? DEFAULT_RATE_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? DEFAULT_RATE_LIMIT;
  const buckets = new Map<string, RateBucket>();

  return (req, res, next) => {
    const now = Date.now();
    const key = requestAddress(req);
    const existing = buckets.get(key);
    const bucket = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      res.status(429).json({ error: "Too many requests. Please try again shortly." });
      return;
    }

    next();
  };
}

export function getCspNonce(res: Response) {
  const nonce = res.locals.cspNonce;
  return typeof nonce === "string" && /^[A-Za-z0-9_-]{20,}$/.test(nonce) ? nonce : "";
}
