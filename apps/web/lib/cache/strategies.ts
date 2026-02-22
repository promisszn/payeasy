import { redis, isRedisEnabled } from "./client";

export const CACHE_TTL = {
    MINUTE: 60,
    HOUR: 3600,
    DAY: 86400,
    WEEK: 604800,
} as const;

export const CACHE_KEYS = {
    USER_PROFILE: (userId: string) => `user:profile:${userId}`,
    TRENDING_CONTRACTS: "contracts:trending",
    AUDIT_LOGS_REPORT: (paramsHash: string) => `audit:logs:${paramsHash}`,
} as const;

export interface CacheOptions {
    /** Time to live in seconds */
    ttl?: number;
    /** Whether to use stale-while-revalidate strategy */
    swr?: boolean;
}

/**
 * Wrapper utility to cache the results of a data-fetching function.
 * Supports standard TTL and Stale-While-Revalidate (SWR).
 *
 * @param key Redis cache key
 * @param fetcher Async function that returns the data to cache
 * @param options Cache options (ttl, swr)
 * @returns The cached or freshly fetched data
 */
export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = { ttl: CACHE_TTL.MINUTE * 5, swr: false }
): Promise<T> {
    // If Redis is not configured or disabled, fallback to fetching directly
    if (!isRedisEnabled() || !redis) {
        console.warn(`[CACHE BYPASS] Redis not configured for key: ${key}`);
        return fetcher();
    }

    try {
        const cachedData = await redis.get<T>(key);

        if (cachedData !== null) {
            if (options.swr) {
                // Stale-While-Revalidate: Return cached data immediately, update in background
                console.log(`[CACHE HIT - SWR] ${key}`);

                // Background revalidation (fire and forget)
                // Next.js handles Promises in the background slightly differently in serverless environments,
                // but for general node execution this works. In Next.js app router, consider `unstable_after`.
                Promise.resolve().then(async () => {
                    try {
                        if (!redis) return;
                        const freshData = await fetcher();
                        await redis.set(key, freshData, options.ttl ? { ex: options.ttl } : undefined);
                        console.log(`[CACHE REVALIDATED] ${key}`);
                    } catch (error) {
                        console.error(`[CACHE SWR ERROR] failed to revalidate ${key}:`, error);
                    }
                });

                return cachedData;
            }

            console.log(`[CACHE HIT] ${key}`);
            return cachedData;
        }

        console.log(`[CACHE MISS] ${key}`);
        const freshData = await fetcher();

        // Store fresh data
        if (freshData !== undefined && freshData !== null) {
            await redis.set(key, freshData, options.ttl ? { ex: options.ttl } : undefined);
        }

        return freshData;
    } catch (error) {
        // If Redis connection fails, fallback gracefully to fetcher
        console.error(`[CACHE ERROR] Redis error fetching ${key}, falling back to source:`, error);
        return fetcher();
    }
}

/**
 * Invalidate specifically a single key
 * @param key The exact cache key
 */
export async function invalidateCache(key: string): Promise<void> {
    if (!isRedisEnabled() || !redis) return;
    try {
        await redis.del(key);
        console.log(`[CACHE INVALIDATED] ${key}`);
    } catch (error) {
        console.error(`[CACHE INVALIDATION ERROR] failed to delete ${key}:`, error);
    }
}

/**
 * Invalidate all keys matching a pattern (e.g., "user:profile:*")
 * @param pattern The pattern to match
 */
export async function invalidatePattern(pattern: string): Promise<void> {
    if (!isRedisEnabled() || !redis) return;
    try {
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
            cursor = nextCursor;
            if (keys.length > 0) {
                // Upstash Redis provides a pipeline utility to batch requests
                const pipeline = redis.pipeline();
                keys.forEach((k: string) => pipeline.del(k));
                await pipeline.exec();
                console.log(`[CACHE INVALIDATED PATTERN] ${keys.length} keys matching ${pattern}`);
            }
        } while (cursor !== "0");
    } catch (error) {
        console.error(`[CACHE INVALIDATION ERROR] failed to delete pattern ${pattern}:`, error);
    }
}
