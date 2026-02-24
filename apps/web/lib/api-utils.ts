/**
 * Re-export API utils from the canonical app/api/utils module.
 * Use consistent response format: { success: boolean, data?: T, error?: string }
 */
export {
  successResponse,
  errorResponse,
  handleError,
  getUserId,
  requireAuth,
} from "@/app/api/utils";