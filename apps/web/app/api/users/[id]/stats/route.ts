import { createClient } from '@/lib/superbase/server'
import { errorResponse, successResponse } from '@/lib/api-utils'
import { fetchUserStatsCached } from '@/lib/queries/user'

/**
 * GET /api/users/[id]/stats
 *
 * Returns aggregate stats for the authenticated user.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { id } = await params

  if (id !== user.id) {
    return errorResponse('Forbidden', 403, 'FORBIDDEN')
  }

  try {
    const stats = await fetchUserStatsCached(supabase, id)
    return successResponse(stats)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load user stats'
    return errorResponse(message, 500, 'INTERNAL_ERROR')
  }
}
