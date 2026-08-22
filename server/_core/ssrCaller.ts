import type { Request, Response } from "express";
import { appRouter } from "../routers";
import { createContext } from "./context";

export async function buildSsrPrefetch(req: Request, res: Response) {
  const ctx = await createContext({ req, res } as never); const caller = appRouter.createCaller(ctx);
  return { authMe: () => caller.auth.me(), previewInvite: (token: string) => caller.finance.spaces.previewInvite({ token }), publicCaReport: (token: string) => caller.finance.reports.publicCaReport({ token }) };
}
