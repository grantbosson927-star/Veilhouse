import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  offerings: integer("offerings").default(1000).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const curatorPosts = sqliteTable("curator_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: integer("authorId").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  excerpt: text("excerpt").notNull(),
  story: text("story").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  imageKey: text("imageKey"),
  videoKey: text("videoKey"),
  status: text("status", { enum: ["draft", "published"] }).default("draft").notNull(),
  scheduleCronTaskUid: text("scheduleCronTaskUid"),
  scheduledFor: integer("scheduledFor", { mode: "timestamp" }),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type CuratorPost = typeof curatorPosts.$inferSelect;
export type InsertCuratorPost = typeof curatorPosts.$inferInsert;

export const curatorPostRevisions = sqliteTable("curator_post_revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  authorId: integer("authorId").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  excerpt: text("excerpt").notNull(),
  story: text("story").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  status: text("status", { enum: ["draft", "published"] }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type CuratorPostRevision = typeof curatorPostRevisions.$inferSelect;
export type InsertCuratorPostRevision = typeof curatorPostRevisions.$inferInsert;

export const curatorSettings = sqliteTable("curator_settings", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type CuratorSettings = typeof curatorSettings.$inferSelect;

export const curatorSpecimens = sqliteTable("curator_specimens", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  excerpt: text("excerpt"),
  story: text("story"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  imageKey: text("imageKey"),
  videoKey: text("videoKey"),
  audioUrl: text("audioUrl"),
  audioKey: text("audioKey"),
  heroMedia: text("heroMedia", { enum: ["image", "video"] }).default("image").notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  visible: integer("visible", { mode: "boolean" }).default(true).notNull(),
  featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type CuratorSpecimen = typeof curatorSpecimens.$inferSelect;
export type InsertCuratorSpecimen = typeof curatorSpecimens.$inferInsert;

export const curatorSubmissions = sqliteTable("curator_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  recipient: text("recipient").notNull().default("curator@veilhouse.monster"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type CuratorSubmission = typeof curatorSubmissions.$inferSelect;
export type InsertCuratorSubmission = typeof curatorSubmissions.$inferInsert;

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("dispatch"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;

export const dreamSubmissions = sqliteTable("dream_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId"),
  title: text("title").notNull(),
  dreamText: text("dreamText").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type DreamSubmission = typeof dreamSubmissions.$inferSelect;
export type InsertDreamSubmission = typeof dreamSubmissions.$inferInsert;

export const offeringLedger = sqliteTable("offering_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type OfferingLedgerEntry = typeof offeringLedger.$inferSelect;
export type InsertOfferingLedgerEntry = typeof offeringLedger.$inferInsert;

export const generatedDreams = sqliteTable("generated_dreams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("imageUrl").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type GeneratedDream = typeof generatedDreams.$inferSelect;
export type InsertGeneratedDream = typeof generatedDreams.$inferInsert;

export const specimenUnlocks = sqliteTable("specimen_unlocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  specimenSlug: text("specimenSlug").notNull(),
  kind: text("kind", { enum: ["story", "video", "audio"] }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SpecimenUnlock = typeof specimenUnlocks.$inferSelect;
export type InsertSpecimenUnlock = typeof specimenUnlocks.$inferInsert;

export const archiveDoors = sqliteTable("archive_doors", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  introduction: text("introduction").notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  visible: integer("visible", { mode: "boolean" }).default(true).notNull(),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type ArchiveDoor = typeof archiveDoors.$inferSelect;
export type InsertArchiveDoor = typeof archiveDoors.$inferInsert;

export const fieldNotes = sqliteTable("field_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  status: text("status", { enum: ["draft", "published"] }).default("draft").notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type FieldNote = typeof fieldNotes.$inferSelect;
export type InsertFieldNote = typeof fieldNotes.$inferInsert;

export const manifestoSections = sqliteTable("manifesto_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: text("number").notNull(),
  heading: text("heading").notNull(),
  body: text("body").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type ManifestoSection = typeof manifestoSections.$inferSelect;
export type InsertManifestoSection = typeof manifestoSections.$inferInsert;
