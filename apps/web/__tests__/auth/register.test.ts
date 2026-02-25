import { POST } from "@/app/api/auth/register/route";
import * as stellarAuth from "@/lib/auth/stellar-auth";
import { createAuthRequest, parseCookie, cookieHasAttribute } from "../helpers/auth-helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/auth/stellar-auth");
jest.mock("@/lib/supabase/admin");
jest.mock("@/lib/security/authLogging", () => ({
  logAuthEvent: jest.fn().mockResolvedValue(undefined),
  AuthEventType: {
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILURE: "LOGIN_FAILURE",
  },
}));

// Shared mock admin client
const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockInsert = jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) }));
const mockSingle = jest.fn();
const mockFrom = jest.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}));

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_PUBLIC_KEY = "GBVZRQTJFXKDPFXLJPYKSUVHGZZIHZQJZ7GMPFQOMKX3OQZR5E5SDZTY";
const VALID_USERNAME = "alice";
const VALID_EMAIL = "alice@example.com";

const BASE_URL = "http://localhost/api/auth/register";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return createAuthRequest(BASE_URL, body);
}

function mockNoExistingUser() {
  // Every uniqueness check returns null (no duplicate)
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
}

function mockUserInserted(user: Record<string, unknown>) {
  mockSingle.mockResolvedValue({ data: user, error: null });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (stellarAuth.signJwt as jest.Mock).mockReturnValue("mock.jwt.token");
  });

  // ── 400 validation ──────────────────────────────────────────────────────────

  describe("validation errors", () => {
    it("returns 400 when body is not valid JSON", async () => {
      const req = new Request(BASE_URL, { method: "POST", body: "not-json" });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });

    it("returns 400 when public_key is missing", async () => {
      const res = await POST(makeRequest({ username: VALID_USERNAME }) as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/public_key/i);
    });

    it("returns 400 when username is missing", async () => {
      const res = await POST(makeRequest({ public_key: VALID_PUBLIC_KEY }) as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/username/i);
    });

    it("returns 400 for malformed Stellar public key", async () => {
      const res = await POST(
        makeRequest({ public_key: "not-a-key", username: VALID_USERNAME }) as any
      );
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/stellar public key/i);
    });

    it("returns 400 when username is too short", async () => {
      const res = await POST(
        makeRequest({ public_key: VALID_PUBLIC_KEY, username: "ab" }) as any
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when username is too long", async () => {
      const res = await POST(
        makeRequest({ public_key: VALID_PUBLIC_KEY, username: "a".repeat(21) }) as any
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when username contains invalid characters", async () => {
      const res = await POST(
        makeRequest({ public_key: VALID_PUBLIC_KEY, username: "alice doe!" }) as any
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invalid email address", async () => {
      const res = await POST(
        makeRequest({
          public_key: VALID_PUBLIC_KEY,
          username: VALID_USERNAME,
          email: "not-an-email",
        }) as any
      );
      expect(res.status).toBe(400);
    });
  });

  // ── 409 conflict ────────────────────────────────────────────────────────────

  describe("conflict errors", () => {
    it("returns 409 when wallet is already registered", async () => {
      // First maybeSingle call (public_key check) returns a user
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "existing-id" }, error: null });

      const res = await POST(
        makeRequest({ public_key: VALID_PUBLIC_KEY, username: VALID_USERNAME }) as any
      );
      const json = await res.json();
      expect(res.status).toBe(409);
      expect(json.error).toMatch(/wallet/i);
    });

    it("returns 409 when username is taken", async () => {
      // public_key check passes, username check fails
      mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })      // public_key → ok
        .mockResolvedValueOnce({ data: { id: "other-id" }, error: null }); // username → taken

      const res = await POST(
        makeRequest({ public_key: VALID_PUBLIC_KEY, username: VALID_USERNAME }) as any
      );
      const json = await res.json();
      expect(res.status).toBe(409);
      expect(json.error).toMatch(/username/i);
    });

    it("returns 409 when email is already registered", async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })      // public_key → ok
        .mockResolvedValueOnce({ data: null, error: null })      // username → ok
        .mockResolvedValueOnce({ data: { id: "other-id" }, error: null }); // email → taken

      const res = await POST(
        makeRequest({
          public_key: VALID_PUBLIC_KEY,
          username: VALID_USERNAME,
          email: VALID_EMAIL,
        }) as any
      );
      const json = await res.json();
      expect(res.status).toBe(409);
      expect(json.error).toMatch(/email/i);
    });
  });

  // ── 201 success ─────────────────────────────────────────────────────────────

  describe("success", () => {
    const newUser = {
      id: "user-uuid",
      public_key: VALID_PUBLIC_KEY,
      username: VALID_USERNAME,
      email: VALID_EMAIL,
      avatar_url: null,
      bio: null,
      created_at: "2026-02-25T00:00:00.000Z",
      updated_at: "2026-02-25T00:00:00.000Z",
    };

    beforeEach(() => {
      mockNoExistingUser();
      mockUserInserted(newUser);
    });

    it("returns 201 with the new user on success", async () => {
      const res = await POST(
        makeRequest({
          public_key: VALID_PUBLIC_KEY,
          username: VALID_USERNAME,
          email: VALID_EMAIL,
        }) as any
      );
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.public_key).toBe(VALID_PUBLIC_KEY);
      expect(json.data.username).toBe(VALID_USERNAME);
    });

    it("sets an httpOnly auth-token cookie on success", async () => {
      const res = await POST(
        makeRequest({ public_key: VALID_PUBLIC_KEY, username: VALID_USERNAME }) as any
      );

      const cookies = res.headers.get("set-cookie");
      const parsed = parseCookie(cookies);

      expect(parsed?.name).toBe("auth-token");
      expect(parsed?.value).toBe("mock.jwt.token");
      expect(cookieHasAttribute(cookies, "HttpOnly")).toBe(true);
      expect(cookieHasAttribute(cookies, "SameSite=strict")).toBe(true);
      expect(cookieHasAttribute(cookies, "Path=/")).toBe(true);
    });

    it("succeeds without an email (email is optional)", async () => {
      const res = await POST(
        makeRequest({ public_key: VALID_PUBLIC_KEY, username: VALID_USERNAME }) as any
      );
      expect(res.status).toBe(201);
    });

    it("normalises email to lowercase before saving", async () => {
      await POST(
        makeRequest({
          public_key: VALID_PUBLIC_KEY,
          username: VALID_USERNAME,
          email: "Alice@EXAMPLE.COM",
        }) as any
      );

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.email).toBe("alice@example.com");
    });

    it("calls signJwt with the public key", async () => {
      await POST(
        makeRequest({ public_key: VALID_PUBLIC_KEY, username: VALID_USERNAME }) as any
      );
      expect(stellarAuth.signJwt).toHaveBeenCalledWith(VALID_PUBLIC_KEY);
    });
  });
});
