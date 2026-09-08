import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { ownerProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { grantCuratorAccess, revokeCuratorAccess, hasCuratorAccess } from "./curatorAccess";
import { addSubscriber, createCuratorPost, createCuratorRevision, createCuratorSubmission, createDreamSubmission, createGeneratedDream, createSpecimenUnlock, deleteCuratorPost, getCuratorEmail, getCuratorPostById, getCuratorPostBySlug, getUserByOpenId, listArchiveDoors, listCuratorPosts, listCuratorRevisions, listCuratorSpecimens, listCuratorSubmissions, listDreamSubmissions, listFieldNotes, listGeneratedDreams, listManifestoSections, listOfferingLedger, listPublishedCuratorPosts, listSpecimenUnlocks, listSubscribers, listUsers, restoreOfferings, setCuratorEmail, spendOfferings, updateCuratorPost, upsertArchiveDoor, upsertCuratorSpecimen, upsertFieldNote, upsertManifestoSection, upsertUser } from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";
import { nextCronDate } from "./scheduleCron";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateImage } from "./_core/imageGeneration";

const mediaRef = z.string().refine((value) => value === "" || value.startsWith("/media/") || value.startsWith("/manus-storage/") || value.startsWith("/archive-assets/") || /^https?:\/\//.test(value), "Please enter a valid media URL");

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    signInEmail: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const curatorEmail = await getCuratorEmail();
      const openId = `email:${email}`;
      await upsertUser({ openId, name: email.split("@")[0], email, loginMethod: "email", role: email === curatorEmail ? "admin" : "user", lastSignedIn: new Date() });
      const user = await getUserByOpenId(openId);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The House could not register this resident." });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || email, expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return { user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  account: router({
    snapshot: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      return { user: user || ctx.user, ledger: await listOfferingLedger(ctx.user.id) };
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
        loginMethod: "curator-email",
        role: "admin" as const,
        offerings: 1000,
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
    specimens: publicProcedure.query(() => listCuratorSpecimens(false)),
    specimenList: ownerProcedure.query(() => listCuratorSpecimens(true)),
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
      audioUrl: mediaRef.optional(),
      audioKey: z.string().optional().or(z.literal("")),
      heroMedia: z.enum(["image", "video"]),
      displayOrder: z.number().int().min(0).max(9999),
      visible: z.boolean(),
      featured: z.boolean(),
    })).mutation(({ input }) => upsertCuratorSpecimen({ ...input, story: input.story || null, imageUrl: input.imageUrl || null, videoUrl: input.videoUrl || null, imageKey: input.imageKey || null, audioUrl: input.audioUrl || null, audioKey: input.audioKey || null, videoKey: input.videoKey || null })),
    duplicateAudit: ownerProcedure.query(async () => {
      const specimens = await listCuratorSpecimens(true);
      const byImage = new Map<string, string[]>();
      for (const specimen of specimens) if (specimen.imageUrl) byImage.set(specimen.imageUrl, [...(byImage.get(specimen.imageUrl) || []), specimen.slug]);
      return { duplicateImages: Array.from(byImage.entries()).filter(([, slugs]) => slugs.length > 1).map(([imageUrl, slugs]) => ({ imageUrl, slugs })), missingImages: specimens.filter((specimen) => !specimen.imageUrl).map((specimen) => ({ slug: specimen.slug, title: specimen.title })) };
    }),
    generateSpecimenImage: ownerProcedure.input(z.object({
      slug: z.string().min(1).max(255),
      title: z.string().min(1).max(255),
      category: z.string().min(1).max(120),
      story: z.string().min(1).max(12000),
    })).mutation(async ({ input }) => {
      const prompt = `Create a dedicated archival image for the Veilhouse specimen “${input.title}” from the ${input.category} door. ${input.story} Original dark surreal horror, cinematic composition, obscure underground analog horror film from the 1970s or 1980s, tactile practical-effects photography rather than polished CGI. Combine grotesque body horror, decaying religious imagery, organic architecture, ritualistic symbolism, impossible dream geometry, wet fleshy textures, teeth, mouths, bone-like forms, rotting fabric, wax, rust, and handmade materials. Use muted burgundy, brown, dirty ochre, black, and sickly green tones; dim candlelight; weak cyan television-like glow; deep shadows; soft focus; heavy aged film grain; faded colors; slight lens distortion; dark vignette. Favor solemn stillness, unsettling silhouettes, strange ceremonies, and unexplained details over explicit gore. Make this image visually distinct from every other specimen, with a unique subject, camera angle, setting, and composition. No text, no labels, no watermark.`;
      const generated = await generateImage({ prompt, model: "MODEL_GPT_IMAGE_2", quality: "medium" });
      if (!generated.url) throw new Error("The House returned no image from the image chamber.");
      return { slug: input.slug, url: generated.url };
    }),
    subscribers: ownerProcedure.query(() => listSubscribers()),
    submissions: ownerProcedure.query(() => listCuratorSubmissions()),
    users: ownerProcedure.query(() => listUsers()),
    published: publicProcedure.query(() => listPublishedCuratorPosts()),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input }) => { const post = await getCuratorPostBySlug(input.slug); return post?.status === "published" ? post : null; }),
    list: ownerProcedure.query(() => listCuratorPosts()),
    revisions: ownerProcedure.input(z.object({ postId: z.number().int() })).query(({ input }) => listCuratorRevisions(input.postId)),
    uploadMedia: ownerProcedure.input(z.object({ fileName: z.string().min(1).max(160), contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"]), data: z.string().min(1) })).mutation(async ({ input, ctx }) => {
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
    doors: ownerProcedure.query(() => listArchiveDoors(true)),
    saveDoor: ownerProcedure.input(z.object({ slug: z.string().min(1).max(80), name: z.string().min(1).max(120), introduction: z.string().min(1), displayOrder: z.number().int(), visible: z.boolean(), imageUrl: mediaRef.optional(), imageKey: z.string().optional().or(z.literal("")) })).mutation(({ input }) => upsertArchiveDoor({ ...input, imageUrl: input.imageUrl || null, imageKey: input.imageKey || null })),
    fieldNotes: ownerProcedure.query(() => listFieldNotes(true)),
    saveFieldNote: ownerProcedure.input(z.object({ id: z.number().int().optional(), title: z.string().min(1).max(255), kind: z.string().min(1).max(80), slug: z.string().min(1).max(120), excerpt: z.string().min(1), body: z.string().min(1), imageUrl: mediaRef.optional(), imageKey: z.string().optional().or(z.literal("")), status: z.enum(["draft", "published"]), displayOrder: z.number().int() })).mutation(({ input }) => upsertFieldNote({ ...input, imageUrl: input.imageUrl || null, imageKey: input.imageKey || null })),
    manifesto: ownerProcedure.query(() => listManifestoSections()),
    saveManifesto: ownerProcedure.input(z.object({ id: z.number().int().optional(), number: z.string().min(1).max(12), heading: z.string().min(1).max(255), body: z.string().min(1), imageUrl: mediaRef.optional(), imageKey: z.string().optional().or(z.literal("")), displayOrder: z.number().int() })).mutation(({ input }) => upsertManifestoSection({ ...input, imageUrl: input.imageUrl || null, imageKey: input.imageKey || null })),
  }),
  editorial: router({
    doors: publicProcedure.query(() => listArchiveDoors(false)),
    fieldNotes: publicProcedure.query(() => listFieldNotes(false)),
    manifesto: publicProcedure.query(() => listManifestoSections()),
  }),
  dispatch: router({
    subscribe: publicProcedure.input(z.object({ email: z.string().email() })).mutation(({ input }) => addSubscriber(input.email)),
  }),
  dreams: router({
    submit: publicProcedure.input(z.object({ title: z.string().min(1).max(255), dreamText: z.string().min(1).max(5000) })).mutation(({ input, ctx }) => createDreamSubmission({ userId: ctx.user?.id, title: input.title.trim(), dreamText: input.dreamText.trim() })),
    recent: publicProcedure.query(() => listDreamSubmissions()),
    mine: protectedProcedure.query(({ ctx }) => listGeneratedDreams(ctx.user.id)),
    generate: protectedProcedure.input(z.object({ title: z.string().min(1).max(255), dreamText: z.string().min(1).max(5000) })).mutation(async ({ input, ctx }) => {
      const cost = 150;
      const spent = await spendOfferings(ctx.user.id, cost, "Dragged a nightmare from the 7th circle");
      if (!spent.accepted) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The House demands a greater sacrifice." });
      const prompt = `Create an original cinematic dark-surreal horror image for GPT Image 2. Treat the visitor's fragment as a frame from an obscure underground analog horror film: surrealism first, psychologically uncanny, tactile and photographic rather than polished CGI. Combine grotesque body horror, decaying religious imagery, organic architecture, ritual symbolism, impossible dream geometry, and quiet dread. Use wet fleshy textures, teeth, mouths, bone-like forms, rotting fabric, wax, rust, handmade practical-effects materials, and unexplained symbolic details. Compose with deliberate cinematic lighting, a strong filmic camera angle, layered depth, restrained visual storytelling, and a solemn stillness. Use muted burgundy, brown, dirty ochre, black, sickly green, dim candlelight, a weak cyan television glow, deep shadows, soft focus, heavy 1970s/1980s film grain, faded colors, slight lens distortion, dark vignette, and aged analog-film texture. Keep it original, atmospheric, unsettling, and non-graphic; favor implication over explicit gore. Render this visitor's dream fragment as a high-quality archival photograph: ${input.dreamText.trim()}`;
      try {
        const generated = await generateImage({ prompt, model: "MODEL_GPT_IMAGE_2", quality: "medium" });
        if (!generated.url) throw new Error("The image did not return from the dark.");
        const dream = await createGeneratedDream({ userId: ctx.user.id, title: input.title.trim(), prompt, imageUrl: generated.url, createdAt: new Date() });
        return { dream, offerings: spent.user?.offerings ?? 0 };
      } catch (error) {
        await restoreOfferings(ctx.user.id, cost, "The House returned the offering after the image failed to arrive");
        throw error;
      }
    }),
  }),
  specimens: router({
    unlocks: protectedProcedure.input(z.object({ specimenSlug: z.string().min(1) })).query(({ input, ctx }) => listSpecimenUnlocks(ctx.user.id, input.specimenSlug)),
    unlock: protectedProcedure.input(z.object({ specimenSlug: z.string().min(1), kind: z.enum(["story", "video", "audio"]) })).mutation(async ({ input, ctx }) => {
      const existing = await listSpecimenUnlocks(ctx.user.id, input.specimenSlug);
      if (existing.some((entry) => entry.kind === input.kind)) return { unlocked: true as const, offerings: ctx.user.offerings };
      const cost = input.kind === "story" ? 50 : 150;
      const spent = await spendOfferings(ctx.user.id, cost, `Exposed the hidden archive: ${input.specimenSlug} / ${input.kind}`);
      if (!spent.accepted) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The House demands a greater sacrifice." });
      await createSpecimenUnlock({ userId: ctx.user.id, specimenSlug: input.specimenSlug, kind: input.kind, createdAt: new Date() });
      return { unlocked: true as const, offerings: spent.user?.offerings ?? 0 };
    }),
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
    })).mutation(async ({ input, ctx }) => {
      let imageUrl: string | null = null;
      let imageKey: string | null = null;
      if (input.imageData) {
        const bytes = Buffer.from(input.imageData, "base64");
        if (bytes.byteLength > 12 * 1024 * 1024) throw new Error("Specimen images must be 12MB or smaller.");
        const asset = await storagePut(`submissions/${Date.now()}-${(input.imageName || "specimen.jpg").replace(/[^a-zA-Z0-9._-]/g, "-")}`, bytes, input.imageContentType || "image/jpeg");
        imageUrl = asset.url;
        imageKey = asset.key;
      }
      const submission = await createCuratorSubmission({ userId: ctx.user?.id, name: input.name.trim(), email: input.email.trim().toLowerCase(), category: input.category, title: input.title.trim(), description: input.description.trim(), imageUrl, imageKey, recipient: "curator@veilhouse.monster" });
      try { await notifyOwner({ title: `New Veilhouse specimen: ${submission?.title || input.title}`, content: `Route this submission to curator@veilhouse.monster.\n\nFrom: ${input.name} <${input.email}>\nCategory: ${input.category}\nTitle: ${input.title}\n\n${input.description}${imageUrl ? `\n\nImage: ${imageUrl}` : "\n\nNo image attached."}` }); } catch (error) { console.warn("[Submissions] Stored submission but notification delivery was unavailable:", error); }
      return { accepted: true, recipient: "curator@veilhouse.monster", id: submission?.id, imageUrl } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
