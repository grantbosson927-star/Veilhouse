import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { ownerProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { grantCuratorAccess, revokeCuratorAccess, hasCuratorAccess } from "./curatorAccess";
import { addSubscriber, createCuratorPost, createCuratorRevision, createCuratorSubmission, createDreamSubmission, deleteCuratorPost, getCuratorEmail, getCuratorPostById, getCuratorPostBySlug, getUserByEmail, getUserByOpenId, listCuratorPosts, listCuratorRevisions, listCuratorSpecimens, listCuratorSubmissions, listDreamSubmissions, listPublishedCuratorPosts, listSubscribers, setCuratorEmail, toPublicUser, updateCuratorPost, upsertCuratorSpecimen, upsertUser } from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";
import { nextCronDate } from "./scheduleCron";
import { hashPassword, verifyPassword } from "./password";
import { z } from "zod";
import type { User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

const mediaRef = z.string().refine((value) => value === "" || value.startsWith("/media/") || value.startsWith("/manus-storage/") || value.startsWith("/archive-assets/") || /^https?:\/\//.test(value), "Please enter a valid media URL");

async function issueSession(ctx: TrpcContext, user: User, curatorEmail: string) {
  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name || user.email || "Visitor",
    expiresInMs: ONE_YEAR_MS,
  });
  ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
  if (user.email && user.email.toLowerCase() === curatorEmail) {
    await grantCuratorAccess(ctx.req, ctx.res, user, curatorEmail);
  }
  return { user: toPublicUser(user) } as const;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ? toPublicUser(opts.ctx.user) : null),
    signup: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters."),
      name: z.string().max(120).optional(),
    })).mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      if (await getUserByEmail(email)) throw new Error("An account with that email already exists.");
      const curatorEmail = await getCuratorEmail();
      const openId = `email:${email}`;
      await upsertUser({
        openId,
        email,
        name: input.name?.trim() || email.split("@")[0],
        passwordHash: await hashPassword(input.password),
        loginMethod: "email",
        role: email === curatorEmail ? "admin" : "user",
        lastSignedIn: new Date(),
      });
      const user = await getUserByEmail(email);
      if (!user) throw new Error("Could not create the account.");
      return issueSession(ctx, user, curatorEmail);
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const user = await getUserByEmail(email);
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new Error("Invalid email or password.");
      }
      await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      return issueSession(ctx, user, await getCuratorEmail());
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      revokeCuratorAccess(ctx.req, ctx.res);
      return {
        success: true,
      } as const;
    }),
  }),

  curator: router({
    access: publicProcedure.query(({ ctx }) => ctx.user ? hasCuratorAccess(ctx.req, ctx.user) : false),
    signIn: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const curatorEmail = await getCuratorEmail();
      if (email !== curatorEmail) return { unlocked: false as const };
      const openId = `curator:${email}`;
      await upsertUser({ openId, name: "Curator", email, loginMethod: "curator-email", role: "admin", lastSignedIn: new Date() });
      const user = await getUserByOpenId(openId) ?? {
        id: 1,
        openId,
        name: "Curator",
        email,
        passwordHash: null,
        loginMethod: "curator-email",
        role: "admin" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "Curator", expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return { unlocked: await grantCuratorAccess(ctx.req, ctx.res, user, email) };
    }),
    unlock: protectedProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input, ctx }) => ({ unlocked: await grantCuratorAccess(ctx.req, ctx.res, ctx.user, input.email) })),
    lock: protectedProcedure.mutation(({ ctx }) => { revokeCuratorAccess(ctx.req, ctx.res); return { success: true } as const; }),
    settings: ownerProcedure.query(() => getCuratorEmail()),
    updateSettings: ownerProcedure.input(z.object({ email: z.string().email() })).mutation(({ input }) => setCuratorEmail(input.email)),
    specimens: publicProcedure.query(() => listCuratorSpecimens()),
    specimenList: ownerProcedure.query(() => listCuratorSpecimens()),
    saveSpecimen: ownerProcedure.input(z.object({
      slug: z.string().min(1).max(255),
      title: z.string().min(1).max(255),
      category: z.string().min(1).max(120),
      excerpt: z.string().optional(),
      story: z.string().optional(),
      imageUrl: mediaRef.optional(),
      videoUrl: mediaRef.optional(),
      imageKey: z.string().optional().or(z.literal("")),
      videoKey: z.string().optional().or(z.literal("")),
      heroMedia: z.enum(["image", "video"]),
    })).mutation(({ input }) => upsertCuratorSpecimen({ ...input, story: input.story || null, imageUrl: input.imageUrl || null, videoUrl: input.videoUrl || null, imageKey: input.imageKey || null, videoKey: input.videoKey || null })),
    subscribers: ownerProcedure.query(() => listSubscribers()),
    submissions: ownerProcedure.query(() => listCuratorSubmissions()),
    published: publicProcedure.query(() => listPublishedCuratorPosts()),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input }) => { const post = await getCuratorPostBySlug(input.slug); return post?.status === "published" ? post : null; }),
    list: ownerProcedure.query(() => listCuratorPosts()),
    revisions: ownerProcedure.input(z.object({ postId: z.number().int() })).query(({ input }) => listCuratorRevisions(input.postId)),
    uploadMedia: ownerProcedure.input(z.object({ fileName: z.string().min(1).max(160), contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]), data: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const bytes = Buffer.from(input.data, "base64");
      if (bytes.byteLength > 25 * 1024 * 1024) throw new Error("Media uploads must be 25MB or smaller.");
      return storagePut(`curator/${ctx.user.id}/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`, bytes, input.contentType);
    }),
    create: ownerProcedure.input(z.object({
      title: z.string().min(1).max(255),
      category: z.string().min(1).max(120),
      excerpt: z.string().min(1),
      story: z.string().min(1),
      imageUrl: mediaRef.optional(),
      videoUrl: mediaRef.optional(),
      imageKey: z.string().optional().or(z.literal("")),
      videoKey: z.string().optional().or(z.literal("")),
      status: z.enum(["draft", "published"]),
    })).mutation(async ({ input, ctx }) => {
      const slug = input.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
      const post = await createCuratorPost({ authorId: ctx.user.id, title: input.title, slug, category: input.category, excerpt: input.excerpt, story: input.story, imageUrl: input.imageUrl || null, videoUrl: input.videoUrl || null, imageKey: input.imageKey || null, videoKey: input.videoKey || null, status: input.status, publishedAt: input.status === "published" ? new Date() : null });
      if (post) await createCuratorRevision({ postId: post.id, authorId: ctx.user.id, title: post.title, category: post.category, excerpt: post.excerpt, story: post.story, imageUrl: post.imageUrl, videoUrl: post.videoUrl, status: post.status });
      return post;
    }),
    update: ownerProcedure.input(z.object({
      id: z.number().int(),
      title: z.string().min(1).max(255),
      category: z.string().min(1).max(120),
      excerpt: z.string().min(1),
      story: z.string().min(1),
      imageUrl: mediaRef.optional(),
      videoUrl: mediaRef.optional(),
      imageKey: z.string().optional().or(z.literal("")),
      videoKey: z.string().optional().or(z.literal("")),
      status: z.enum(["draft", "published"]),
    })).mutation(async ({ input, ctx }) => {
      const post = await updateCuratorPost(input.id, { title: input.title, category: input.category, excerpt: input.excerpt, story: input.story, imageUrl: input.imageUrl || null, videoUrl: input.videoUrl || null, imageKey: input.imageKey || null, videoKey: input.videoKey || null, status: input.status, publishedAt: input.status === "published" ? new Date() : null });
      if (post) await createCuratorRevision({ postId: post.id, authorId: ctx.user.id, title: post.title, category: post.category, excerpt: post.excerpt, story: post.story, imageUrl: post.imageUrl, videoUrl: post.videoUrl, status: post.status });
      return post;
    }),
    schedule: ownerProcedure.input(z.object({ id: z.number().int(), cron: z.string().min(9).max(64) })).mutation(async ({ input }) => {
      const post = await getCuratorPostById(input.id);
      if (!post) throw new Error("Curator post not found");
      return updateCuratorPost(input.id, { scheduleCronTaskUid: input.cron, scheduledFor: nextCronDate(input.cron) });
    }),
    unschedule: ownerProcedure.input(z.object({ id: z.number().int(), taskUid: z.string().min(1) })).mutation(async ({ input }) => {
      return updateCuratorPost(input.id, { scheduleCronTaskUid: null, scheduledFor: null });
    }),
    remove: ownerProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      return deleteCuratorPost(input.id);
    }),
    dreams: ownerProcedure.query(() => listDreamSubmissions()),
  }),
  dispatch: router({
    subscribe: publicProcedure.input(z.object({ email: z.string().email() })).mutation(({ input }) => addSubscriber(input.email)),
  }),
  dreams: router({
    submit: publicProcedure.input(z.object({ title: z.string().min(1).max(255), dreamText: z.string().min(1).max(5000) })).mutation(({ input }) => createDreamSubmission({ title: input.title.trim(), dreamText: input.dreamText.trim() })),
    recent: publicProcedure.query(() => listDreamSubmissions()),
  }),
  submissions: router({
    create: publicProcedure.input(z.object({
      name: z.string().min(1).max(255),
      email: z.string().email(),
      category: z.string().min(1).max(120),
      title: z.string().min(1).max(255),
      description: z.string().min(1).max(12000),
      imageData: z.string().optional(),
      imageName: z.string().max(160).optional(),
      imageContentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]).optional(),
    })).mutation(async ({ input }) => {
      let imageUrl: string | null = null;
      let imageKey: string | null = null;
      if (input.imageData) {
        const bytes = Buffer.from(input.imageData, "base64");
        if (bytes.byteLength > 12 * 1024 * 1024) throw new Error("Specimen images must be 12MB or smaller.");
        const asset = await storagePut(`submissions/${Date.now()}-${(input.imageName || "specimen.jpg").replace(/[^a-zA-Z0-9._-]/g, "-")}`, bytes, input.imageContentType || "image/jpeg");
        imageUrl = asset.url;
        imageKey = asset.key;
      }
      const submission = await createCuratorSubmission({ name: input.name.trim(), email: input.email.trim().toLowerCase(), category: input.category, title: input.title.trim(), description: input.description.trim(), imageUrl, imageKey, recipient: "curator@veilhouse.monster" });
      try { await notifyOwner({ title: `New Veilhouse specimen: ${submission?.title || input.title}`, content: `Route this submission to curator@veilhouse.monster.\n\nFrom: ${input.name} <${input.email}>\nCategory: ${input.category}\nTitle: ${input.title}\n\n${input.description}${imageUrl ? `\n\nImage: ${imageUrl}` : "\n\nNo image attached."}` }); } catch (error) { console.warn("[Submissions] Stored submission but notification delivery was unavailable:", error); }
      return { accepted: true, recipient: "curator@veilhouse.monster", id: submission?.id, imageUrl } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
