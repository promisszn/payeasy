# Query Patterns

## User Stats Aggregations

For high-traffic dashboard/profile metrics, prefer a single SQL function call over multiple client round-trips.

### Function: `public.get_user_stats(target_user_id uuid)`

Located in migration:
- `apps/web/supabase/migrations/004_user_stats.sql`

Returns one row with:
- `listings_count`
- `messages_sent_count`
- `messages_received_count`
- `rent_payments_made_count`
- `unread_messages_count`
- `active_agreements_count`

### Why this pattern

- Keeps business logic in SQL close to data.
- Avoids N separate API/database calls for each metric.
- Works with RLS via `SECURITY INVOKER` and authenticated role grants.
- Makes API handlers thin and easier to cache.

### API usage

- Endpoint: `GET /api/users/[id]/stats`
- Query helper: `apps/web/lib/queries/users.ts`

### Caching

A short-lived in-memory cache (default 30s TTL) is used in `fetchUserStatsCached` to reduce repeat load from the same runtime instance.

> Note: In serverless environments this is best-effort and not globally shared.

### Index guidance

These indexes should exist for fast aggregations:
- `contract_transactions(user_id, created_at DESC)`
- `messages(conversation_id, created_at DESC)`
- `messages(sender_id)`
- `conversations(user1_id, user2_id)`

If production load increases, consider:
- materialized views for precomputed unread counts
- event-driven counter tables updated by triggers
