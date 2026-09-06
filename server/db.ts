import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { CuratorPost, CuratorPostRevision, DreamSubmission, InsertCuratorPost, InsertCuratorPostRevision, InsertCuratorSpecimen, InsertDreamSubmission, InsertUser, curatorPostRevisions, curatorPosts, curatorSettings, curatorSpecimens, dreamSubmissions, subscribers, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
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

export async function createCuratorPost(post: InsertCuratorPost): Promise<CuratorPost | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(curatorPosts).values(post);
  const rows = await db.select().from(curatorPosts).where(eq(curatorPosts.id, result[0].insertId));
  return rows[0];
}

export async function updateCuratorPost(id: number, post: Partial<Omit<InsertCuratorPost, "id" | "authorId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(curatorPosts).set(post).where(eq(curatorPosts.id, id));
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
  const result = await db.insert(curatorPostRevisions).values(revision);
  const rows = await db.select().from(curatorPostRevisions).where(eq(curatorPostRevisions.id, result[0].insertId));
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
  await db.insert(curatorSettings).values({ id: 1, email: email.trim().toLowerCase() }).onDuplicateKeyUpdate({ set: { email: email.trim().toLowerCase() } });
  return getCuratorEmail();
}

export async function listCuratorSpecimens() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(curatorSpecimens);
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
  await db.insert(curatorSpecimens).values(specimen).onDuplicateKeyUpdate({
    set: {
      title: specimen.title,
      category: specimen.category,
      story: specimen.story ?? null,
      imageUrl: specimen.imageUrl ?? null,
      videoUrl: specimen.videoUrl ?? null,
      imageKey: specimen.imageKey ?? null,
      videoKey: specimen.videoKey ?? null,
      heroMedia: specimen.heroMedia,
    },
  });
  return getCuratorSpecimen(specimen.slug);
}

export async function addSubscriber(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalized = email.trim().toLowerCase();
  await db.insert(subscribers).values({ email: normalized, source: "dispatch" }).onDuplicateKeyUpdate({ set: { email: normalized } });
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
  const result = await db.insert(dreamSubmissions).values(submission);
  const rows = await db.select().from(dreamSubmissions).where(eq(dreamSubmissions.id, result[0].insertId));
  return rows[0];
}

export async function listDreamSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dreamSubmissions).orderBy(desc(dreamSubmissions.createdAt)).limit(12);
}
