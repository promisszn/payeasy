import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

/**
 * Global Redis Client Instance using @upstash/redis
 * Reuses the connection across module reloads in development.
 */
const globalForRedis = global as unknown as { redis: Redis | undefined };

export const redis =
    globalForRedis.redis ||
    (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
        ? new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
        })
        : undefined);

if (env.NODE_ENV !== "production" && redis) {
    globalForRedis.redis = redis;
}

/**
 * Helper to check if Redis is properly configured
 */
export const isRedisEnabled = () => {
    return !!redis;
}
