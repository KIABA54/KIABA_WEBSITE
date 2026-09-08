import { describe, it, expect, vi, beforeEach } from "vitest";

// `createSession`/`getSession` appellent `cookies()` de "next/headers", qui
// n'existe que dans une vraie requête Next.js. On simule un magasin de
// cookies minimal (get/set/delete) pour tester le cycle complet
// création -> lecture -> suppression du cookie de session sans serveur Next.
const cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined),
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  }),
}));

process.env.SESSION_SECRET = "unit-test-session-secret-value-not-real";

const { createSession, getSession, clearSession, hashPassword, verifyPassword, generateOtpCode } = await import(
  "./auth"
);

describe("session (JWT + cookie)", () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it("round-trips userId and email through create -> get", async () => {
    await createSession("user-123", "test@example.com");
    const session = await getSession();
    expect(session).toEqual({ userId: "user-123", email: "test@example.com" });
  });

  it("returns null when no session cookie is present", async () => {
    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns null for a tampered/invalid token", async () => {
    cookieStore.set("kiaba_session", "not.a.valid.jwt");
    const session = await getSession();
    expect(session).toBeNull();
  });

  it("clearSession removes the cookie", async () => {
    await createSession("user-123", "test@example.com");
    await clearSession();
    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe("password hashing", () => {
  it("verifyPassword succeeds for the correct password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("verifyPassword fails for a wrong password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("never stores the password in plain text", async () => {
    const hash = await hashPassword("my-secret-password");
    expect(hash).not.toContain("my-secret-password");
  });
});

describe("generateOtpCode", () => {
  it("always returns a 6-digit numeric string", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
      const n = Number(code);
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });

  it("does not always return the same code (not hardcoded)", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateOtpCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
