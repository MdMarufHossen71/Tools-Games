import { and, desc, eq, gt, like, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { aiConversations, blogArticles, blogLikes, clipboardItems, dailyChallengeScores, friendships, gameProgress, InsertUser, leaderboardEntries, multiplayerRoomMembers, multiplayerRoomMessages, multiplayerRooms, notes, noteVersions, platformConfig, savedTools, sharedFiles, shortLinks, usefulLinks, userSettings, users, vaultEntries } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { blogSeeds } from "./blogSeed";
import { newOpaqueToken, openAtRest, sealAtRest } from "./security";
import { advanceGameStreak } from "./gameStreak";
import { normalizeGameSession } from "./gameSession";
import { dailyChallengeFor, readDailyChallenge, utcDateKey } from "./dailyChallenge";
import { normalizeUsefulLink, type UsefulLinkInput } from "./usefulLinks";
let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() { if (!_db && process.env.DATABASE_URL) { try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; } } return _db; }
export async function upsertUser(user: InsertUser): Promise<void> { if (!user.openId) throw new Error("User openId is required for upsert"); const db = await getDb(); if (!db) return; const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() }; const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn }; const nullableFields = ["name", "email", "username", "avatar", "bio", "loginMethod"] as const; for (const field of nullableFields) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } } values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"); updateSet.role = values.role; await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet }); }
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0]; }
export async function isUserSuspended(openId: string) { return Boolean((await getUserByOpenId(openId))?.isSuspended); }
export function settingsResult<T>(setting: T | undefined): T | null { return setting ?? null; }
export async function getUserSettings(userId: number) { const db = await getDb(); if (!db) return null; return settingsResult((await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1))[0]); }
export async function saveUserSettings(userId: number, values: { language: "en" | "bn" | "hi" | "ur" | "ar" | "es" | "fr" | "de"; appearance: string; customColors?: unknown }) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(userSettings).values({ userId, language: values.language, appearance: values.appearance, customColors: values.customColors }).onDuplicateKeyUpdate({ set: { language: values.language, appearance: values.appearance, customColors: values.customColors } }); return getUserSettings(userId); }

export function profileStreakFromResources(resources: unknown) {
  if (!resources || typeof resources !== "object") return 0;
  const streak = (resources as { gameStreak?: { current?: unknown } }).gameStreak?.current;
  return typeof streak === "number" && Number.isInteger(streak) && streak >= 0 ? streak : 0;
}

export async function getProfileSummary(userId: number) {
  const db = await getDb();
  if (!db) return { savedTools: 0, games: 0, notes: 0, streak: 0 };
  const [[saved], [games], [noteCount], progress] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(savedTools).where(eq(savedTools.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(gameProgress).where(eq(gameProgress.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(notes).where(eq(notes.userId, userId)),
    db.select({ resources: gameProgress.resources }).from(gameProgress).where(eq(gameProgress.userId, userId)),
  ]);
  return { savedTools: Number(saved.count), games: Number(games.count), notes: Number(noteCount.count), streak: Math.max(0, ...progress.map(row => profileStreakFromResources(row.resources))) };
}

export async function getAdminDashboard() {
  const db = await getDb();
  if (!db) return { users: 0, activeUsers24h: 0, suspendedUsers: 0, articles: 0, usefulLinks: 0, sharedFiles: 0, storageBytes: 0, shortLinks: 0, openRooms: 0 };
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [[userCount], [activeCount], [suspendedCount], [articleCount], [linkCount], [fileStats], [shortLinkCount], [openRoomCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(users).where(gt(users.lastSignedIn, dayAgo)),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isSuspended, true)),
    db.select({ count: sql<number>`count(*)` }).from(blogArticles),
    db.select({ count: sql<number>`count(*)` }).from(usefulLinks),
    db.select({ count: sql<number>`count(*)`, bytes: sql<number>`coalesce(sum(${sharedFiles.size}), 0)` }).from(sharedFiles),
    db.select({ count: sql<number>`count(*)` }).from(shortLinks),
    db.select({ count: sql<number>`count(*)` }).from(multiplayerRooms).where(or(eq(multiplayerRooms.status, "open"), eq(multiplayerRooms.status, "active"))),
  ]);
  return {
    users: Number(userCount.count), activeUsers24h: Number(activeCount.count), suspendedUsers: Number(suspendedCount.count), articles: Number(articleCount.count), usefulLinks: Number(linkCount.count), sharedFiles: Number(fileStats.count), storageBytes: Number(fileStats.bytes), shortLinks: Number(shortLinkCount.count), openRooms: Number(openRoomCount.count),
  };
}

export async function listAdminUsers(query?: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const term = query?.trim().slice(0, 80);
  const condition = term ? or(like(users.name, `%${term}%`), like(users.email, `%${term}%`), like(users.username, `%${term}%`), like(users.openId, `%${term}%`)) : sql`1 = 1`;
  return db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, username: users.username, avatar: users.avatar, role: users.role, isSuspended: users.isSuspended, suspendedAt: users.suspendedAt, suspensionReason: users.suspensionReason, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(condition).orderBy(desc(users.lastSignedIn)).limit(limit);
}

