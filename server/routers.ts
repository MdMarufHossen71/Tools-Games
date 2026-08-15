import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  consumeFileShare,
  consumeShortLink,
  createClipboardItem,
  createAiConversation,
  createEncryptedFileShare,
  createEncryptedShortLink,
  createMultiplayerRoom,
  bulkUpsertUsefulLinks,
  decryptedFileShareMetadata,
  deleteClipboardItem,
  deleteUserShortLink,
  deleteAiConversation,
  deleteUserNote,
  deleteVaultEntry,
  deleteUsefulLink,
  getArticleLikeState,
  getAdminDashboard,
  getAiConversation,
  getFileShareByTokenHash,
  getGameLeaderboard,
  getGameProgress,
  getDailyChallenge,
  getDailyChallengeLeaderboard,
  getMultiplayerRoom,
  getPublishedArticleBySlug,
  getPublicPlatformConfig,
  getProfileSummary,
  getUserSettings,
  listBlogArticlesForAdmin,
  listAiConversations,
  listAdminUsers,
  listAdminFileShares,
  listAdminShortLinks,
  listClipboardItems,
  listEncryptedFileShares,
  listMultiplayerRoomMessages,
  listOpenMultiplayerRooms,
  listPublishedArticles,
  listShortLinks,
  listUserNotes,
  listUserNoteVersions,
  listUsefulLinks,
  listVaultEntries,
  resolveShortLink,
  listFriendRecords,
  requestFriendRecord,
  respondToFriendRecord,
  revokeAdminFileShare,
  revokeAdminShortLink,
  closeMultiplayerRoom,
  createSupportMessage,
  saveBlogArticle,
  saveGameSession,
  saveGameScore,
  savePlatformConfigValue,
  heartbeatMultiplayerRoom,
  joinMultiplayerRoom,
  sendMultiplayerRoomMessage,
  saveUserNote,
  saveUserSettings,
  saveUsefulLink,
  saveVaultEntry,
  setUserSuspension,
  toggleArticleLike,
  updateAiConversation,
} from "./db";
import { seedGroupsToLinks } from "./usefulLinks";
import { validateGameScore } from "./gameScores";
import { createCloudflareRelayCredentials } from "./turnCredentials";
import { dailyChallengeFor, readDailyChallenge, utcDateKey } from "./dailyChallenge";
import { translatePublishedArticle } from "./blogTranslation";
import { storageGet, storagePut } from "./storage";
import { blogCoverKey, decodeBlogCover } from "./blogUpload";
import { decodeSharedFile, fileShareStorageKey } from "./fileShare";
import { hashOpaqueToken, hashSharePassword, newOpaqueToken, verifySharePassword } from "./security";

const locales = z.enum(["en", "bn", "hi", "ur", "ar", "es", "fr", "de"]);
const nullableDate = z.coerce.date().nullable().optional();
const blogEditorInput = z.object({
  id: z.number().int().positive().optional(), title: z.string().min(3).max(240), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180), excerpt: z.string().max(600).nullable().optional(), content: z.string().min(20), language: locales, coverImage: z.string().max(1200).nullable().optional(), categories: z.array(z.string().min(1).max(60)).min(1).max(6), tags: z.array(z.string().min(1).max(40)).max(12), status: z.enum(["draft", "scheduled", "published"]), isFeatured: z.boolean(), isPinnedHome: z.boolean(), metaTitle: z.string().max(255).nullable().optional(), metaDescription: z.string().max(320).nullable().optional(), readingMinutes: z.number().int().min(1).max(180), publishedAt: nullableDate, scheduledAt: nullableDate,
});

