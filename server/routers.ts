import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { isProjectOwner, ownerProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { grantCuratorAccess, revokeCuratorAccess, hasCuratorAccess } from "./curatorAccess";
import { createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { addSubscriber, createCuratorPost, createCuratorRevision, createCuratorSubmission, createDreamSubmission, deleteCuratorPost, getCuratorEmail, getCuratorPostById, getCuratorPostBySlug, listCuratorPosts, listCuratorRevisions, listCuratorSpecimens, listCuratorSubmissions, listDreamSubmissions, listPublishedCuratorPosts, listSubscribers, setCuratorEmail, updateCuratorPost, upsertCuratorSpecimen } from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";

const mediaRef = z.string().refine((value) => value === "" || value.startsWith("/manus-storage/") || /^https?:\/\//.test(value), "Please enter a valid media URL");

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  curator: router({
    access: publicProcedure.query(({ ctx }) => ctx.user ? hasCuratorAccess(ctx.req, ctx.user) : false),
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
    schedule: ownerProcedure.input(z.object({ id: z.number().int(), cron: z.string().min(11).max(64) })).mutation(async ({ input, ctx }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const post = await getCuratorPostById(input.id);
      if (!post) throw new Error("Curator post not found");
      const job = post.scheduleCronTaskUid
        ? await updateHeartbeatJob(post.scheduleCronTaskUid, { cron: input.cron, enable: true }, sessionToken)
        : await createHeartbeatJob({ name: `curator-post-${input.id}`, cron: input.cron, path: "/api/scheduled/publishCuratorPost", payload: { postId: input.id }, description: `Publish Veilhouse curator post ${input.id}` }, sessionToken);
      return updateCuratorPost(input.id, { scheduleCronTaskUid: post.scheduleCronTaskUid || (job as { taskUid: string }).taskUid, scheduledFor: job.nextExecutionAt ? new Date(job.nextExecutionAt) : null });
    }),
    unschedule: ownerProcedure.input(z.object({ id: z.number().int(), taskUid: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      await deleteHeartbeatJob(input.taskUid, sessionToken);
      return updateCuratorPost(input.id, { scheduleCronTaskUid: null, scheduledFor: null });
    }),
    remove: ownerProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
      const post = await getCuratorPostById(input.id);
      if (post?.scheduleCronTaskUid) {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        await deleteHeartbeatJob(post.scheduleCronTaskUid, sessionToken);
      }
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
