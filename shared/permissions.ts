export type ExpenseSpaceRole = "owner" | "editor" | "viewer";

export function canWriteExpenseSpace(role: ExpenseSpaceRole) {
  return role === "owner" || role === "editor";
}

export function canManageExpenseSpace(role: ExpenseSpaceRole) {
  return role === "owner";
}

export function hasExpenseSpaceAccess(role: ExpenseSpaceRole, required: "read" | "write" | "owner") {
  if (required === "read") return true;
  if (required === "write") return canWriteExpenseSpace(role);
  return canManageExpenseSpace(role);
}
