import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const curatorPosts = mysqlTable("curator_posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 120 }).notNull(),
  excerpt: text("excerpt").notNull(),
  story: text("story").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  imageKey: text("imageKey"),
  videoKey: text("videoKey"),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  scheduledFor: timestamp("scheduledFor"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CuratorPost = typeof curatorPosts.$inferSelect;
export type InsertCuratorPost = typeof curatorPosts.$inferInsert;

export const curatorPostRevisions = mysqlTable("curator_post_revisions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  excerpt: text("excerpt").notNull(),
  story: text("story").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  status: mysqlEnum("status", ["draft", "published"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CuratorPostRevision = typeof curatorPostRevisions.$inferSelect;
export type InsertCuratorPostRevision = typeof curatorPostRevisions.$inferInsert;

export const curatorSettings = mysqlTable("curator_settings", {
  id: int("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CuratorSettings = typeof curatorSettings.$inferSelect;

export const curatorSpecimens = mysqlTable("curator_specimens", {
  slug: varchar("slug", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  story: text("story"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  imageKey: text("imageKey"),
  videoKey: text("videoKey"),
  heroMedia: mysqlEnum("heroMedia", ["image", "video"]).default("image").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CuratorSpecimen = typeof curatorSpecimens.$inferSelect;
export type InsertCuratorSpecimen = typeof curatorSpecimens.$inferInsert;

export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 64 }).notNull().default("dispatch"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;

export const dreamSubmissions = mysqlTable("dream_submissions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  dreamText: text("dreamText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DreamSubmission = typeof dreamSubmissions.$inferSelect;
export type InsertDreamSubmission = typeof dreamSubmissions.$inferInsert;