const noteInput = z.object({ id: z.number().int().positive().optional(), folderId: z.string().max(64).nullable().optional(), title: z.string().trim().min(1).max(200), content: z.string().max(100_000).nullable().optional(), tags: z.array(z.string().max(32)).max(12), color: z.string().max(24), isPinned: z.boolean() });
const vaultInput = z.object({ id: z.number().int().positive().optional(), title: z.string().trim().min(1).max(160), kind: z.enum(["login", "card", "secure_note"]), ciphertext: z.string().min(1).max(200_000), iv: z.string().min(8).max(128), salt: z.string().min(8).max(128), cryptoVersion: z.string().min(1).max(24) });
const aiMessageInput = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8_000) });
const usefulLinkInput = z.object({
  id: z.number().int().positive().optional(),
  section: z.enum(["bd", "awesome", "osint"]),
  source: z.enum(["bd_official", "bd_app", "bd_general", "awesome", "osint"]),
  category: z.string().min(1).max(160),
  categoryBn: z.string().max(180).nullable().optional(),
  name: z.string().min(1).max(240),
  nameBn: z.string().max(240).nullable().optional(),
  description: z.string().max(600),
  url: z.string().min(8).max(4_000),
  isGovernment: z.boolean().optional(),
  isApp: z.boolean().optional(),
  verified: z.boolean().optional(),
});

