// src/middlewares/cacheMiddleware.js
import redis from "../redis.js";
import { LeaveRule, LeaveCreditRule, LeaveType } from "../models/index.js";
import { getTTLForUrl } from "../config/cacheConfig.js";

/**
 * Central cache middleware.
 * Works for GET requests only.
 * Adds X-Cache header to indicate HIT or MISS.
 */

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

    const key = req.originalUrl;
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
  const leaveRules = await LeaveRule.findAll({ where: { active: true } });
  const creditRules = await LeaveCreditRule.findAll({
    where: { active: true },
  });
  const leaveType = await LeaveType.findAll({ where: { active: true } });

  await redis.set("leave_types", JSON.stringify(leaveType));
  await redis.set("leave_rules", JSON.stringify(leaveRules));
  await redis.set("credit_rules", JSON.stringify(creditRules));
}
