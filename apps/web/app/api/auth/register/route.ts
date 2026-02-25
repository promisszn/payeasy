import { type NextRequest } from "next/server";
import { Keypair } from "stellar-sdk";
import { signJwt } from "@/lib/auth/stellar-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/app/api/utils/response";
import { logAuthEvent, AuthEventType } from "@/lib/security/authLogging";
import type { User } from "@/lib/types";

const COOKIE_MAX_AGE = 86_400; // 24 hours

/** Stellar public-key format: starts with G, exactly 56 Base32 chars. */
const STELLAR_KEY_RE = /^G[A-Z2-7]{55}$/;

/** Username: alphanumeric, underscore, hyphen, 3–20 characters. */
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

/**
 * POST /api/auth/register
 *
 * Creates a new user profile linked to their Stellar wallet public key and
 * immediately issues a JWT so the user is auto-logged-in after registration.
 *
 * Request body:
 * ```json
 * {
 *   "public_key": "G...",   // Stellar public key (required)
 *   "username":  "alice",   // 3-20 chars, alphanumeric/_/- (required)
 *   "email":     "a@b.com"  // RFC-5322 format (optional)
 * }
 * ```
 *
 * On success (201) a `auth-token` HTTP-only cookie is set and the new user
 * object is returned in the response body.
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? undefined;
  let publicKey: string | undefined;

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid JSON body", 400);
    }

    publicKey = typeof body.public_key === "string" ? body.public_key.trim() : undefined;
    const username: string | undefined =
      typeof body.username === "string" ? body.username.trim() : undefined;
    const email: string | undefined =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;

    // ── Required-field validation ────────────────────────────────────────────

    if (!publicKey) {
      return errorResponse("public_key is required", 400);
    }

    if (!username) {
      return errorResponse("username is required", 400);
    }

    // ── Format validation ────────────────────────────────────────────────────

    // Validate Stellar public key format (cryptographic check via Keypair)
    if (!STELLAR_KEY_RE.test(publicKey)) {
      return errorResponse("Invalid Stellar public key format", 400);
    }

    try {
      Keypair.fromPublicKey(publicKey);
    } catch {
      return errorResponse("Invalid Stellar public key", 400);
    }

    // Username: 3-20 chars, alphanumeric/underscore/hyphen
    if (!USERNAME_RE.test(username)) {
      return errorResponse(
        "Username must be 3–20 characters and contain only letters, numbers, underscores, or hyphens",
        400
      );
    }

    // Email: RFC-5322-compatible regex
    if (email !== undefined && email.length > 0) {
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!EMAIL_RE.test(email) || email.length > 254) {
        return errorResponse("Invalid email address", 400);
      }
    }

    // ── Uniqueness checks ────────────────────────────────────────────────────

    const supabase = createAdminClient();

    // Check for existing public_key (wallet already registered)
    const { data: existingByKey } = await supabase
      .from("users")
      .select("id")
      .eq("public_key", publicKey)
      .maybeSingle();

    if (existingByKey) {
      await logAuthEvent(
        {
          publicKey,
          eventType: AuthEventType.LOGIN_FAILURE,
          status: "FAILURE",
          failureReason: "Wallet already registered",
        },
        request
      );
      return errorResponse("A user with this wallet is already registered", 409);
    }

    // Check for existing username
    const { data: existingByUsername } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingByUsername) {
      return errorResponse("Username is already taken", 409);
    }

    // Check for existing email (only when provided)
    if (email) {
      const { data: existingByEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingByEmail) {
        return errorResponse("An account with this email already exists", 409);
      }
    }

    // ── Create user ──────────────────────────────────────────────────────────

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        public_key: publicKey,
        username,
        email: email ?? null,
      })
      .select()
      .single();

    if (insertError) {
      // Handle DB-level unique constraint violations gracefully
      if (insertError.code === "23505") {
        if (insertError.message.includes("public_key")) {
          return errorResponse("A user with this wallet is already registered", 409);
        }
        if (insertError.message.includes("username")) {
          return errorResponse("Username is already taken", 409);
        }
        if (insertError.message.includes("email")) {
          return errorResponse("An account with this email already exists", 409);
        }
      }
      console.error("[register] insert error:", insertError);
      return errorResponse("Failed to create user", 500);
    }

    // ── Issue JWT & auto-login ───────────────────────────────────────────────

    const token = signJwt(publicKey);

    await logAuthEvent(
      {
        publicKey,
        eventType: AuthEventType.LOGIN_SUCCESS,
        status: "SUCCESS",
        metadata: { action: "register" },
      },
      request
    );

    const response = successResponse<User>(newUser as User, 201);
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (err) {
    await logAuthEvent(
      {
        publicKey,
        eventType: AuthEventType.LOGIN_FAILURE,
        status: "FAILURE",
        failureReason: "Internal server error during registration",
      },
      request
    );
    return handleError(err, requestId);
  }
}