export async function setUserSuspension(actorId: number, userId: number, isSuspended: boolean, reason?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const target = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!target) throw new Error("User not found");
  if (target.id === actorId || target.openId === ENV.ownerOpenId || target.role === "admin") throw new Error("Administrator accounts cannot be suspended here");
  const values = { isSuspended, suspendedAt: isSuspended ? new Date() : null, suspensionReason: isSuspended ? (reason?.trim().slice(0, 240) || null) : null };
  await db.update(users).set(values).where(eq(users.id, userId));
  return (await db.select({ id: users.id, isSuspended: users.isSuspended, suspendedAt: users.suspendedAt, suspensionReason: users.suspensionReason }).from(users).where(eq(users.id, userId)).limit(1))[0];
}

export function canonicalFriendPair(firstUserId: number, secondUserId: number) {
  if (!Number.isInteger(firstUserId) || !Number.isInteger(secondUserId) || firstUserId <= 0 || secondUserId <= 0 || firstUserId === secondUserId) throw new Error("A friendship needs two distinct accounts");
  return firstUserId < secondUserId ? { userId1: firstUserId, userId2: secondUserId } : { userId1: secondUserId, userId2: firstUserId };
}

export async function listFriendRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(friendships).where(or(eq(friendships.userId1, userId), eq(friendships.userId2, userId))).orderBy(desc(friendships.createdAt));
}

export async function requestFriendRecord(userId: number, targetUserId: number) {
  const pair = canonicalFriendPair(userId, targetUserId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const target = (await db.select({ id: users.id, isSuspended: users.isSuspended }).from(users).where(eq(users.id, targetUserId)).limit(1))[0];
  if (!target || target.isSuspended) throw new Error("This account cannot receive friend requests");
  const existing = (await db.select().from(friendships).where(and(eq(friendships.userId1, pair.userId1), eq(friendships.userId2, pair.userId2))).limit(1))[0];
  if (existing) return existing;
  await db.insert(friendships).values(pair);
  return (await db.select().from(friendships).where(and(eq(friendships.userId1, pair.userId1), eq(friendships.userId2, pair.userId2))).limit(1))[0];
}

export async function respondToFriendRecord(userId: number, friendshipId: number, accept: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const record = (await db.select().from(friendships).where(eq(friendships.id, friendshipId)).limit(1))[0];
  if (!record || (record.userId1 !== userId && record.userId2 !== userId)) throw new Error("Friend record not found");
  if (record.status !== "pending") return record;
  if (!accept) { await db.delete(friendships).where(eq(friendships.id, friendshipId)); return { ...record, status: "blocked" as const }; }
  await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, friendshipId));
  return (await db.select().from(friendships).where(eq(friendships.id, friendshipId)).limit(1))[0];
}

export async function listUsefulLinks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(usefulLinks).orderBy(usefulLinks.section, usefulLinks.category, usefulLinks.name);
}

export async function saveUsefulLink(input: UsefulLinkInput & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const record = normalizeUsefulLink(input);
  if (input.id) {
    await db.update(usefulLinks).set(record).where(eq(usefulLinks.id, input.id));
    return (await db.select().from(usefulLinks).where(eq(usefulLinks.id, input.id)).limit(1))[0];
  }
  await db.insert(usefulLinks).values(record).onDuplicateKeyUpdate({ set: record });
  return (await db.select().from(usefulLinks).where(eq(usefulLinks.urlHash, record.urlHash)).limit(1))[0];
}

export async function bulkUpsertUsefulLinks(inputs: UsefulLinkInput[]) {
  if (inputs.length > 2_500) throw new Error("A bulk import may contain at most 2,500 links");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  let imported = 0;
  for (const input of inputs) {
    const record = normalizeUsefulLink(input);
    await db.insert(usefulLinks).values(record).onDuplicateKeyUpdate({ set: record });
    imported += 1;
  }
  return { imported };
}

export async function deleteUsefulLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(usefulLinks).where(eq(usefulLinks.id, id));
  return { deleted: true };
}

async function ensureBlogSeeds() {
  const db = await getDb();
  if (!db) return null;
  await db.update(blogArticles).set({ status: "published", publishedAt: new Date() }).where(and(eq(blogArticles.status, "scheduled"), lte(blogArticles.scheduledAt, new Date())));
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(blogArticles);
  if (Number(count) === 0) {
    await db.insert(blogArticles).values(blogSeeds.map((article) => ({
      ...article,
      authorName: "ToolsHUB Team",
      status: "published" as const,
    })));
  }
  return db;
}

