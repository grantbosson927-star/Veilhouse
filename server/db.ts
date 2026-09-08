import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import {
  CuratorPost,
  CuratorPostRevision,
  DreamSubmission,
  InsertCuratorPost,
  InsertCuratorPostRevision,
  InsertCuratorSpecimen,
  InsertCuratorSubmission,
  InsertDreamSubmission,
  InsertGeneratedDream,
  InsertSpecimenUnlock,
  InsertUser,
  InsertArchiveDoor,
  InsertFieldNote,
  InsertManifestoSection,
  archiveDoors,
  fieldNotes,
  manifestoSections,
  curatorPostRevisions,
  curatorPosts,
  curatorSettings,
  curatorSpecimens,
  curatorSubmissions,
  dreamSubmissions,
  generatedDreams,
  offeringLedger,
  specimenUnlocks,
  subscribers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getRuntime } from "./runtime";

let _db: DrizzleD1Database | null = null;
let _bound: D1Database | undefined;

export async function getDb() {
  const d1 = getRuntime()?.d1;
  if (d1) {
    if (_db && _bound === d1) return _db;
    _bound = d1;
    _db = drizzle(d1);
    return _db;
  }
  return null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  updateSet.updatedAt = new Date();

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function spendOfferings(userId: number, amount: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const current = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!current || current.offerings < amount) return { accepted: false as const, user: current };
  await db.update(users).set({ offerings: current.offerings - amount, updatedAt: new Date() }).where(and(eq(users.id, userId), gte(users.offerings, amount)));
  await db.insert(offeringLedger).values({ userId, amount: -amount, reason, createdAt: new Date() });
  const updated = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  return { accepted: true as const, user: updated };
}

export async function restoreOfferings(userId: number, amount: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const current = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!current) return;
  await db.update(users).set({ offerings: current.offerings + amount, updatedAt: new Date() }).where(eq(users.id, userId));
  await db.insert(offeringLedger).values({ userId, amount, reason, createdAt: new Date() });
}

export async function listOfferingLedger(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offeringLedger).where(eq(offeringLedger.userId, userId)).orderBy(desc(offeringLedger.createdAt)).limit(20);
}

export async function createGeneratedDream(dream: InsertGeneratedDream) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(generatedDreams).values(dream).returning();
  return rows[0];
}

export async function listGeneratedDreams(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedDreams).where(eq(generatedDreams.userId, userId)).orderBy(desc(generatedDreams.createdAt)).limit(12);
}

export async function listSpecimenUnlocks(userId: number, specimenSlug: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(specimenUnlocks).where(and(eq(specimenUnlocks.userId, userId), eq(specimenUnlocks.specimenSlug, specimenSlug)));
}

export async function createSpecimenUnlock(unlock: InsertSpecimenUnlock) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(specimenUnlocks).where(and(eq(specimenUnlocks.userId, unlock.userId), eq(specimenUnlocks.specimenSlug, unlock.specimenSlug), eq(specimenUnlocks.kind, unlock.kind))).limit(1);
  if (existing[0]) return existing[0];
  const rows = await db.insert(specimenUnlocks).values(unlock).returning();
  return rows[0];
}

export async function listCuratorPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(curatorPosts).orderBy(desc(curatorPosts.createdAt));
}

export async function listPublishedCuratorPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(curatorPosts).where(eq(curatorPosts.status, "published")).orderBy(desc(curatorPosts.publishedAt));
}

export async function getCuratorPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(curatorPosts).where(eq(curatorPosts.id, id)).limit(1);
  return rows[0];
}

export async function getCuratorPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(curatorPosts).where(eq(curatorPosts.slug, slug)).limit(1);
  return rows[0];
}

export async function getCuratorPostByScheduleTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(curatorPosts).where(eq(curatorPosts.scheduleCronTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function listDueCuratorPosts(now = new Date()) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(curatorPosts).where(and(eq(curatorPosts.status, "draft"), lte(curatorPosts.scheduledFor, now)));
}

export async function createCuratorPost(post: InsertCuratorPost): Promise<CuratorPost | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(curatorPosts).values(post).returning();
  return rows[0];
}

export async function updateCuratorPost(id: number, post: Partial<Omit<InsertCuratorPost, "id" | "authorId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(curatorPosts).set({ ...post, updatedAt: new Date() }).where(eq(curatorPosts.id, id));
  const rows = await db.select().from(curatorPosts).where(eq(curatorPosts.id, id));
  return rows[0];
}

export async function deleteCuratorPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(curatorPosts).where(eq(curatorPosts.id, id));
  return { success: true } as const;
}

export async function createCuratorRevision(revision: InsertCuratorPostRevision): Promise<CuratorPostRevision | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(curatorPostRevisions).values(revision).returning();
  return rows[0];
}

export async function listCuratorRevisions(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(curatorPostRevisions).where(eq(curatorPostRevisions.postId, postId)).orderBy(desc(curatorPostRevisions.createdAt));
}

