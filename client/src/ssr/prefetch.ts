import type { QueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { trpc } from "@/lib/trpc";

export type HeadMeta = { title: string; description: string; canonicalPath?: string; noindex?: boolean; notFound?: boolean };
export type SsrPrefetch = {
  authMe: () => Promise<unknown>;
  previewInvite: (token: string) => Promise<unknown>;
  publicCaReport: (token: string) => Promise<unknown>;
};

const SITE = "Arthra — Personal Finance, Built for India";
const DESCRIPTION = "Track expenses, manage budgets, understand your spending, and generate secure financial reports with Arthra.";
const protectedPaths = new Set(["/dashboard", "/transactions", "/budgets", "/spaces", "/analytics", "/reports", "/operations"]);
const seed = (client: QueryClient, key: unknown, data: unknown) => client.setQueryData(key as any, data as any);

export async function prefetchForPath(url: string, client: QueryClient, prefetch: SsrPrefetch): Promise<HeadMeta> {
  const rawPath = url.split("?")[0] || "/";
  const path = rawPath.replace(/\/+$/, "") || "/";
  if (path === "/demo") {
    return { title: "Arthra demo · Personal finance, built for India", description: "Explore Arthra’s safe, labelled fictional demo workspace with transactions, budgets, analytics, shared spaces, and reports.", canonicalPath: path, noindex: true };
  }
  if (path === "/feedback") {
    return { title: "Share feedback · Arthra", description: "Share private product feedback about Arthra or explore the developer's GitHub portfolio.", canonicalPath: path, noindex: true };
  }
  const publicPages: Record<string, HeadMeta> = {
    "/about": { title: "About Arthra · Personal finance, built for India", description: "Learn why Arthra is built around Indian personal-finance context, private records, and deliberate sharing.", canonicalPath: "/about" },
    "/contact": { title: "Contact Arthra · Private product conversation", description: "Send a private product, accessibility, research, or partnership message to Arthra.", canonicalPath: "/contact", noindex: true },
    "/waitlist": { title: "Arthra waitlist · Product updates by choice", description: "Join the optional Arthra waitlist for considered product updates and research invitations.", canonicalPath: "/waitlist", noindex: true },
    "/thank-you": { title: "Thank you · Arthra", description: "Your Arthra submission has been received.", canonicalPath: "/thank-you", noindex: true },
  };
  if (publicPages[path]) return publicPages[path];
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