export async function listPublishedArticles(filters?: { query?: string; category?: string; author?: string }) {
  const db = await ensureBlogSeeds();
  if (!db) return [];
  const now = new Date();
  const conditions = [eq(blogArticles.status, "published"), lte(blogArticles.publishedAt, now)];
  if (filters?.query?.trim()) {
    const term = `%${filters.query.trim().slice(0, 80)}%`;
    conditions.push(or(like(blogArticles.title, term), like(blogArticles.excerpt, term), like(blogArticles.content, term))!);
  }
  if (filters?.author?.trim()) conditions.push(eq(blogArticles.authorName, filters.author.trim().slice(0, 120)));
  if (filters?.category?.trim()) conditions.push(like(blogArticles.categories, `%${filters.category.trim().slice(0, 60)}%`));
  return db.select().from(blogArticles).where(and(...conditions)).orderBy(desc(blogArticles.isFeatured), desc(blogArticles.publishedAt));
}

export async function getPublishedArticleBySlug(slug: string) {
  const db = await ensureBlogSeeds();
  if (!db) return undefined;
  return (await db.select().from(blogArticles).where(and(eq(blogArticles.slug, slug), eq(blogArticles.status, "published"))).limit(1))[0];
}

export async function getArticleLikeState(articleId: number, userId?: number) {
  const db = await getDb();
  if (!db) return { count: 0, liked: false };
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(blogLikes).where(eq(blogLikes.articleId, articleId));
  const liked = userId ? (await db.select({ id: blogLikes.id }).from(blogLikes).where(and(eq(blogLikes.articleId, articleId), eq(blogLikes.userId, userId))).limit(1)).length > 0 : false;
  return { count: Number(count), liked };
}

export async function toggleArticleLike(articleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: blogLikes.id }).from(blogLikes).where(and(eq(blogLikes.articleId, articleId), eq(blogLikes.userId, userId))).limit(1);
  if (existing[0]) await db.delete(blogLikes).where(eq(blogLikes.id, existing[0].id));
  else await db.insert(blogLikes).values({ articleId, userId });
  return getArticleLikeState(articleId, userId);
}

export type BlogArticleInput = {
  id?: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  language: string;
  coverImage?: string | null;
  categories: string[];
  tags: string[];
  status: "draft" | "scheduled" | "published";
  isFeatured: boolean;
  isPinnedHome: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  readingMinutes: number;
  publishedAt?: Date | null;
  scheduledAt?: Date | null;
};

export async function listBlogArticlesForAdmin() {
  const db = await ensureBlogSeeds();
  if (!db) return [];
  return db.select().from(blogArticles).orderBy(desc(blogArticles.updatedAt));
}

export async function saveBlogArticle(authorId: number, authorName: string | null, input: BlogArticleInput) {
  const db = await ensureBlogSeeds();
  if (!db) throw new Error("Database unavailable");
  if (input.isPinnedHome) {
    const pinned = await db.select({ id: blogArticles.id }).from(blogArticles).where(input.id ? and(eq(blogArticles.isPinnedHome, true), ne(blogArticles.id, input.id)) : eq(blogArticles.isPinnedHome, true));
    if (pinned.length >= 3) throw new Error("Only three articles can be pinned to the homepage");
  }
  const publicationDate = input.status === "published" ? input.publishedAt ?? new Date() : input.publishedAt ?? null;
  const scheduleDate = input.status === "scheduled" ? input.scheduledAt ?? new Date(Date.now() + 60_000) : null;
  const values = { ...input, authorId, authorName: authorName || "ToolsHUB Team", publishedAt: publicationDate, scheduledAt: scheduleDate };
  if (input.id) {
    await db.update(blogArticles).set(values).where(eq(blogArticles.id, input.id));
    return (await db.select().from(blogArticles).where(eq(blogArticles.id, input.id)).limit(1))[0];
  }
  const result = await db.insert(blogArticles).values(values);
  return (await db.select().from(blogArticles).where(eq(blogArticles.id, Number(result[0].insertId))).limit(1))[0];
}

type FileShareMetadata = { fileKey: string; name: string; mimeType: string | null };

function readShareMetadata(row: typeof sharedFiles.$inferSelect): FileShareMetadata | null {
  if (!row.metadataCiphertext) return null;
  try { return openAtRest<FileShareMetadata>(row.metadataCiphertext); } catch { return null; }
}

export async function createEncryptedFileShare(input: {
  uploaderId: number;
  fileKey: string;
  name: string;
  mimeType: string | null;
  size: number;
  tokenHash: string;
  passwordHash: string | null;
  expiryAt: Date | null;
  maxDownloads: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const metadataCiphertext = sealAtRest({ fileKey: input.fileKey, name: input.name, mimeType: input.mimeType });
  const result = await db.insert(sharedFiles).values({
    uploaderId: input.uploaderId,
    fileKey: `sealed:${input.tokenHash}`,
    name: "Encrypted file metadata",
    mimeType: null,
    size: input.size,
    shareToken: input.tokenHash,
    metadataCiphertext,
    passwordHash: input.passwordHash,
    expiryAt: input.expiryAt,
    maxDownloads: input.maxDownloads,
  });
  return (await db.select().from(sharedFiles).where(eq(sharedFiles.id, Number(result[0].insertId))).limit(1))[0];
}

export async function getFileShareByTokenHash(tokenHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(sharedFiles).where(eq(sharedFiles.shareToken, tokenHash)).limit(1))[0];
}