function unavailable(message: string): never { throw new TRPCError({ code: "BAD_REQUEST", message }); }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  support: router({
    submit: publicProcedure.input(z.object({
      kind: z.enum(["support", "bug", "abuse", "privacy"]),
      subject: z.string().trim().min(4).max(180),
      email: z.string().trim().email().max(320).nullable().optional(),
      message: z.string().trim().min(12).max(4_000),
      pageUrl: z.string().max(512).nullable().optional(),
    })).mutation(({ ctx, input }) => createSupportMessage({ reporterId: ctx.user?.id, ...input })),
  }),
  preferences: router({
    get: protectedProcedure.query(({ ctx }) => getUserSettings(ctx.user.id)),
    save: protectedProcedure.input(z.object({ language: locales, appearance: z.string().min(1).max(48), customColors: z.record(z.string(), z.string()).optional() })).mutation(({ ctx, input }) => saveUserSettings(ctx.user.id, input)),
  }),
  profile: router({
    summary: protectedProcedure.query(({ ctx }) => getProfileSummary(ctx.user.id)),
  }),
  blog: router({
    list: publicProcedure.input(z.object({ query: z.string().max(80).optional(), category: z.string().max(60).optional(), author: z.string().max(120).optional() }).optional()).query(({ input }) => listPublishedArticles(input)),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(180) })).query(async ({ ctx, input }) => { const article = await getPublishedArticleBySlug(input.slug); if (!article) return null; return { article, reaction: await getArticleLikeState(article.id, ctx.user?.id) }; }),
    translate: publicProcedure.input(z.object({ slug: z.string().min(1).max(180), language: locales })).mutation(({ input }) => translatePublishedArticle(input.slug, input.language)),
    toggleLike: protectedProcedure.input(z.object({ articleId: z.number().int().positive() })).mutation(({ ctx, input }) => toggleArticleLike(input.articleId, ctx.user.id)),
  }),
  fileShare: router({
    create: protectedProcedure.input(z.object({ dataUrl: z.string().max(11_200_000), filename: z.string().trim().min(1).max(180), password: z.string().min(8).max(120).nullable().optional(), expiresAt: nullableDate, maxDownloads: z.number().int().min(1).max(10_000).nullable().optional() })).mutation(async ({ ctx, input }) => {
      const decoded = decodeSharedFile(input.dataUrl);
      const stored = await storagePut(fileShareStorageKey(input.filename), decoded.bytes, decoded.mimeType);
      const token = newOpaqueToken();
      await createEncryptedFileShare({ uploaderId: ctx.user.id, fileKey: stored.key, name: input.filename, mimeType: decoded.mimeType, size: decoded.bytes.length, tokenHash: hashOpaqueToken(token), passwordHash: await hashSharePassword(input.password), expiryAt: input.expiresAt ?? null, maxDownloads: input.maxDownloads ?? null });
      return { token, sharePath: `/share/${token}` };
    }),
    list: protectedProcedure.query(({ ctx }) => listEncryptedFileShares(ctx.user.id)),
    unlock: publicProcedure.input(z.object({ token: z.string().min(32).max(128), password: z.string().max(120).nullable().optional() })).mutation(async ({ input }) => {
      const share = await getFileShareByTokenHash(hashOpaqueToken(input.token));
      if (!share || (share.expiryAt && share.expiryAt < new Date()) || (share.maxDownloads !== null && share.downloadCount >= share.maxDownloads)) unavailable("This secure link is unavailable or has expired");
      if (!(await verifySharePassword(share.passwordHash, input.password))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Password required or incorrect" });
      const metadata = decryptedFileShareMetadata(share);
      if (!metadata) unavailable("Encrypted file metadata could not be opened");
      await consumeFileShare(share.id);
      const download = await storageGet(metadata.fileKey);
      return { url: download.url, name: metadata.name, mimeType: metadata.mimeType };
    }),
  }),
  clipboard: router({
    list: protectedProcedure.query(({ ctx }) => listClipboardItems(ctx.user.id)),
    add: protectedProcedure.input(z.object({ deviceId: z.string().max(96).nullable().optional(), title: z.string().max(160).nullable().optional(), content: z.string().min(1).max(100_000), category: z.enum(["text", "password", "code", "link"]), isPinned: z.boolean().optional(), expiresAt: nullableDate })).mutation(({ ctx, input }) => createClipboardItem({ userId: ctx.user.id, ...input })),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteClipboardItem(ctx.user.id, input.id)),
  }),
  notes: router({
    list: protectedProcedure.query(({ ctx }) => listUserNotes(ctx.user.id)),
    history: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => listUserNoteVersions(ctx.user.id, input.id)),
    save: protectedProcedure.input(noteInput).mutation(({ ctx, input }) => saveUserNote({ userId: ctx.user.id, ...input })),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteUserNote(ctx.user.id, input.id)),
  }),
  vault: router({
    list: protectedProcedure.query(({ ctx }) => listVaultEntries(ctx.user.id)),
    save: protectedProcedure.input(vaultInput).mutation(({ ctx, input }) => saveVaultEntry({ userId: ctx.user.id, ...input })),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteVaultEntry(ctx.user.id, input.id)),
  }),
  aiConversations: router({
    list: protectedProcedure.query(({ ctx }) => listAiConversations(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getAiConversation(ctx.user.id, input.id)),
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(120), messages: z.array(aiMessageInput).max(24).optional() })).mutation(({ ctx, input }) => createAiConversation({ ownerId: ctx.user.id, ...input })),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), title: z.string().trim().min(1).max(120).optional(), messages: z.array(aiMessageInput).max(24).optional() })).mutation(({ ctx, input }) => updateAiConversation(ctx.user.id, input.id, { title: input.title, messages: input.messages })),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteAiConversation(ctx.user.id, input.id)),
  }),
  usefulLinks: router({
    list: publicProcedure.query(() => listUsefulLinks()),
    save: adminProcedure.input(usefulLinkInput).mutation(({ input }) => saveUsefulLink(input)),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteUsefulLink(input.id)),
    bulkImportSeed: adminProcedure.input(z.unknown()).mutation(({ input }) => bulkUpsertUsefulLinks(seedGroupsToLinks(input))),
    bulkImportRows: adminProcedure.input(z.array(usefulLinkInput.omit({ id: true })).min(1).max(2_500)).mutation(({ input }) => bulkUpsertUsefulLinks(input)),
  }),
  games: router({
    getProgress: protectedProcedure.input(z.object({ gameSlug: z.string().min(1).max(100) })).query(({ ctx, input }) => getGameProgress(ctx.user.id, validateGameScore(input.gameSlug, 0).gameSlug)),
    submitScore: protectedProcedure.input(z.object({ gameSlug: z.string().min(1).max(100), score: z.number().int().min(0), level: z.number().int().min(1).max(999).optional(), deviceType: z.string().max(24).optional() })).mutation(({ ctx, input }) => { const score = validateGameScore(input.gameSlug, input.score); return saveGameScore({ userId: ctx.user.id, ...score, level: input.level, deviceType: input.deviceType }); }),
    saveSession: protectedProcedure.input(z.object({ gameSlug: z.string().min(1).max(100), session: z.record(z.string(), z.unknown()), deviceType: z.string().max(24).optional() })).mutation(({ ctx, input }) => saveGameSession({ userId: ctx.user.id, gameSlug: validateGameScore(input.gameSlug, 0).gameSlug, session: input.session, deviceType: input.deviceType })),
    leaderboard: publicProcedure.input(z.object({ gameSlug: z.string().min(1).max(100) })).query(({ ctx, input }) => getGameLeaderboard(validateGameScore(input.gameSlug, 0).gameSlug, ctx.user?.id)),
    dailyChallenge: publicProcedure.query(async () => {
      const challenge = readDailyChallenge((await getDailyChallenge())?.configValue);
      return challenge ?? dailyChallengeFor(utcDateKey());
    }),
    dailyLeaderboard: publicProcedure.query(({ ctx }) => getDailyChallengeLeaderboard(ctx.user?.id)),
    relayCredentials: protectedProcedure.query(async () => ({ iceServers: await createCloudflareRelayCredentials(1800), iceTransportPolicy: "relay" as const })),
    createRoom: protectedProcedure.input(z.object({ gameSlug: z.enum(["tic-tac-toe", "connect-four"]), displayName: z.string().trim().min(1).max(100), privacy: z.enum(["public", "private"]).default("private") })).mutation(({ ctx, input }) => createMultiplayerRoom({ hostUserId: ctx.user.id, ...input })),
    listRooms: publicProcedure.input(z.object({ gameSlug: z.enum(["tic-tac-toe", "connect-four"]).optional() }).optional()).query(({ input }) => listOpenMultiplayerRooms(input?.gameSlug)),
    getRoom: protectedProcedure.input(z.object({ roomToken: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/) })).query(({ ctx, input }) => getMultiplayerRoom(input.roomToken, ctx.user.id)),
    joinRoom: protectedProcedure.input(z.object({ roomToken: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/), displayName: z.string().trim().min(1).max(100) })).mutation(({ ctx, input }) => joinMultiplayerRoom({ ...input, userId: ctx.user.id })),
    heartbeatRoom: protectedProcedure.input(z.object({ roomToken: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/) })).mutation(({ ctx, input }) => heartbeatMultiplayerRoom({ ...input, userId: ctx.user.id })),
    closeRoom: protectedProcedure.input(z.object({ roomToken: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/) })).mutation(({ ctx, input }) => closeMultiplayerRoom(input.roomToken, ctx.user.id)),
    roomMessages: protectedProcedure.input(z.object({ roomToken: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/) })).query(({ ctx, input }) => listMultiplayerRoomMessages(input.roomToken, ctx.user.id)),
    sendRoomMessage: protectedProcedure.input(z.object({ roomToken: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/), body: z.string().trim().min(1).max(500) })).mutation(({ ctx, input }) => sendMultiplayerRoomMessage({ ...input, userId: ctx.user.id })),
  }),
  friends: router({
    list: protectedProcedure.query(({ ctx }) => listFriendRecords(ctx.user.id)),
    request: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(({ ctx, input }) => requestFriendRecord(ctx.user.id, input.userId)),
    respond: protectedProcedure.input(z.object({ friendshipId: z.number().int().positive(), accept: z.boolean() })).mutation(({ ctx, input }) => respondToFriendRecord(ctx.user.id, input.friendshipId, input.accept)),
  }),
  shortLinks: router({
    create: protectedProcedure.input(z.object({ alias: z.string().trim().regex(/^[a-zA-Z0-9_-]{4,80}$/).optional(), targetUrl: z.string().url().max(2048), password: z.string().min(8).max(120).nullable().optional(), expiresAt: nullableDate, clickLimit: z.number().int().min(1).max(1_000_000).nullable().optional() })).mutation(async ({ ctx, input }) => {
      const alias = input.alias ?? newOpaqueToken().slice(0, 9);
      await createEncryptedShortLink({ ownerId: ctx.user.id, alias, targetUrl: input.targetUrl, passwordHash: await hashSharePassword(input.password), expiryAt: input.expiresAt ?? null, clickLimit: input.clickLimit ?? null });
      return { alias, path: `/s/${alias}` };
    }),
    list: protectedProcedure.query(({ ctx }) => listShortLinks(ctx.user.id)),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteUserShortLink(ctx.user.id, input.id)),
    resolve: publicProcedure.input(z.object({ alias: z.string().min(4).max(80), password: z.string().max(120).nullable().optional() })).mutation(async ({ input }) => {
      const result = await resolveShortLink(input.alias);
      if (!result) unavailable("This link is unavailable or has expired");
      if (!(await verifySharePassword(result.row.passwordCiphertext, input.password))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Password required or incorrect" });
      await consumeShortLink(result.row.id);
      return { targetUrl: result.targetUrl };
    }),
  }),
  admin: router({
    dashboard: adminProcedure.query(() => getAdminDashboard()),
    users: adminProcedure.input(z.object({ query: z.string().max(80).optional(), limit: z.number().int().min(1).max(200).default(100) }).optional()).query(({ input }) => listAdminUsers(input?.query, input?.limit)),
    setUserSuspension: adminProcedure.input(z.object({ userId: z.number().int().positive(), isSuspended: z.boolean(), reason: z.string().max(240).nullable().optional() })).mutation(({ ctx, input }) => setUserSuspension(ctx.user.id, input.userId, input.isSuspended, input.reason)),
    settings: adminProcedure.query(() => getPublicPlatformConfig()),
    setToolVisibility: adminProcedure.input(z.object({ hiddenToolSlugs: z.array(z.string().regex(/^[a-z0-9-]{2,120}$/)).max(300) })).mutation(async ({ input }) => { await savePlatformConfigValue("hidden_tool_slugs", Array.from(new Set(input.hiddenToolSlugs))); return getPublicPlatformConfig(); }),
    setAnnouncement: adminProcedure.input(z.object({ enabled: z.boolean(), message: z.string().trim().max(280) })).mutation(async ({ input }) => { await savePlatformConfigValue("site_announcement", { enabled: input.enabled, message: input.message }); return getPublicPlatformConfig(); }),
    fileShares: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(200).default(100) }).optional()).query(({ input }) => listAdminFileShares(input?.limit)),
    shortLinks: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(200).default(100) }).optional()).query(({ input }) => listAdminShortLinks(input?.limit)),
    revokeFileShare: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => revokeAdminFileShare(input.id)),
    revokeShortLink: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => revokeAdminShortLink(input.id)),
    blog: router({
      list: adminProcedure.query(() => listBlogArticlesForAdmin()),
      save: adminProcedure.input(blogEditorInput).mutation(({ ctx, input }) => saveBlogArticle(ctx.user.id, ctx.user.name, input)),
      uploadCover: adminProcedure.input(z.object({ dataUrl: z.string().max(11_200_000), filename: z.string().min(1).max(180) })).mutation(async ({ input }) => { const cover = decodeBlogCover(input.dataUrl); return storagePut(blogCoverKey(input.filename, cover.extension), cover.bytes, cover.mimeType); }),
    }),
  }),
  platform: router({ summary: publicProcedure.query(() => ({ toolCount: 244, gameCount: 40, languageCount: 8, isFree: true })), config: publicProcedure.query(() => getPublicPlatformConfig()) }),
});

export type AppRouter = typeof appRouter;
