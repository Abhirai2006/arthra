import {
  bigint,
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const spaces = mysqlTable(
  "spaces",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    color: varchar("color", { length: 16 }).default("violet").notNull(),
    icon: varchar("icon", { length: 32 }).default("home").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("spaces_owner_idx").on(table.ownerId),
    uniqueIndex("spaces_owner_name_unique").on(table.ownerId, table.name),
  ]
);

export const spaceMembers = mysqlTable(
  "space_members",
  {
    id: int("id").autoincrement().primaryKey(),
    spaceId: int("spaceId").notNull().references(() => spaces.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "editor", "viewer"]).default("viewer").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  table => [
    index("space_members_space_idx").on(table.spaceId),
    index("space_members_user_idx").on(table.userId),
    uniqueIndex("space_members_unique").on(table.spaceId, table.userId),
  ]
);

export const spaceInvites = mysqlTable(
  "space_invites",
  {
    id: int("id").autoincrement().primaryKey(),
    spaceId: int("spaceId").notNull().references(() => spaces.id, { onDelete: "cascade" }),
    createdById: int("createdById").notNull().references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }),
    role: mysqlEnum("role", ["editor", "viewer"]).default("editor").notNull(),
    token: varchar("token", { length: 96 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    revokedAt: timestamp("revokedAt"),
    acceptedAt: timestamp("acceptedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("space_invites_space_idx").on(table.spaceId),
    uniqueIndex("space_invites_token_unique").on(table.token),
  ]
);

export const accounts = mysqlTable(
  "accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    spaceId: int("spaceId").notNull().references(() => spaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    kind: mysqlEnum("kind", ["cash", "bank", "wallet", "credit_card", "other"]).default("bank").notNull(),
    openingBalancePaise: bigint("openingBalancePaise", { mode: "number" }).default(0).notNull(),
    isArchived: boolean("isArchived").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("accounts_owner_space_idx").on(table.ownerId, table.spaceId)]
);

export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    spaceId: int("spaceId").references(() => spaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    kind: mysqlEnum("kind", ["expense", "income"]).notNull(),
    color: varchar("color", { length: 16 }).default("violet").notNull(),
    icon: varchar("icon", { length: 32 }).default("circle").notNull(),
    isArchived: boolean("isArchived").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("categories_owner_idx").on(table.ownerId),
    index("categories_space_idx").on(table.spaceId),
    uniqueIndex("categories_owner_name_kind_unique").on(table.ownerId, table.name, table.kind),
  ]
);

export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    spaceId: int("spaceId").notNull().references(() => spaces.id, { onDelete: "cascade" }),
    createdById: int("createdById").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountId: int("accountId").references(() => accounts.id, { onDelete: "set null" }),
    categoryId: int("categoryId").references(() => categories.id, { onDelete: "set null" }),
    kind: mysqlEnum("kind", ["expense", "income"]).notNull(),
    amountPaise: bigint("amountPaise", { mode: "number" }).notNull(),
    description: varchar("description", { length: 180 }).notNull(),
    note: text("note"),
    occurredAt: timestamp("occurredAt").notNull(),
    isGstApplicable: boolean("isGstApplicable").default(false).notNull(),
    gstKind: mysqlEnum("gstKind", ["cgst_sgst", "igst"]),
    gstRateBasisPoints: int("gstRateBasisPoints"),
    isUnusual: boolean("isUnusual").default(false).notNull(),
    recurringRule: varchar("recurringRule", { length: 32 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("transactions_space_date_idx").on(table.spaceId, table.occurredAt),
    index("transactions_creator_date_idx").on(table.createdById, table.occurredAt),
    index("transactions_category_date_idx").on(table.categoryId, table.occurredAt),
  ]
);

export const transactionReceipts = mysqlTable(
  "transaction_receipts",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull().references(() => transactions.id, { onDelete: "cascade" }),
    uploadedById: int("uploadedById").notNull().references(() => users.id, { onDelete: "cascade" }),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
    originalName: varchar("originalName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    byteSize: int("byteSize").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("transaction_receipts_transaction_idx").on(table.transactionId)]
);

export const budgets = mysqlTable(
  "budgets",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    spaceId: int("spaceId").notNull().references(() => spaces.id, { onDelete: "cascade" }),
    categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
    monthKey: varchar("monthKey", { length: 7 }).notNull(),
    amountPaise: bigint("amountPaise", { mode: "number" }).notNull(),
    alertAtPercent: int("alertAtPercent").default(80).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("budgets_space_month_idx").on(table.spaceId, table.monthKey),
    uniqueIndex("budgets_space_category_month_unique").on(table.spaceId, table.categoryId, table.monthKey),
  ]
);

export const caShareLinks = mysqlTable(
  "ca_share_links",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    spaceId: int("spaceId").references(() => spaces.id, { onDelete: "cascade" }),
    financialYear: varchar("financialYear", { length: 9 }).notNull(),
    token: varchar("token", { length: 96 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    revokedAt: timestamp("revokedAt"),
    lastViewedAt: timestamp("lastViewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("ca_share_links_owner_idx").on(table.ownerId),
    uniqueIndex("ca_share_links_token_unique").on(table.token),
  ]
);

export const userStreaks = mysqlTable("user_streaks", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastLoggedOn: varchar("lastLoggedOn", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const weeklyDigestPreferences = mysqlTable("weekly_digest_preferences", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true).notNull(),
  destinationEmail: varchar("destinationEmail", { length: 320 }),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastSentForWeek: varchar("lastSentForWeek", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Space = typeof spaces.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