export async function consumeFileShare(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(sharedFiles).set({ downloadCount: sql`${sharedFiles.downloadCount} + 1` }).where(eq(sharedFiles.id, id));
}

export async function listEncryptedFileShares(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(sharedFiles).where(eq(sharedFiles.uploaderId, userId)).orderBy(desc(sharedFiles.createdAt));
  return rows.map((row) => {
    const metadata = readShareMetadata(row);
    return { id: row.id, name: metadata?.name ?? "Unavailable encrypted file", mimeType: metadata?.mimeType ?? null, size: row.size, expiryAt: row.expiryAt, maxDownloads: row.maxDownloads, downloadCount: row.downloadCount, createdAt: row.createdAt, isPasswordProtected: Boolean(row.passwordHash) };
  });
}

export function decryptedFileShareMetadata(row: typeof sharedFiles.$inferSelect) { return readShareMetadata(row); }

export async function createClipboardItem(input: { userId: number; deviceId?: string | null; title?: string | null; content: string; category: "text" | "password" | "code" | "link"; isPinned?: boolean; expiresAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(clipboardItems).values({ userId: input.userId, deviceId: input.deviceId ?? null, title: input.title ?? null, contentCiphertext: sealAtRest({ content: input.content }), category: input.category, isPinned: input.isPinned ?? false, expiresAt: input.expiresAt ?? null });
  return (await db.select().from(clipboardItems).where(eq(clipboardItems.id, Number(result[0].insertId))).limit(1))[0];
}

export async function listClipboardItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(clipboardItems).where(eq(clipboardItems.userId, userId)).orderBy(desc(clipboardItems.isPinned), desc(clipboardItems.createdAt));
  return rows.filter((row) => !row.expiresAt || row.expiresAt > new Date()).map((row) => {
    let content = "";
    try { content = openAtRest<{ content: string }>(row.contentCiphertext).content; } catch { content = "[Encrypted clipboard item unavailable]"; }
    return { ...row, content, contentCiphertext: undefined };
  });
}

export async function deleteClipboardItem(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(clipboardItems).where(and(eq(clipboardItems.id, id), eq(clipboardItems.userId, userId)));
}

export async function listUserNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.isPinned), desc(notes.updatedAt));
}

export async function listUserNoteVersions(userId: number, noteId: number) {
  const db = await getDb();
  if (!db) return [];
  const ownedNote = (await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId))).limit(1))[0];
  if (!ownedNote) return [];
  return db.select().from(noteVersions).where(eq(noteVersions.noteId, noteId)).orderBy(desc(noteVersions.version));
}

export async function saveUserNote(input: { id?: number; userId: number; folderId?: string | null; title: string; content?: string | null; tags: string[]; color: string; isPinned: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.id) {
    const existing = (await db.select().from(notes).where(and(eq(notes.id, input.id), eq(notes.userId, input.userId))).limit(1))[0];
    if (!existing) throw new Error("Note not found");
    const [{ maxVersion }] = await db.select({ maxVersion: sql<number>`coalesce(max(${noteVersions.version}), 0)` }).from(noteVersions).where(eq(noteVersions.noteId, input.id));
    await db.insert(noteVersions).values({ noteId: input.id, version: Number(maxVersion) + 1, title: existing.title, content: existing.content });
    await db.update(notes).set({ folderId: input.folderId ?? null, title: input.title, content: input.content ?? null, tags: input.tags, color: input.color, isPinned: input.isPinned }).where(eq(notes.id, input.id));
    return (await db.select().from(notes).where(eq(notes.id, input.id)).limit(1))[0];
  }
  const result = await db.insert(notes).values({ userId: input.userId, folderId: input.folderId ?? null, title: input.title, content: input.content ?? null, tags: input.tags, color: input.color, isPinned: input.isPinned });
  return (await db.select().from(notes).where(eq(notes.id, Number(result[0].insertId))).limit(1))[0];
}

export async function deleteUserNote(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
}

export async function listVaultEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vaultEntries).where(eq(vaultEntries.userId, userId)).orderBy(desc(vaultEntries.updatedAt));
}

export async function saveVaultEntry(input: { id?: number; userId: number; title: string; kind: "login" | "card" | "secure_note"; ciphertext: string; iv: string; salt: string; cryptoVersion: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.id) {
    await db.update(vaultEntries).set({ title: input.title, kind: input.kind, ciphertext: input.ciphertext, iv: input.iv, salt: input.salt, cryptoVersion: input.cryptoVersion }).where(and(eq(vaultEntries.id, input.id), eq(vaultEntries.userId, input.userId)));
    return (await db.select().from(vaultEntries).where(and(eq(vaultEntries.id, input.id), eq(vaultEntries.userId, input.userId))).limit(1))[0];
  }
  const result = await db.insert(vaultEntries).values({ userId: input.userId, title: input.title, kind: input.kind, ciphertext: input.ciphertext, iv: input.iv, salt: input.salt, cryptoVersion: input.cryptoVersion });
  return (await db.select().from(vaultEntries).where(eq(vaultEntries.id, Number(result[0].insertId))).limit(1))[0];
}

