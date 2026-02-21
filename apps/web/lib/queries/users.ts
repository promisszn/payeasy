import type { SupabaseClient } from '@supabase/supabase-js'

export interface UserStats {
  listings_count: number
  messages_sent_count: number
  messages_received_count: number
  rent_payments_made_count: number
  unread_messages_count: number
  active_agreements_count: number
}

interface UserStatsRow extends UserStats {
  user_id: string
}

type CacheRecord = {
  expiresAt: number
  value: UserStats
}

const STATS_CACHE_TTL_MS = 30_000
const statsCache = new Map<string, CacheRecord>()

/**
 * Query user-level aggregate stats from the database function.
 *
 * NOTE: this requires the SQL function `public.get_user_stats(target_user_id uuid)`
 * to be present (added via Supabase migration).
 */
export async function fetchUserStats(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStats> {
  const { data, error } = await supabase.rpc('get_user_stats', {
    target_user_id: userId,
  })

  if (error) {
    throw new Error(`Failed to fetch user stats: ${error.message}`)
  }

  const row = (data?.[0] ?? null) as UserStatsRow | null

  return {
    listings_count: row?.listings_count ?? 0,
    messages_sent_count: row?.messages_sent_count ?? 0,
    messages_received_count: row?.messages_received_count ?? 0,
    rent_payments_made_count: row?.rent_payments_made_count ?? 0,
    unread_messages_count: row?.unread_messages_count ?? 0,
    active_agreements_count: row?.active_agreements_count ?? 0,
  }
}

/**
 * Small in-memory cache to dampen repeated dashboard/inbox hits.
 *
 * In serverless runtimes this cache is best-effort only.
 */
export async function fetchUserStatsCached(
  supabase: SupabaseClient,
  userId: string,
  ttlMs = STATS_CACHE_TTL_MS
): Promise<UserStats> {
  const now = Date.now()
  const existing = statsCache.get(userId)

  if (existing && existing.expiresAt > now) {
    return existing.value
  }

  const stats = await fetchUserStats(supabase, userId)
  statsCache.set(userId, {
    value: stats,
    expiresAt: now + ttlMs,
  })

  return stats
}

export function clearUserStatsCache(userId?: string) {
  if (userId) {
    statsCache.delete(userId)
    return
  }

  statsCache.clear()
}
