import type { QueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { trpc } from "@/lib/trpc";

export type HeadMeta = { title: string; description: string; canonicalPath?: string; noindex?: boolean; notFound?: boolean };
export type SsrPrefetch = {
  authMe: () => Promise<unknown>;
  previewInvite: (token: string) => Promise<unknown>;
  publicCaReport: (token: string) => Promise<unknown>;
};

const SITE = "Arthra — Money with context";
const DESCRIPTION = "A private Indian personal-finance workspace for contextual money records, shared Expense Spaces, and CA-ready reporting.";
const protectedPaths = new Set(["/dashboard", "/transactions", "/budgets", "/spaces", "/analytics", "/reports"]);
const seed = (client: QueryClient, key: unknown, data: unknown) => client.setQueryData(key as any, data as any);

export async function prefetchForPath(url: string, client: QueryClient, prefetch: SsrPrefetch): Promise<HeadMeta> {
  const rawPath = url.split("?")[0] || "/";
  const path = rawPath.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/privacy" || path === "/terms") {
    const auth = await prefetch.authMe();
    seed(client, getQueryKey(trpc.auth.me, undefined, "query"), auth);
    const title = path === "/" ? SITE : `${path === "/privacy" ? "Privacy policy" : "Terms of use"} · Arthra`;
    return { title, description: DESCRIPTION, canonicalPath: path };
  }
  const invite = path.match(/^\/join\/([^/]+)$/);
  if (invite) {
    const [auth, data] = await Promise.all([prefetch.authMe(), prefetch.previewInvite(invite[1])]);
    seed(client, getQueryKey(trpc.auth.me, undefined, "query"), auth);
    seed(client, getQueryKey(trpc.finance.spaces.previewInvite, { token: invite[1] }, "query"), data);
    return { title: "Join an Expense Space · Arthra", description: "Review an Arthra Expense Space invitation.", canonicalPath: path, noindex: true };
  }
  const report = path.match(/^\/ca\/([^/]+)$/);
  if (report) {
    const data = await prefetch.publicCaReport(report[1]);
    seed(client, getQueryKey(trpc.finance.reports.publicCaReport, { token: report[1] }, "query"), data);
    return data ? { title: "CA-ready transaction ledger · Arthra", description: "Read-only CA report supplied by an Arthra account owner.", canonicalPath: path, noindex: true } : { title: "Report unavailable · Arthra", description: "This Arthra report link is unavailable.", noindex: true, notFound: true };
  }
  if (protectedPaths.has(path)) return { title: `${path.slice(1).replace(/(^|-)\w/g, match => match.toUpperCase())} · Arthra`, description: DESCRIPTION, noindex: true };
  return { title: `Page not found · Arthra`, description: DESCRIPTION, noindex: true, notFound: true };
}
