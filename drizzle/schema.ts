import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core account record provisioned through Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  username: varchar("username", { length: 40 }).unique(),
  avatar: text("avatar"),
  bio: varchar("bio", { length: 280 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isSuspended: boolean("isSuspended").default(false).notNull(),
  suspendedAt: timestamp("suspendedAt"),
  suspensionReason: varchar("suspensionReason", { length: 240 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  language: varchar("language", { length: 12 }).default("en").notNull(),
  appearance: varchar("appearance", { length: 48 }).default("system").notNull(),
  customColors: json("customColors"),
  aiPreferences: json("aiPreferences"),
  weeklyDigest: boolean("weeklyDigest").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("user_settings_user_id_unique").on(table.userId)]);

export const savedTools = mysqlTable("saved_tools", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), toolId: varchar("toolId", { length: 120 }).notNull(), inputSnapshot: json("inputSnapshot"), label: varchar("label", { length: 120 }), isPublic: boolean("isPublic").default(false).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("saved_tools_user_tool_idx").on(table.userId, table.toolId)]);

export const toolHistory = mysqlTable("tool_history", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId"), toolId: varchar("toolId", { length: 120 }).notNull(), anonymousToken: varchar("anonymousToken", { length: 96 }), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("tool_history_tool_created_idx").on(table.toolId, table.createdAt)]);

export const gameProgress = mysqlTable("games_progress", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), gameSlug: varchar("gameSlug", { length: 100 }).notNull(), bestScore: int("bestScore").default(0).notNull(), level: int("level").default(1).notNull(), resources: json("resources"), deviceType: varchar("deviceType", { length: 24 }), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("games_progress_user_game_unique").on(table.userId, table.gameSlug)]);

export const leaderboardEntries = mysqlTable("leaderboard", {
  id: int("id").autoincrement().primaryKey(), gameSlug: varchar("gameSlug", { length: 100 }).notNull(), userId: int("userId").notNull(), score: int("score").notNull(), achievedAt: timestamp("achievedAt").defaultNow().notNull(),
}, (table) => [index("leaderboard_game_score_idx").on(table.gameSlug, table.score)]);

export const dailyChallengeScores = mysqlTable("daily_challenge_scores", {
  id: int("id").autoincrement().primaryKey(), dateKey: varchar("dateKey", { length: 10 }).notNull(), gameSlug: varchar("gameSlug", { length: 100 }).notNull(), userId: int("userId").notNull(), score: int("score").notNull(), achievedAt: timestamp("achievedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("daily_challenge_scores_date_game_user_unique").on(table.dateKey, table.gameSlug, table.userId), index("daily_challenge_scores_date_game_score_idx").on(table.dateKey, table.gameSlug, table.score)]);

export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), folderId: varchar("folderId", { length: 64 }), title: varchar("title", { length: 200 }).notNull(), content: text("content"), tags: json("tags"), color: varchar("color", { length: 24 }).default("amber"), isPinned: boolean("isPinned").default(false).notNull(), shareToken: varchar("shareToken", { length: 64 }).unique(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("notes_user_updated_idx").on(table.userId, table.updatedAt)]);

export const noteVersions = mysqlTable("note_versions", {
  id: int("id").autoincrement().primaryKey(), noteId: int("noteId").notNull(), version: int("version").notNull(), title: varchar("title", { length: 200 }).notNull(), content: text("content"), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("note_versions_note_version_unique").on(table.noteId, table.version)]);

export const sharedFiles = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(), uploaderId: int("uploaderId"), fileKey: varchar("fileKey", { length: 512 }).notNull().unique(), name: varchar("name", { length: 255 }).notNull(), mimeType: varchar("mimeType", { length: 120 }), size: int("size").notNull(), shareToken: varchar("shareToken", { length: 64 }).notNull().unique(), passwordCiphertext: text("passwordCiphertext"), metadataCiphertext: text("metadataCiphertext"), passwordHash: varchar("passwordHash", { length: 255 }), expiryAt: timestamp("expiryAt"), maxDownloads: int("maxDownloads"), downloadCount: int("downloadCount").default(0).notNull(), isPublic: boolean("isPublic").default(false).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("files_uploader_created_idx").on(table.uploaderId, table.createdAt)]);

export const clipboardItems = mysqlTable("clipboard_sync", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), deviceId: varchar("deviceId", { length: 96 }), title: varchar("title", { length: 160 }), contentCiphertext: text("contentCiphertext").notNull(), category: mysqlEnum("category", ["text", "password", "code", "link"]).default("text").notNull(), isPinned: boolean("isPinned").default(false).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), expiresAt: timestamp("expiresAt"),
}, (table) => [index("clipboard_user_created_idx").on(table.userId, table.createdAt)]);

/** Encrypted client-side vault payloads. The server deliberately never receives a plaintext vault secret. */
export const vaultEntries = mysqlTable("vault_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  kind: mysqlEnum("kind", ["login", "card", "secure_note"]).default("login").notNull(),
  ciphertext: text("ciphertext").notNull(),
  iv: varchar("iv", { length: 128 }).notNull(),
  salt: varchar("salt", { length: 128 }).notNull(),
  cryptoVersion: varchar("cryptoVersion", { length: 24 }).default("aes-gcm-v1").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("vault_entries_user_updated_idx").on(table.userId, table.updatedAt)]);

