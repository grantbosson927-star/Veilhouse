import type { Request, Response } from "express";
import { createCuratorRevision, getCuratorPostByScheduleTaskUid, listDueCuratorPosts, updateCuratorPost } from "./db";
import { sdk } from "./_core/sdk";

export async function publishDueCuratorPosts() {
  const due = await listDueCuratorPosts();
  for (const post of due) {
    const publishedAt = new Date();
    await updateCuratorPost(post.id, { status: "published", publishedAt, scheduleCronTaskUid: null, scheduledFor: null });
    await createCuratorRevision({
      postId: post.id,
      authorId: post.authorId,
      title: post.title,
      category: post.category,
      excerpt: post.excerpt,
      story: post.story,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      status: "published",
    });
  }
  return due.length;
}

export async function publishCuratorPostHandler(req: Request, res: Response) {
  const timestamp = new Date().toISOString();
  let user;
  try {
    user = await sdk.authenticateRequest(req);
  } catch {
    return res.status(403).json({ error: "cron-only" });
  }

  if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });

  try {
    const post = await getCuratorPostByScheduleTaskUid(user.taskUid);
    if (!post) return res.json({ ok: true, skipped: "orphan" });
    if (post.status === "published") return res.json({ ok: true, skipped: "already-published", postId: post.id });

    const publishedAt = new Date();
    await updateCuratorPost(post.id, { status: "published", publishedAt, scheduleCronTaskUid: null, scheduledFor: null });
    await createCuratorRevision({ postId: post.id, authorId: post.authorId, title: post.title, category: post.category, excerpt: post.excerpt, story: post.story, imageUrl: post.imageUrl, videoUrl: post.videoUrl, status: "published" });
    return res.json({ ok: true, postId: post.id, publishedAt: timestamp });
  } catch (error) {
    return res.status(500).json({ error: String(error), timestamp, context: { url: req.originalUrl, taskUid: user.taskUid } });
  }
}
