import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider, HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { hydrateRoot } from "react-dom/client";
import superjson from "superjson";
import { Router } from "wouter";
import App from "./App";
import { startLogin } from "./const";
import { trpc } from "./lib/trpc";
import "./index.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(error => console.warn("PWA registration failed", error)));
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
const redirectToLoginIfUnauthorized = (error: unknown) => { if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) startLogin(); };
queryClient.getQueryCache().subscribe(event => { if (event.type === "updated" && event.action.type === "error") redirectToLoginIfUnauthorized(event.query.state.error); });
queryClient.getMutationCache().subscribe(event => { if (event.type === "updated" && event.action.type === "error") redirectToLoginIfUnauthorized(event.mutation.state.error); });
const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson, headers() { try { const raw = sessionStorage.getItem("manus-cookie"); const token = raw?.split(";").find(value => value.trim().startsWith(`${COOKIE_NAME}=`))?.trim().slice(COOKIE_NAME.length + 1); return token ? { Authorization: `Bearer ${token}` } : {}; } catch { return {}; } }, fetch(input, init) { return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" }); } })] });
const state = ((window as Window & { __RQ_STATE__?: unknown }).__RQ_STATE__ ? superjson.deserialize((window as Window & { __RQ_STATE__?: unknown }).__RQ_STATE__ as any) : undefined) as DehydratedState | undefined;
hydrateRoot(document.getElementById("root")!, <QueryClientProvider client={queryClient}><trpc.Provider client={trpcClient} queryClient={queryClient}><HydrationBoundary state={state}><Router><App /></Router></HydrationBoundary></trpc.Provider></QueryClientProvider>);
