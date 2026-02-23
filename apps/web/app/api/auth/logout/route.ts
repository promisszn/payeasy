import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * 
 * Logs out the current user by clearing the auth-token cookie.
 * This route always succeeds, even if no user is logged in.
 */
export async function POST() {
  const response = NextResponse.json(
    { success: true, data: { message: "Logged out successfully" } },
    { status: 200 }
  );
  
  // Clear the auth-token cookie by setting it with maxAge: 0
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0, // Expire immediately
  });
  
  return response;
}
