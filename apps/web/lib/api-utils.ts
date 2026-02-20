import { NextResponse } from "next/server";

/**
 * Build a successful JSON response.
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Build an error JSON response.
 */
export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: { message, ...(code && { code }) } },
    { status }
  );
}

/**
 * Extract the authenticated user ID from the request.
 *
 * ⚠️  PLACEHOLDER — currently reads from the `x-user-id` header.
 * Replace with Supabase Auth / session validation in production.
 */
export function getUserId(request: Request): string | null {
  return request.headers.get("x-user-id");
}
