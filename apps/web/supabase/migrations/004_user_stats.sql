-- Aggregate stats function for user dashboards and profile summaries.

CREATE OR REPLACE FUNCTION public.get_user_stats(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  listings_count bigint,
  messages_sent_count bigint,
  messages_received_count bigint,
  rent_payments_made_count bigint,
  unread_messages_count bigint,
  active_agreements_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH user_conversations AS (
    SELECT c.id
    FROM public.conversations c
    WHERE c.user1_id = target_user_id OR c.user2_id = target_user_id
  )
  SELECT
    target_user_id AS user_id,
    (
      SELECT COUNT(*)
      FROM public.listings l
      WHERE l.landlord_id = target_user_id
    ) AS listings_count,
    (
      SELECT COUNT(*)
      FROM public.messages m
      WHERE m.sender_id = target_user_id
        AND m.deleted_at IS NULL
    ) AS messages_sent_count,
    (
      SELECT COUNT(*)
      FROM public.messages m
      JOIN user_conversations uc ON uc.id = m.conversation_id
      WHERE m.sender_id <> target_user_id
        AND m.deleted_at IS NULL
    ) AS messages_received_count,
    (
      SELECT COUNT(*)
      FROM public.contract_transactions ct
      WHERE ct.user_id = target_user_id
        AND ct.status = 'success'
    ) AS rent_payments_made_count,
    (
      SELECT COUNT(*)
      FROM public.messages m
      JOIN user_conversations uc ON uc.id = m.conversation_id
      WHERE m.sender_id <> target_user_id
        AND m.read_at IS NULL
        AND m.deleted_at IS NULL
    ) AS unread_messages_count,
    (
      SELECT COUNT(*)
      FROM public.rent_agreements ra
      WHERE ra.status = 'active'
        AND (
          ra.landlord_id = target_user_id
          OR target_user_id = ANY(ra.tenant_ids)
        )
    ) AS active_agreements_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO authenticated;
