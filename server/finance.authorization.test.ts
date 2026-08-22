import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./financeDb", async importOriginal => {
  const actual = await importOriginal<typeof import("./financeDb")>();
  return { ...actual, canAccessSpace: vi.fn(), getSpaceMembers: vi.fn(), createSpaceInvite: vi.fn() };
});

import { canAccessSpace, createSpaceInvite, getSpaceMembers } from "./financeDb";
import { financeRouter } from "./routers/finance";

const ctx = { user: { id: 31, openId: "protected-test", name: "Test", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {} }, res: {} } as unknown as TrpcContext;

describe("protected finance router boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks a non-member before any member list can be returned", async () => {
    vi.mocked(canAccessSpace).mockResolvedValue(null);
    const caller = financeRouter.createCaller(ctx);
    await expect(caller.spaces.members({ spaceId: 9 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getSpaceMembers).not.toHaveBeenCalled();
  });

  it("blocks a non-owner before a share invite is created", async () => {
    vi.mocked(canAccessSpace).mockImplementation(async (_userId, _spaceId, requiredRole) => requiredRole === "owner" ? null : ({ role: "editor", spaceId: 9, ownerId: 1, name: "Shared" } as any));
    const caller = financeRouter.createCaller(ctx);
    await expect(caller.spaces.invite({ spaceId: 9, email: "invitee@example.com", role: "viewer", expiresAt: new Date(Date.now() + 86_400_000) })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createSpaceInvite).not.toHaveBeenCalled();
  });
});
