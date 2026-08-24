import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { healthCheckConfigs } from "../drizzle/schema";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";

type CheckResult = { label: string; ok: boolean; detail: string };

const healthChecks = [
  { label: "public home", path: "/", expectedStatus: 200, contains: "Sign in" },
  { label: "sitemap", path: "/sitemap.xml", expectedStatus: 200, contains: "<urlset" },
  { label: "unknown route", path: "/does-not-exist", expectedStatus: 404, contains: "Page not found" },
] as const;

export function normalizeHealthBaseUrl(value: string) {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:") throw new Error("Health-check target must use HTTPS.");
  return parsed.toString().replace(/\/$/, "");
}

export async function runHealthCheck(targetBaseUrl: string): Promise<CheckResult[]> {
  const baseUrl = normalizeHealthBaseUrl(targetBaseUrl);
  return Promise.all(healthChecks.map(async check => {
    try {
      const response = await fetch(`${baseUrl}${check.path}`, {
        headers: { accept: "text/html,application/xml;q=0.9,*/*;q=0.1" },
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.text();
      const statusOk = response.status === check.expectedStatus;
      const contentOk = body.includes(check.contains);
      return {
        label: check.label,
        ok: statusOk && contentOk,
        detail: `${response.status}${contentOk ? "" : `; expected content missing: ${check.contains}`}`,
      };
    } catch (error) {
      return { label: check.label, ok: false, detail: error instanceof Error ? error.message.slice(0, 240) : "network failure" };
    }
  }));
}

export function summarizeHealthChecks(results: CheckResult[]) {
  const failures = results.filter(result => !result.ok);
  return failures.length ? failures.map(result => `${result.label}: ${result.detail}`).join(" | ").slice(0, 500) : "All public health checks passed.";
}

export async function dailyHealthCheckHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const config = (await db.select().from(healthCheckConfigs).where(eq(healthCheckConfigs.taskUid, user.taskUid)).limit(1))[0];
    if (!config || !config.enabled) return res.json({ ok: true, skipped: "orphan-or-disabled" });

    const results = await runHealthCheck(config.targetBaseUrl);
    const passed = results.every(result => result.ok);
    const status = passed ? "passed" : "failed";
    const summary = summarizeHealthChecks(results);
    const alertFailure = !passed && (config.lastStatus !== "failed" || config.lastSummary !== summary);
    await db.update(healthCheckConfigs).set({
      lastStatus: status,
      lastSummary: summary,
      lastRunAt: new Date(),
      lastFailureAlertAt: alertFailure ? new Date() : config.lastFailureAlertAt,
    }).where(eq(healthCheckConfigs.id, config.id));

    if (alertFailure) {
      await notifyOwner({
        title: "Arthra daily health check needs attention",
        content: `A public route check failed: ${summary}. Review the launch runbook and the production domain. No user or finance data is included in this alert.`,
      });
    }
    return res.json({ ok: true, health: status, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown daily health-check error";
    return res.status(500).json({ error: message, timestamp: new Date().toISOString() });
  }
}
