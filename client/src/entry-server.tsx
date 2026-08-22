import { QueryClient, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { renderToString } from "react-dom/server";
import superjson from "superjson";
import { Router } from "wouter";
import App from "./App";
import { trpc } from "./lib/trpc";
import { prefetchForPath, type SsrPrefetch } from "./ssr/prefetch";

export async function render(url: string, prefetch: SsrPrefetch) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
  const splitAt = url.indexOf("?"); const ssrPath = splitAt === -1 ? url : url.slice(0, splitAt); const ssrSearch = splitAt === -1 ? "" : url.slice(splitAt + 1);
  const head = await prefetchForPath(url, queryClient, prefetch);
  const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })] });
  const html = renderToString(<QueryClientProvider client={queryClient}><trpc.Provider client={trpcClient} queryClient={queryClient}><Router ssrPath={ssrPath} ssrSearch={ssrSearch}><App /></Router></trpc.Provider></QueryClientProvider>);
  return { html, dehydratedState: dehydrate(queryClient), head };
}
