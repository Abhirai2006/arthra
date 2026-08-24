import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { applySecurityHeaders, createApiRateLimiter, getCspNonce } from "./_core/security";
import { isSafeSignedRedirect, isValidPublicStorageKey } from "./_core/storageProxy";

function createResponse() {
  const headers = new Map<string, string>();
  const response = {
    locals: {} as Record<string, unknown>,
    set: (field: string | Record<string, string>, value?: string) => {
      if (typeof field === "string") {
        headers.set(field, value ?? "");
      } else {
        Object.entries(field).forEach(([name, headerValue]) => headers.set(name, headerValue));
      }
      return response;
    },
    status: vi.fn(() => response),
    json: vi.fn(() => response),
  };

  return { response: response as unknown as Response, headers, raw: response };
}

function createRequest(address = "203.0.113.7") {
  return {
    headers: { "x-forwarded-for": address },
    ip: address,
  } as unknown as Request;
}

describe("security perimeter", () => {
  it("sets CSP and browser security headers with a request-scoped nonce", () => {
    const { response, headers } = createResponse();
    const next = vi.fn();

    applySecurityHeaders(createRequest(), response, next);

    const nonce = getCspNonce(response);
    expect(nonce).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(headers.get("Content-Security-Policy")).toContain(`'nonce-${nonce}'`);
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 429 after the configured API request budget is exhausted", () => {
    const { response, raw } = createResponse();
    const limiter = createApiRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const next = vi.fn();
    const request = createRequest();

    limiter(request, response, next);
    limiter(request, response, next);
    limiter(request, response, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(raw.status).toHaveBeenCalledWith(429);
    expect(raw.json).toHaveBeenCalledWith({ error: "Too many requests. Please try again shortly." });
  });

  it("accepts only safe public storage keys and HTTPS signed redirects", () => {
    expect(isValidPublicStorageKey("screenshots/arthra-poster.png")).toBe(true);
    expect(isValidPublicStorageKey("../secrets.txt")).toBe(false);
    expect(isValidPublicStorageKey("/absolute/key")).toBe(false);
    expect(isValidPublicStorageKey("folder//empty-segment")).toBe(false);
    expect(isSafeSignedRedirect("https://storage.example.test/file.png")).toBe(true);
    expect(isSafeSignedRedirect("http://storage.example.test/file.png")).toBe(false);
    expect(isSafeSignedRedirect("javascript:alert(1)")).toBe(false);
  });
});
