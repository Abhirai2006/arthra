import { describe, expect, it } from "vitest";
import { canManageExpenseSpace, canWriteExpenseSpace, hasExpenseSpaceAccess } from "./permissions";

describe("Expense Space permission semantics", () => {
  it("allows owners and editors to create shared records", () => {
    expect(canWriteExpenseSpace("owner")).toBe(true);
    expect(canWriteExpenseSpace("editor")).toBe(true);
    expect(canWriteExpenseSpace("viewer")).toBe(false);
  });

  it("reserves management actions for the owner", () => {
    expect(canManageExpenseSpace("owner")).toBe(true);
    expect(canManageExpenseSpace("editor")).toBe(false);
    expect(canManageExpenseSpace("viewer")).toBe(false);
  });

  it("enforces the protected router access matrix", () => {
    expect(hasExpenseSpaceAccess("viewer", "read")).toBe(true);
    expect(hasExpenseSpaceAccess("viewer", "write")).toBe(false);
    expect(hasExpenseSpaceAccess("editor", "write")).toBe(true);
    expect(hasExpenseSpaceAccess("editor", "owner")).toBe(false);
    expect(hasExpenseSpaceAccess("owner", "owner")).toBe(true);
  });
});