export async function deleteVaultEntry(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(vaultEntries).where(and(eq(vaultEntries.id, id), eq(vaultEntries.userId, userId)));
}

export async function createEncryptedShortLink(input: { ownerId: number; alias: string; targetUrl: string; passwordHash: string | null; expiryAt: Date | null; clickLimit: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(shortLinks).values({ ownerId: input.ownerId, alias: input.alias, targetUrlCiphertext: sealAtRest({ targetUrl: input.targetUrl }), passwordCiphertext: input.passwordHash, expiryAt: input.expiryAt, clickLimit: input.clickLimit });
  return (await db.select().from(shortLinks).where(eq(shortLinks.alias, input.alias)).limit(1))[0];
}

export async function listShortLinks(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(shortLinks).where(eq(shortLinks.ownerId, ownerId)).orderBy(desc(shortLinks.createdAt));
  return rows.map((row) => ({ id: row.id, alias: row.alias, expiryAt: row.expiryAt, clickLimit: row.clickLimit, clickCount: row.clickCount, createdAt: row.createdAt, isPasswordProtected: Boolean(row.passwordCiphertext) }));
}

export async function deleteUserShortLink(ownerId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(shortLinks).where(and(eq(shortLinks.id, id), eq(shortLinks.ownerId, ownerId)));
}

export async function resolveShortLink(alias: string) {
  const db = await getDb();
  if (!db) return undefined;
  const row = (await db.select().from(shortLinks).where(eq(shortLinks.alias, alias)).limit(1))[0];
  if (!row || (row.expiryAt && row.expiryAt < new Date()) || (row.clickLimit !== null && row.clickCount >= row.clickLimit)) return undefined;
  try { return { row, targetUrl: openAtRest<{ targetUrl: string }>(row.targetUrlCiphertext).targetUrl }; } catch { return undefined; }
}

export async function consumeShortLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(shortLinks).set({ clickCount: sql`${shortLinks.clickCount} + 1` }).where(eq(shortLinks.id, id));
}

export type PublicPlatformConfig = { hiddenToolSlugs: string[]; announcement: { enabled: boolean; message: string } | null };

async function readPlatformConfigValue(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(platformConfig).where(eq(platformConfig.configKey, key)).limit(1))[0]?.configValue;
}

export async function savePlatformConfigValue(key: string, value: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(platformConfig).values({ configKey: key, configValue: value }).onDuplicateKeyUpdate({ set: { configValue: value } });
}

function parseHiddenToolSlugs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((slug): slug is string => typeof slug === "string" && /^[a-z0-9-]{2,120}$/.test(slug)))).slice(0, 300);
}

function parseAnnouncement(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return record.enabled === true && typeof record.message === "string" && record.message.trim() ? { enabled: true, message: record.message.trim().slice(0, 280) } : null;
}

export async function getPublicPlatformConfig(): Promise<PublicPlatformConfig> {
  const [hiddenToolSlugs, announcement] = await Promise.all([readPlatformConfigValue("hidden_tool_slugs"), readPlatformConfigValue("site_announcement")]);
  return { hiddenToolSlugs: parseHiddenToolSlugs(hiddenToolSlugs), announcement: parseAnnouncement(announcement) };
}

export async function listAdminFileShares(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(sharedFiles).orderBy(desc(sharedFiles.createdAt)).limit(limit);
  return rows.map((row) => {
    const metadata = readShareMetadata(row);
    return { id: row.id, uploaderId: row.uploaderId, name: metadata?.name ?? "Unavailable encrypted file", size: row.size, expiryAt: row.expiryAt, maxDownloads: row.maxDownloads, downloadCount: row.downloadCount, createdAt: row.createdAt, isPasswordProtected: Boolean(row.passwordHash) };
  });
}

export async function revokeAdminFileShare(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(sharedFiles).set({ expiryAt: new Date() }).where(eq(sharedFiles.id, id));
}

export async function listAdminShortLinks(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(shortLinks).orderBy(desc(shortLinks.createdAt)).limit(limit);
  return rows.map((row) => ({ id: row.id, ownerId: row.ownerId, alias: row.alias, expiryAt: row.expiryAt, clickLimit: row.clickLimit, clickCount: row.clickCount, createdAt: row.createdAt, isPasswordProtected: Boolean(row.passwordCiphertext) }));
}

export async function revokeAdminShortLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(shortLinks).set({ expiryAt: new Date() }).where(eq(shortLinks.id, id));
}

export type AiConversationMessage = { role: "user" | "assistant"; content: string };

export async function createAiConversation(input: { ownerId: number; title: string; messages?: AiConversationMessage[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(aiConversations).values({ userId: input.ownerId, title: input.title.slice(0, 120), messages: input.messages ?? [] });
  return (await db.select().from(aiConversations).where(eq(aiConversations.id, Number(result[0].insertId))).limit(1))[0];
}

export async function listAiConversations(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: aiConversations.id, title: aiConversations.title, createdAt: aiConversations.createdAt, updatedAt: aiConversations.updatedAt })
    .from(aiConversations).where(eq(aiConversations.userId, ownerId)).orderBy(desc(aiConversations.updatedAt));
}

