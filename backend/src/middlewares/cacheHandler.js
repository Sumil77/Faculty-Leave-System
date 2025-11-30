// src/middlewares/cacheMiddleware.js
import redis from "../redis.js";
import { LeaveRule, LeaveCreditRule, LeaveType } from "../models/index.js";
import { getTTLForUrl, CACHE_KEYS } from "../config/cacheConfig.js";

/**
 * Central cache middleware.
 * Works for GET requests only.
 * Adds X-Cache header to indicate HIT or MISS.
 */

export const setCache = async (key, value, ttl) => {
  const str = JSON.stringify(value);

  // If no TTL specified, store permanently
  if (!ttl) {
    return redis.set(key, str);
  }

  if (typeof redis.setEx === "function") {
    await redis.setEx(key, ttl, str);
    return;
  }
  if (typeof redis.setex === "function") {
    await redis.setex(key, ttl, str);
    return;
  }
  await redis.set(key, str, "EX", ttl);
};

export const delCache = async (...keys) => {
  try {
    if (!keys.length) return;
    if (typeof redis.del === "function") await redis.del(...keys);
    else {
      for (const k of keys) await redis.del(k);
    }
  } catch (err) {
    console.error("delCache error:", err.message);
  }
};

/**
 * Rebuild the canonical caches used by the app.
 * This is called after add/update/delete operations to keep redis in sync.
 */
export const rebuildLeaveCaches = async (ttlSeconds = 3600) => {
  try {
    const [leaveTypes, leaveRules, creditRules] = await Promise.all([
      LeaveType.findAll({ where: { active: true }, raw: true }),
      LeaveRule.findAll({ where: { active: true }, raw: true }),
      LeaveCreditRule.findAll({ where: { active: true }, raw: true }),
    ]);

    await Promise.all([
      setCache(CACHE_KEYS.LEAVE_TYPES, leaveTypes, ttlSeconds),
      setCache(CACHE_KEYS.LEAVE_RULES, leaveRules, ttlSeconds),
      setCache(CACHE_KEYS.CREDIT_RULES, creditRules, ttlSeconds),
    ]);
  } catch (err) {
    console.error("rebuildLeaveCaches error:", err.message);
  }
};

async function setWithTTL(redis, key, ttlSeconds, value) {
  // node-redis v4: setEx
  if (typeof redis.setEx === "function") {
    return redis.setEx(key, ttlSeconds, value);
  }
  // ioredis: setex (lowercase)
  if (typeof redis.setex === "function") {
    return redis.setex(key, ttlSeconds, value);
  }
  // fallback using generic SET with EX option
  if (typeof redis.set === "function") {
    // redis.set(key, value, 'EX', ttl)
    return redis.set(key, value, "EX", ttlSeconds);
  }
  throw new Error("No compatible redis set-with-ttl method found");
}

export const cacheHandler = async (req, res, next) => {
  try {
    if (req.method !== "GET") return next();

    const sortedQuery = Object.keys(req.query)
      .sort()
      .map((k) => `${k}=${req.query[k]}`)
      .join("&");

    const key = sortedQuery ? `${req.path}?${sortedQuery}` : req.path;

    const cachedData = await redis.get(key);

    if (cachedData) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(JSON.parse(cachedData));
    }

    res.setHeader("X-Cache", "MISS");

    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        const ttl = getTTLForUrl(req.originalUrl);
        console.log(ttl);

        await setWithTTL(redis, key, ttl, JSON.stringify(body));
      } catch (err) {
        console.error("❌ Cache set failed:", err.message);
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    console.error("❌ Cache middleware error:", err.message);
    next();
  }
};

/**
 * Optional cache stats endpoint helper (DEV ONLY)
 */
export const registerCacheStatsRoute = (app) => {
  app.get("/api/admin/cache/stats", async (req, res) => {
    try {
      const keys = await redis.keys("*");
      const info = await redis.info();
      res.json({
        keysCount: keys.length,
        keysSample: keys.slice(0, 10),
        infoSnippet: info.split("\n").slice(0, 20).join("\n"),
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to fetch cache stats", details: err.message });
    }
  });
};

export async function cacheRules() {
  try {
    const leaveRules = await LeaveRule.findAll({ where: { active: true } });
    const creditRules = await LeaveCreditRule.findAll({
      where: { active: true },
    });
    const leaveType = await LeaveType.findAll({ where: { active: true } });

    await setCache(CACHE_KEYS.LEAVE_TYPES, leaveType);
    await setCache(CACHE_KEYS.LEAVE_RULES, leaveRules);
    await setCache(CACHE_KEYS.CREDIT_RULES, creditRules);
  } catch (err) {
    console.error("CacheRules error:", err.message);
  }
}
