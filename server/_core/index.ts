import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { serveStatic, setupVite } from "./vite";
import { getDailyChallenge, getDailyChallengeSchedule, setDailyChallenge } from "../db";
import { randomDailyChallengeFor, readDailyChallenge, utcDateKey } from "../dailyChallenge";
import { buildContentSecurityPolicy, isApiRateLimitExempt, securityHeaders } from "../httpSecurity";

const aiWindows = new Map<string, number[]>();
const faviconCache = new Map<string, { body: Buffer; contentType: string; expiresAt: number }>();
const faviconCacheTtlMs = 7 * 24 * 60 * 60 * 1000;
const faviconCacheLimit = 600;

function validFaviconHostname(value: string) {
  const hostname = value.toLocaleLowerCase();
  return /^[a-z0-9.-]{1,253}$/.test(hostname) && !hostname.startsWith(".") && !hostname.endsWith(".") ? hostname : null;
}

async function readFavicon(hostname: string) {
  const cached = faviconCache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) return cached;
  if (cached) faviconCache.delete(hostname);
  const upstream = await fetch(`https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`, { headers: { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" }, signal: AbortSignal.timeout(4_000) });
  if (!upstream.ok) return null;
  const body = Buffer.from(await upstream.arrayBuffer());
  if (!body.length || body.length > 256_000) return null;
  const contentType = upstream.headers.get("content-type")?.split(";")[0] || "image/x-icon";
  if (!contentType.startsWith("image/")) return null;
  const entry = { body, contentType, expiresAt: Date.now() + faviconCacheTtlMs };
  faviconCache.set(hostname, entry);
  if (faviconCache.size > faviconCacheLimit) faviconCache.delete(faviconCache.keys().next().value!);
  return entry;
}

function consumeAiWindow(key: string, limit: number) {
  const now = Date.now(); const recent = (aiWindows.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= limit) return false; recent.push(now); aiWindows.set(key, recent); return true;
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const isDevelopment = process.env.NODE_ENV === "development";
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((_req, res, next) => {
    res.setHeader("Content-Security-Policy", buildContentSecurityPolicy(isDevelopment));
    for (const [header, value] of Object.entries(securityHeaders)) res.setHeader(header, value);
    next();
  });
  app.use("/api", rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a minute before trying again." },
    skip: (req) => isApiRateLimitExempt(req.path),
  }));
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/link-icon/:hostname", async (req, res) => {
    const hostname = validFaviconHostname(req.params.hostname);
    if (!hostname) { res.status(400).end(); return; }
    try {
      const icon = await readFavicon(hostname);
      if (!icon) { res.status(404).end(); return; }
      res.setHeader("Content-Type", icon.contentType);
      res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
      res.send(icon.body);
    } catch {
      res.status(404).end();
    }
  });
  app.post("/api/ai/stream", async (req, res) => {
    let user = null;
    try { user = await sdk.authenticateRequest(req); } catch { user = null; }
    const identity = user ? `user:${user.id}` : `guest:${req.ip}`;
    const limit = user ? 30 : 5;
    if (!consumeAiWindow(identity, limit)) { res.status(429).json({ error: user ? "Member request limit reached. Please wait a minute." : "Guest request limit reached. Sign in to save and continue." }); return; }
    const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-12) : [];
    if (!messages.length || messages.some((message: unknown) => !message || typeof (message as { content?: unknown }).content !== "string" || String((message as { content: string }).content).length > 8000)) { res.status(400).json({ error: "Invalid chat request" }); return; }
    const controller = new AbortController(); let finished = false;
    res.on("close", () => { if (!finished) controller.abort(); });
    try {
      const upstream = await fetch(`${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${ENV.forgeApiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: "gpt-5-mini",
          stream: true,
          max_tokens: 1200,
          messages: [
            { role: "system", content: "You are ToolsHUB AI. Be accurate, concise, helpful, and use Markdown when it improves clarity." },
            ...messages,
          ],
        }),
      });
      if (!upstream.ok || !upstream.body) { res.status(502).json({ error: "AI service is unavailable" }); return; }
      res.setHeader("content-type", "text/event-stream"); res.setHeader("cache-control", "no-cache, no-transform"); res.setHeader("connection", "keep-alive"); res.setHeader("x-accel-buffering", "no"); res.flushHeaders();
      const reader = upstream.body.getReader(); const decoder = new TextDecoder();
      while (true) { const chunk = await reader.read(); if (chunk.done) break; res.write(decoder.decode(chunk.value, { stream: true })); }
      res.end(); finished = true;
    } catch (error) { if (!res.headersSent) res.status(502).json({ error: "AI service is unavailable" }); else res.end(); finished = true; }
  });
  app.post("/api/scheduled/dailyChallenge", async (req, res) => {
    let taskUid: string | undefined;
    try {
      const user = await sdk.authenticateRequest(req);
      taskUid = user.taskUid;
      if (!user.isCron || !taskUid) { res.status(403).json({ error: "cron-only" }); return; }
      const schedule = await getDailyChallengeSchedule();
      const scheduledTaskUid = schedule?.configValue && typeof schedule.configValue === "object" ? (schedule.configValue as { taskUid?: unknown }).taskUid : undefined;
      if (scheduledTaskUid !== taskUid) { res.status(403).json({ error: "unrecognized-daily-challenge-task" }); return; }
      const dateKey = utcDateKey();
      const current = readDailyChallenge((await getDailyChallenge())?.configValue);
      if (current?.dateKey === dateKey) { res.json({ ok: true, skipped: "already-current", challenge: current }); return; }
      const challenge = randomDailyChallengeFor(dateKey);
      await setDailyChallenge(challenge.gameSlug, challenge.dateKey);
      res.json({ ok: true, challenge, dailyLeaderboard: "reset-by-date-key" });
    } catch (error) {
      if (!taskUid) { res.status(403).json({ error: "cron-only" }); return; }
      console.error("[Daily challenge] Scheduled handler failed", { error, taskUid });
      res.status(500).json({ error: "The scheduled challenge could not be refreshed. Please retry the authenticated task." });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Server] Unhandled request error", { path: req.path, error });
    if (!res.headersSent) res.status(500).json({ error: "The service encountered an unexpected error. Please try again shortly." });
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