export async function getAiConversation(ownerId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(aiConversations).where(and(eq(aiConversations.id, id), eq(aiConversations.userId, ownerId))).limit(1))[0];
}

export async function updateAiConversation(ownerId: number, id: number, input: { title?: string; messages?: AiConversationMessage[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await getAiConversation(ownerId, id);
  if (!current) return undefined;
  await db.update(aiConversations).set({
    ...(input.title !== undefined ? { title: input.title.slice(0, 120) } : {}),
    ...(input.messages !== undefined ? { messages: input.messages } : {}),
    updatedAt: new Date(),
  }).where(and(eq(aiConversations.id, id), eq(aiConversations.userId, ownerId)));
  return getAiConversation(ownerId, id);
}

export async function deleteAiConversation(ownerId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(aiConversations).where(and(eq(aiConversations.id, id), eq(aiConversations.userId, ownerId)));
}

export async function getGameProgress(userId: number, gameSlug: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(gameProgress).where(and(eq(gameProgress.userId, userId), eq(gameProgress.gameSlug, gameSlug))).limit(1))[0];
}

export async function saveGameScore(input: { userId: number; gameSlug: string; score: number; level?: number; deviceType?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await getGameProgress(input.userId, input.gameSlug);
  const bestScore = Math.max(current?.bestScore ?? 0, input.score);
  const resources = { ...(current?.resources && typeof current.resources === "object" ? current.resources : {}), ...advanceGameStreak(current?.resources) };
  await db.insert(gameProgress).values({ userId: input.userId, gameSlug: input.gameSlug, bestScore, level: Math.max(current?.level ?? 1, input.level ?? 1), resources, deviceType: input.deviceType?.slice(0, 24) ?? null }).onDuplicateKeyUpdate({ set: { bestScore, level: Math.max(current?.level ?? 1, input.level ?? 1), resources, deviceType: input.deviceType?.slice(0, 24) ?? null, updatedAt: new Date() } });
  if (input.score >= (current?.bestScore ?? 0) && input.score > 0) {
    await db.delete(leaderboardEntries).where(and(eq(leaderboardEntries.gameSlug, input.gameSlug), eq(leaderboardEntries.userId, input.userId)));
    await db.insert(leaderboardEntries).values({ gameSlug: input.gameSlug, userId: input.userId, score: input.score });
  }
  const challenge = readDailyChallenge((await getDailyChallenge())?.configValue);
  if (input.score > 0 && challenge?.dateKey === utcDateKey() && challenge.gameSlug === input.gameSlug) await saveDailyChallengeScore({ userId: input.userId, gameSlug: input.gameSlug, dateKey: challenge.dateKey, score: input.score });
  return getGameProgress(input.userId, input.gameSlug);
}

export async function saveDailyChallengeScore(input: { userId: number; gameSlug: string; dateKey: string; score: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = (await db.select().from(dailyChallengeScores).where(and(eq(dailyChallengeScores.userId, input.userId), eq(dailyChallengeScores.gameSlug, input.gameSlug), eq(dailyChallengeScores.dateKey, input.dateKey))).limit(1))[0];
  if (!existing || input.score >= existing.score) await db.insert(dailyChallengeScores).values(input).onDuplicateKeyUpdate({ set: { score: input.score, achievedAt: new Date() } });
}

export async function getDailyChallengeLeaderboard(userId?: number) {
  const challenge = readDailyChallenge((await getDailyChallenge())?.configValue) ?? dailyChallengeFor(utcDateKey());
  const db = await getDb();
  if (!db) return { challenge, entries: [], you: null };
  const entries = await db.select({ userId: dailyChallengeScores.userId, score: dailyChallengeScores.score, achievedAt: dailyChallengeScores.achievedAt }).from(dailyChallengeScores).where(and(eq(dailyChallengeScores.dateKey, challenge.dateKey), eq(dailyChallengeScores.gameSlug, challenge.gameSlug))).orderBy(desc(dailyChallengeScores.score), desc(dailyChallengeScores.achievedAt)).limit(100);
  const yours = userId ? entries.find((entry) => entry.userId === userId) ?? (await db.select({ userId: dailyChallengeScores.userId, score: dailyChallengeScores.score, achievedAt: dailyChallengeScores.achievedAt }).from(dailyChallengeScores).where(and(eq(dailyChallengeScores.dateKey, challenge.dateKey), eq(dailyChallengeScores.gameSlug, challenge.gameSlug), eq(dailyChallengeScores.userId, userId))).limit(1))[0] : undefined;
  const [{ higher }] = yours ? await db.select({ higher: sql<number>`count(*)` }).from(dailyChallengeScores).where(and(eq(dailyChallengeScores.dateKey, challenge.dateKey), eq(dailyChallengeScores.gameSlug, challenge.gameSlug), gt(dailyChallengeScores.score, yours.score))) : [{ higher: 0 }];
  return { challenge, entries: entries.map((entry, index) => ({ ...entry, rank: index + 1 })), you: yours ? { ...yours, rank: Number(higher) + 1 } : null };
}

export async function saveGameSession(input: { userId: number; gameSlug: string; session: unknown; deviceType?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const session = normalizeGameSession(input.session);
  if (!session) throw new Error("Invalid game session");
  const current = await getGameProgress(input.userId, input.gameSlug);
  const resources = { ...(current?.resources && typeof current.resources === "object" ? current.resources : {}), session };
  await db.insert(gameProgress).values({ userId: input.userId, gameSlug: input.gameSlug, bestScore: current?.bestScore ?? 0, level: current?.level ?? 1, resources, deviceType: input.deviceType?.slice(0, 24) ?? null }).onDuplicateKeyUpdate({ set: { resources, deviceType: input.deviceType?.slice(0, 24) ?? null, updatedAt: new Date() } });
  return getGameProgress(input.userId, input.gameSlug);
}

export async function getGameLeaderboard(gameSlug: string, userId?: number) {
  const db = await getDb();
  if (!db) return { entries: [], you: null };
  const entries = await db.select({ userId: leaderboardEntries.userId, score: leaderboardEntries.score, achievedAt: leaderboardEntries.achievedAt }).from(leaderboardEntries).where(eq(leaderboardEntries.gameSlug, gameSlug)).orderBy(desc(leaderboardEntries.score), desc(leaderboardEntries.achievedAt)).limit(100);
  if (!userId) return { entries: entries.map((entry, index) => ({ ...entry, rank: index + 1 })), you: null };
  const yours = entries.find((entry) => entry.userId === userId) ?? (await db.select({ userId: leaderboardEntries.userId, score: leaderboardEntries.score, achievedAt: leaderboardEntries.achievedAt }).from(leaderboardEntries).where(and(eq(leaderboardEntries.gameSlug, gameSlug), eq(leaderboardEntries.userId, userId))).limit(1))[0];
  const [{ higher }] = yours ? await db.select({ higher: sql<number>`count(*)` }).from(leaderboardEntries).where(and(eq(leaderboardEntries.gameSlug, gameSlug), gt(leaderboardEntries.score, yours.score))) : [{ higher: 0 }];
  return { entries: entries.map((entry, index) => ({ ...entry, rank: index + 1 })), you: yours ? { ...yours, rank: Number(higher) + 1 } : null };
}

const ROOM_TTL_MS = 30 * 60 * 1000;
const roomExpiry = () => new Date(Date.now() + ROOM_TTL_MS);

async function expireInactiveMultiplayerRooms() {
  const db = await getDb();
  if (!db) return;
  const nowCondition = sql`${multiplayerRooms.expiresAt} <= NOW()`;
  await db.update(multiplayerRooms).set({ status: "expired" }).where(and(nowCondition, eq(multiplayerRooms.status, "open")));
  await db.update(multiplayerRooms).set({ status: "expired" }).where(and(nowCondition, eq(multiplayerRooms.status, "active")));
}

async function roomForToken(roomToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(multiplayerRooms).where(eq(multiplayerRooms.roomToken, roomToken)).limit(1))[0];
}

async function roomMember(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(multiplayerRoomMembers).where(and(eq(multiplayerRoomMembers.roomId, roomId), eq(multiplayerRoomMembers.userId, userId))).limit(1))[0];
}

export async function createMultiplayerRoom(input: { hostUserId: number; displayName: string; gameSlug: string; privacy: "public" | "private" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await expireInactiveMultiplayerRooms();
  const roomToken = newOpaqueToken();
  const now = new Date();
  await db.insert(multiplayerRooms).values({ roomToken, hostUserId: input.hostUserId, displayName: input.displayName.slice(0, 100), gameSlug: input.gameSlug, privacy: input.privacy, status: "open", lastActivityAt: now, expiresAt: roomExpiry() });
  const room = await roomForToken(roomToken);
  if (!room) throw new Error("Room creation failed");
  await db.insert(multiplayerRoomMembers).values({ roomId: room.id, userId: input.hostUserId, displayName: input.displayName.slice(0, 100), status: "ready", lastActivityAt: now });
  return room;
}

export async function listOpenMultiplayerRooms(gameSlug?: string) {
  const db = await getDb();
  if (!db) return [];
  await expireInactiveMultiplayerRooms();
  const conditions = [eq(multiplayerRooms.privacy, "public"), eq(multiplayerRooms.status, "open"), sql`${multiplayerRooms.expiresAt} > NOW()`];
  if (gameSlug) conditions.push(eq(multiplayerRooms.gameSlug, gameSlug));
  const rooms = await db.select().from(multiplayerRooms).where(and(...conditions)).orderBy(desc(multiplayerRooms.lastActivityAt)).limit(50);
  return Promise.all(rooms.map(async (room) => {
    const [{ memberCount }] = await db.select({ memberCount: sql<number>`count(*)` }).from(multiplayerRoomMembers).where(and(eq(multiplayerRoomMembers.roomId, room.id), sql`${multiplayerRoomMembers.status} <> 'left'`));
    return { ...room, memberCount: Number(memberCount) };
  }));
}

export async function joinMultiplayerRoom(input: { roomToken: string; userId: number; displayName: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await expireInactiveMultiplayerRooms();
  const room = await roomForToken(input.roomToken);
  if (!room || room.status === "expired" || room.status === "finished" || room.expiresAt <= new Date()) throw new Error("Room is unavailable");
  const [{ memberCount }] = await db.select({ memberCount: sql<number>`count(*)` }).from(multiplayerRoomMembers).where(and(eq(multiplayerRoomMembers.roomId, room.id), sql`${multiplayerRoomMembers.status} <> 'left'`));
  const existing = await roomMember(room.id, input.userId);
  if (!existing && Number(memberCount) >= 2) throw new Error("Room is full");
  const now = new Date();
  await db.insert(multiplayerRoomMembers).values({ roomId: room.id, userId: input.userId, displayName: input.displayName.slice(0, 100), status: "joined", lastActivityAt: now }).onDuplicateKeyUpdate({ set: { displayName: input.displayName.slice(0, 100), status: "joined", lastActivityAt: now } });
  await db.update(multiplayerRooms).set({ status: "active", lastActivityAt: now, expiresAt: roomExpiry() }).where(eq(multiplayerRooms.id, room.id));
  return { ...(await roomForToken(input.roomToken))!, memberCount: existing ? Number(memberCount) : Number(memberCount) + 1 };
}

export async function heartbeatMultiplayerRoom(input: { roomToken: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await expireInactiveMultiplayerRooms();
  const room = await roomForToken(input.roomToken);
  if (!room) throw new Error("Room is unavailable");
  if (!(await roomMember(room.id, input.userId))) throw new Error("Not a room participant");
  const now = new Date();
  await db.update(multiplayerRoomMembers).set({ lastActivityAt: now }).where(and(eq(multiplayerRoomMembers.roomId, room.id), eq(multiplayerRoomMembers.userId, input.userId)));
  await db.update(multiplayerRooms).set({ lastActivityAt: now, expiresAt: roomExpiry() }).where(eq(multiplayerRooms.id, room.id));
  return { expiresAt: roomExpiry() };
}

export async function getMultiplayerRoom(roomToken: string, userId: number) {
  const room = await roomForToken(roomToken);
  if (!room) return undefined;
  const member = await roomMember(room.id, userId);
  if (!member && room.privacy === "private") return undefined;
  const db = await getDb();
  if (!db) return undefined;
  const members = await db.select().from(multiplayerRoomMembers).where(and(eq(multiplayerRoomMembers.roomId, room.id), sql`${multiplayerRoomMembers.status} <> 'left'`)).orderBy(multiplayerRoomMembers.joinedAt);
  return { ...room, members };
}

export async function listMultiplayerRoomMessages(roomToken: string, userId: number) {
  const room = await roomForToken(roomToken);
  if (!room || !(await roomMember(room.id, userId))) throw new Error("Room access denied");
  const db = await getDb();
  if (!db) return [];
  return db.select().from(multiplayerRoomMessages).where(eq(multiplayerRoomMessages.roomId, room.id)).orderBy(desc(multiplayerRoomMessages.createdAt)).limit(50);
}

export async function sendMultiplayerRoomMessage(input: { roomToken: string; userId: number; body: string }) {
  const room = await roomForToken(input.roomToken);
  if (!room || !(await roomMember(room.id, input.userId))) throw new Error("Room access denied");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(multiplayerRoomMessages).values({ roomId: room.id, userId: input.userId, body: input.body.trim().slice(0, 500) });
  await heartbeatMultiplayerRoom({ roomToken: input.roomToken, userId: input.userId });
}

export async function closeMultiplayerRoom(roomToken: string, userId: number) {
  const room = await roomForToken(roomToken);
  if (!room || room.hostUserId !== userId) throw new Error("Only the host can close this room");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(multiplayerRoomMessages).where(eq(multiplayerRoomMessages.roomId, room.id));
  await db.delete(multiplayerRoomMembers).where(eq(multiplayerRoomMembers.roomId, room.id));
  await db.delete(multiplayerRooms).where(eq(multiplayerRooms.id, room.id));
}

export async function getDailyChallenge() {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(platformConfig).where(eq(platformConfig.configKey, "daily_challenge")).limit(1))[0];
}

export async function setDailyChallenge(gameSlug: string, dateKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const configValue = { gameSlug, dateKey };
  await db.insert(platformConfig).values({ configKey: "daily_challenge", configValue }).onDuplicateKeyUpdate({ set: { configValue, updatedAt: new Date() } });
  return getDailyChallenge();
}

export async function getDailyChallengeSchedule() {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(platformConfig).where(eq(platformConfig.configKey, "daily_challenge_schedule")).limit(1))[0];
}

export async function setDailyChallengeSchedule(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const configValue = { taskUid };
  await db.insert(platformConfig).values({ configKey: "daily_challenge_schedule", configValue }).onDuplicateKeyUpdate({ set: { configValue, updatedAt: new Date() } });
}