export async function getCuratorEmail() {
  const db = await getDb();
  if (!db) return ENV.curatorEmail;
  const rows = await db.select().from(curatorSettings).where(eq(curatorSettings.id, 1)).limit(1);
  return rows[0]?.email?.trim().toLowerCase() || ENV.curatorEmail;
}

export async function setCuratorEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalized = email.trim().toLowerCase();
  await db.insert(curatorSettings).values({ id: 1, email: normalized, updatedAt: new Date() }).onConflictDoUpdate({
    target: curatorSettings.id,
    set: { email: normalized, updatedAt: new Date() },
  });
  return getCuratorEmail();
}

export async function listCuratorSpecimens(includeHidden = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(curatorSpecimens);
  return (includeHidden ? query : query.where(eq(curatorSpecimens.visible, true))).orderBy(curatorSpecimens.displayOrder, curatorSpecimens.title);
}

export async function getCuratorSpecimen(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(curatorSpecimens).where(eq(curatorSpecimens.slug, slug)).limit(1);
  return rows[0];
}

export async function upsertCuratorSpecimen(specimen: InsertCuratorSpecimen) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(curatorSpecimens).values(specimen).onConflictDoUpdate({
    target: curatorSpecimens.slug,
    set: {
      title: specimen.title,
      category: specimen.category,
      excerpt: specimen.excerpt ?? null,
      story: specimen.story ?? null,
      imageUrl: specimen.imageUrl ?? null,
      videoUrl: specimen.videoUrl ?? null,
      imageKey: specimen.imageKey ?? null,
      videoKey: specimen.videoKey ?? null,
      audioUrl: specimen.audioUrl ?? null,
      audioKey: specimen.audioKey ?? null,
      heroMedia: specimen.heroMedia,
      displayOrder: specimen.displayOrder ?? 0,
      visible: specimen.visible ?? true,
      featured: specimen.featured ?? false,
      updatedAt: new Date(),
    },
  });
  return getCuratorSpecimen(specimen.slug);
}

export async function createCuratorSubmission(submission: InsertCuratorSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(curatorSubmissions).values(submission).returning();
  return rows[0];
}

export async function listCuratorSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(curatorSubmissions).orderBy(desc(curatorSubmissions.createdAt));
}

export async function addSubscriber(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalized = email.trim().toLowerCase();
  await db.insert(subscribers).values({ email: normalized, source: "dispatch" }).onConflictDoUpdate({
    target: subscribers.email,
    set: { email: normalized },
  });
  const rows = await db.select().from(subscribers).where(eq(subscribers.email, normalized)).limit(1);
  return rows[0];
}

export async function listSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

export async function createDreamSubmission(submission: InsertDreamSubmission): Promise<DreamSubmission | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.insert(dreamSubmissions).values(submission).returning();
  return rows[0];
}

export async function listDreamSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dreamSubmissions).orderBy(desc(dreamSubmissions.createdAt)).limit(12);
}

export async function listArchiveDoors(includeHidden = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(archiveDoors);
  return (includeHidden ? query : query.where(eq(archiveDoors.visible, true))).orderBy(archiveDoors.displayOrder, archiveDoors.name);
}
export async function upsertArchiveDoor(door: InsertArchiveDoor) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(archiveDoors).values(door).onConflictDoUpdate({ target: archiveDoors.slug, set: { name: door.name, introduction: door.introduction, displayOrder: door.displayOrder ?? 0, visible: door.visible ?? true, imageUrl: door.imageUrl ?? null, imageKey: door.imageKey ?? null, updatedAt: new Date() } });
  const rows = await db.select().from(archiveDoors).where(eq(archiveDoors.slug, door.slug)).limit(1);
  return rows[0];
}
export async function listFieldNotes(includeDrafts = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(fieldNotes);
  return (includeDrafts ? query : query.where(eq(fieldNotes.status, "published"))).orderBy(fieldNotes.displayOrder, fieldNotes.createdAt);
}
export async function upsertFieldNote(note: InsertFieldNote) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (note.id) {
    await db.update(fieldNotes).set({ ...note, updatedAt: new Date() }).where(eq(fieldNotes.id, note.id));
    const rows = await db.select().from(fieldNotes).where(eq(fieldNotes.id, note.id)).limit(1);
    return rows[0];
  }
  const rows = await db.insert(fieldNotes).values(note).returning();
  return rows[0];
}
export async function listManifestoSections() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(manifestoSections).orderBy(manifestoSections.displayOrder, manifestoSections.id);
}
export async function upsertManifestoSection(section: InsertManifestoSection) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (section.id) {
    await db.update(manifestoSections).set({ ...section, updatedAt: new Date() }).where(eq(manifestoSections.id, section.id));
    const rows = await db.select().from(manifestoSections).where(eq(manifestoSections.id, section.id)).limit(1);
    return rows[0];
  }
  const rows = await db.insert(manifestoSections).values(section).returning();
  return rows[0];
}