export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), title: varchar("title", { length: 180 }), messages: json("messages").notNull(), model: varchar("model", { length: 96 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("ai_conversations_user_updated_idx").on(table.userId, table.updatedAt)]);

export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(), userId1: int("userId1").notNull(), userId2: int("userId2").notNull(), status: mysqlEnum("status", ["pending", "accepted", "blocked"]).default("pending").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("friendships_pair_unique").on(table.userId1, table.userId2)]);

export const shortLinks = mysqlTable("short_links", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId"), alias: varchar("alias", { length: 80 }).notNull().unique(), targetUrlCiphertext: text("targetUrlCiphertext").notNull(), passwordCiphertext: text("passwordCiphertext"), expiryAt: timestamp("expiryAt"), clickLimit: int("clickLimit"), clickCount: int("clickCount").default(0).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("short_links_owner_created_idx").on(table.ownerId, table.createdAt)]);

/** Public directory records. `url` is retained exactly as supplied; a source/category hash pair prevents duplicate cards without collapsing valid cross-library entries. */
export const usefulLinks = mysqlTable("useful_links", {
  id: int("id").autoincrement().primaryKey(),
  section: mysqlEnum("section", ["bd", "awesome", "osint"]).notNull(),
  source: mysqlEnum("source", ["bd_official", "bd_app", "bd_general", "awesome", "osint"]).notNull(),
  category: varchar("category", { length: 160 }).notNull(),
  categoryBn: varchar("categoryBn", { length: 180 }),
  name: varchar("name", { length: 240 }).notNull(),
  nameBn: varchar("nameBn", { length: 240 }),
  description: varchar("description", { length: 600 }).notNull(),
  url: text("url").notNull(),
  urlHash: varchar("urlHash", { length: 64 }).notNull(),
  isGovernment: boolean("isGovernment").default(false).notNull(),
  isApp: boolean("isApp").default(false).notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("useful_links_section_category_idx").on(table.section, table.category),
  index("useful_links_source_idx").on(table.source),
  index("useful_links_name_idx").on(table.name),
  uniqueIndex("useful_links_section_category_url_hash_unique").on(table.section, table.category, table.urlHash),
]);

export const linkClicks = mysqlTable("link_clicks", {
  id: int("id").autoincrement().primaryKey(), linkId: int("linkId").notNull(), visitorHash: varchar("visitorHash", { length: 128 }), country: varchar("country", { length: 2 }), deviceType: varchar("deviceType", { length: 20 }), browser: varchar("browser", { length: 80 }), referrer: varchar("referrer", { length: 512 }), clickedAt: timestamp("clickedAt").defaultNow().notNull(),
}, (table) => [index("link_clicks_link_clicked_idx").on(table.linkId, table.clickedAt)]);

export const multiplayerRooms = mysqlTable("multiplayer_rooms", {
  id: int("id").autoincrement().primaryKey(), roomToken: varchar("roomToken", { length: 64 }).notNull().unique(), hostUserId: int("hostUserId"), gameSlug: varchar("gameSlug", { length: 100 }).notNull(), displayName: varchar("displayName", { length: 100 }), privacy: mysqlEnum("privacy", ["public", "private"]).default("private").notNull(), status: mysqlEnum("status", ["open", "active", "finished", "expired"]).default("open").notNull(), lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(), expiresAt: timestamp("expiresAt").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("multiplayer_rooms_status_expiry_idx").on(table.status, table.expiresAt)]);

export const multiplayerRoomMembers = mysqlTable("multiplayer_room_members", {
  id: int("id").autoincrement().primaryKey(), roomId: int("roomId").notNull(), userId: int("userId").notNull(), displayName: varchar("displayName", { length: 100 }).notNull(), status: mysqlEnum("status", ["joined", "ready", "left"]).default("joined").notNull(), lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(), joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("multiplayer_room_members_room_user_unique").on(table.roomId, table.userId), index("multiplayer_room_members_room_activity_idx").on(table.roomId, table.lastActivityAt)]);

export const multiplayerRoomMessages = mysqlTable("multiplayer_room_messages", {
  id: int("id").autoincrement().primaryKey(), roomId: int("roomId").notNull(), userId: int("userId").notNull(), body: varchar("body", { length: 500 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("multiplayer_room_messages_room_created_idx").on(table.roomId, table.createdAt)]);

export const platformConfig = mysqlTable("platform_config", {
  id: int("id").autoincrement().primaryKey(), configKey: varchar("configKey", { length: 100 }).notNull().unique(), configValue: json("configValue").notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const blogArticles = mysqlTable("blog_articles", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId"),
  authorName: varchar("authorName", { length: 120 }).default("ToolsHUB Team").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  language: varchar("language", { length: 12 }).default("en").notNull(),
  coverImage: text("coverImage"),
  categories: json("categories").notNull(),
  tags: json("tags").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "published"]).default("draft").notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isPinnedHome: boolean("isPinnedHome").default(false).notNull(),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: varchar("metaDescription", { length: 320 }),
  readingMinutes: int("readingMinutes").default(3).notNull(),
  publishedAt: timestamp("publishedAt"),
  scheduledAt: timestamp("scheduledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("blog_articles_status_published_idx").on(table.status, table.publishedAt),
  index("blog_articles_author_updated_idx").on(table.authorId, table.updatedAt),
]);

export const blogLikes = mysqlTable("blog_likes", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("blog_likes_article_user_unique").on(table.articleId, table.userId),
  index("blog_likes_article_idx").on(table.articleId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
