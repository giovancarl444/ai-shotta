// lib/rateLimiter.js
import { RateLimiterMemory } from "rate-limiter-flexible";

// 10 requests per minute
export const perMinute = new RateLimiterMemory({ points: 10, duration: 60 });
// 50 requests per day
export const perDay    = new RateLimiterMemory({ points: 50, duration: 86400 });

/**
 * Call this before each LLM invocation to enforce free‑tier caps.
 * @param {string} key – unique per user (IP or userID)
 */
export async function enforceFreeTier(key) {
  await perMinute.consume(key);
  await perDay.consume(key);
}
