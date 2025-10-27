// src/config/cacheConfig.js
import dotenv from "dotenv";
dotenv.config();

export const routeCacheRules = {
  "/api/admin/leave-summary": 300, // 5 min
  "/api/admin/report-summary": 300,
  "/api/admin/getUsers": 120,
  "/api/leave/recent": 60,
  "/api/leave/history": 120,
  "__default": 60, // fallback for uncategorized GETs
};

/**
 * Returns TTL (seconds) for a given URL path.
 */
export const getTTLForUrl = (url) => {
  for (const [route, ttl] of Object.entries(routeCacheRules)) {
    if (route !== "__default" && url.startsWith(route)) return ttl;
  }
  return routeCacheRules["__default"];
};
