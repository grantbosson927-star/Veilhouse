import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { isProjectOwner, ownerProcedure, publicProcedure, router } from "./_core/trpc";
import { createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { createCuratorPost, createCuratorRevision, deleteCuratorPost, getCuratorPostById, getCuratorPostBySlug, listCuratorPosts, listCuratorRevisions, listPublishedCuratorPosts, updateCuratorPost } from "./db";
import { storagePut } from "./storage";
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
    access: publicProcedure.query(({ ctx }) => Boolean(ctx.user && isProjectOwner(ctx.user))),
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
  }),
});

export type AppRouter = typeof appRouter;
