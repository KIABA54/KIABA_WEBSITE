import { describe, it, expect, vi, beforeEach } from "vitest";

// checkRateLimit passe par createAdminClient() (Supabase réel). On simule ici
// uniquement le sous-ensemble du query builder utilisé par rateLimit.ts
// (from/select/eq/maybeSingle/insert/update) avec une table en mémoire, pour
// tester la logique de fenêtre fixe sans base de données.
interface Row {
  count: number;
}

let store: Map<string, Row>;
let forceSelectError = false;

function makeQueryBuilder() {
  const filters: Record<string, unknown> = {};
  let pendingUpdate: Record<string, unknown> | null = null;

  const builder = {
    select() {
      return builder;
    },
    eq(col: string, val: unknown) {
      filters[col] = val;
      return builder;
    },
    async maybeSingle() {
      if (forceSelectError) {
        return { data: null, error: { message: "simulated DB outage" } };
      }
      const key = `${filters.key}|${filters.window_start}`;
      const row = store.get(key);
      return { data: row ? { count: row.count } : null, error: null };
    },
    async insert(row: { key: string; window_start: string; count: number }) {
      store.set(`${row.key}|${row.window_start}`, { count: row.count });
      return { data: null, error: null };
    },
    update(partial: Record<string, unknown>) {
      pendingUpdate = partial;
      return builder;
    },
    then(resolve: (v: unknown) => void) {
      // Point d'exécution différé pour `update().eq().eq()` awaité sans
      // méthode terminale explicite (comme le fait vraiment supabase-js).
      if (pendingUpdate) {
        const key = `${filters.key}|${filters.window_start}`;
        const existing = store.get(key) || { count: 0 };
        store.set(key, { ...existing, ...pendingUpdate } as Row);
      }
      resolve({ data: null, error: null });
    },
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => makeQueryBuilder(),
  }),
}));

const { checkRateLimit, getClientIp, rateLimitResponseBody } = await import("./rateLimit");

describe("checkRateLimit", () => {
  beforeEach(() => {
    store = new Map();
    forceSelectError = false;
  });

  it("allows the first request in a fresh window", async () => {
    const result = await checkRateLimit("test:key", 3, 60);
    expect(result).toEqual({ allowed: true, remaining: 2 });
  });

  it("allows requests up to the limit, then blocks", async () => {
    await checkRateLimit("test:key", 2, 60);
    const second = await checkRateLimit("test:key", 2, 60);
    const third = await checkRateLimit("test:key", 2, 60);

    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("tracks separate keys independently", async () => {
    await checkRateLimit("user:A", 1, 60);
    const forA = await checkRateLimit("user:A", 1, 60);
    const forB = await checkRateLimit("user:B", 1, 60);

    expect(forA.allowed).toBe(false);
    expect(forB.allowed).toBe(true);
  });

  it("resets the counter once the fixed window rolls over", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const inWindow1 = await checkRateLimit("rollover:key", 1, 60);
      const stillWindow1 = await checkRateLimit("rollover:key", 1, 60);
      expect(inWindow1.allowed).toBe(true);
      expect(stillWindow1.allowed).toBe(false);

      // On avance de 61 secondes : nouvelle fenêtre fixe, le compteur doit
      // repartir de zéro plutôt que de rester bloqué indéfiniment.
      vi.setSystemTime(new Date("2026-01-01T00:01:01.000Z"));
      const inWindow2 = await checkRateLimit("rollover:key", 1, 60);
      expect(inWindow2.allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("fails OPEN (allows the request) when the database read errors out", async () => {
    forceSelectError = true;
    const result = await checkRateLimit("db-down:key", 1, 60);
    // Documenté explicitement dans rateLimit.ts : mieux vaut laisser passer
    // une requête que de casser tout le site si la table est indisponible.
    expect(result.allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("prefers x-forwarded-for, taking the first hop", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("http://localhost", { headers: { "x-real-ip": "198.51.100.7" } });
    expect(getClientIp(req)).toBe("198.51.100.7");
  });

  it("returns 'unknown' when no IP header is present", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("rateLimitResponseBody", () => {
  it("has a default French message", () => {
    expect(rateLimitResponseBody().error).toMatch(/trop de tentatives/i);
  });
});
