import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/lib/testUtils/supabaseMock";

// POST /api/payments/initiate gère BOOST et RENEWAL sur une annonce
// existante — c'est ici que l'argent change de main pour ces deux actions,
// donc le point le plus critique à couvrir : le montant est TOUJOURS
// recalculé côté serveur depuis la formule de l'annonce, jamais accepté
// depuis le corps de la requête, et une annonce dans le mauvais état
// (BOOST hors-ligne, RENEWAL en ligne) doit être refusée.
let mockDb: MockSupabase;
let mockSession: { userId: string; email: string } | null;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockDb,
}));

vi.mock("@/lib/auth", () => ({
  getSession: async () => mockSession,
}));

vi.mock("@/lib/email", () => ({
  sendReceiptEmail: vi.fn(async () => {}),
}));

const { POST } = await import("./route");
const { sendReceiptEmail } = await import("@/lib/email");

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/payments/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  delete process.env.LAUNCH_MODE_FREE_ADS;
  mockDb = createMockSupabase({
    ads: [
      {
        id: "ad-1",
        user_id: "user-1",
        formula: "STANDARD",
        status: "ONLINE",
        phone_number: "+225 0700000000",
        title: "Annonce test",
      },
    ],
  });
  mockSession = { userId: "user-1", email: "user1@example.com" };
  vi.mocked(sendReceiptEmail).mockClear();
});

describe("POST /api/payments/initiate — autorisation et validation", () => {
  it("rejects an unauthenticated request", async () => {
    mockSession = null;
    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "BOOST" }));
    expect(res.status).toBe(401);
  });

  it("rejects an action_type other than BOOST/RENEWAL", async () => {
    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "NEW_AD" }));
    expect(res.status).toBe(400);
  });

  it("rejects an ad that doesn't exist", async () => {
    const res = await POST(makeRequest({ ad_id: "ghost", action_type: "BOOST" }));
    expect(res.status).toBe(404);
  });

  it("rejects boosting/renewing someone else's ad (IDOR)", async () => {
    mockSession = { userId: "someone-else", email: "attacker@example.com" };
    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "BOOST" }));
    expect(res.status).toBe(403);
  });

  it("rejects BOOST on an ad that isn't ONLINE", async () => {
    mockDb = createMockSupabase({
      ads: [{ id: "ad-1", user_id: "user-1", formula: "STANDARD", status: "OFFLINE", phone_number: "x", title: "t" }],
    });
    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "BOOST" }));
    expect(res.status).toBe(409);
  });

  it("rejects RENEWAL on an ad that isn't OFFLINE", async () => {
    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "RENEWAL" }));
    expect(res.status).toBe(409);
  });
});

describe("POST /api/payments/initiate — le montant vient TOUJOURS du serveur", () => {
  it("computes the RENEWAL amount from the ad's own formula, ignoring any amount in the request body", async () => {
    mockDb = createMockSupabase({
      ads: [{ id: "ad-1", user_id: "user-1", formula: "STANDARD", status: "OFFLINE", phone_number: "x", title: "t" }],
    });

    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "RENEWAL", amount: 1 }));
    expect(res.status).toBe(200);

    const [tx] = mockDb._dump("transactions");
    expect(tx.amount_fcfa).toBe(1200); // FORMULAS.STANDARD.price, jamais le "1" du body
  });

  it("computes the BOOST amount as 60% of the formula's price", async () => {
    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "BOOST" }));
    expect(res.status).toBe(200);

    const [tx] = mockDb._dump("transactions");
    expect(tx.amount_fcfa).toBe(720); // 60% de 1200 (STANDARD)
  });
});

describe("POST /api/payments/initiate — mode lancement gratuit", () => {
  it("activates the boost immediately and records a COMPLETED, zero-amount transaction", async () => {
    process.env.LAUNCH_MODE_FREE_ADS = "true";

    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "BOOST" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.free).toBe(true);

    const ad = mockDb._dump("ads")[0];
    expect(ad.is_boosted).toBe(true);
    expect(ad.boosted_at).toBeTruthy();

    const [tx] = mockDb._dump("transactions");
    expect(tx.status).toBe("COMPLETED");
    expect(tx.amount_fcfa).toBe(0);

    expect(sendReceiptEmail).toHaveBeenCalledWith(expect.objectContaining({ type: "BOOST", amountFcfa: 0 }));
  });

  it("renews an offline ad back to ONLINE with a fresh expiry, and resets any prior boost", async () => {
    process.env.LAUNCH_MODE_FREE_ADS = "true";
    mockDb = createMockSupabase({
      ads: [
        {
          id: "ad-1",
          user_id: "user-1",
          formula: "STANDARD",
          status: "OFFLINE",
          phone_number: "x",
          title: "t",
          is_boosted: true,
          boosted_at: "2020-01-01T00:00:00.000Z",
        },
      ],
    });

    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "RENEWAL" }));
    expect(res.status).toBe(200);

    const ad = mockDb._dump("ads")[0];
    expect(ad.status).toBe("ONLINE");
    expect(ad.is_boosted).toBe(false);
    expect(ad.boosted_at).toBeNull();
  });
});

describe("POST /api/payments/initiate — paiement réel (hors mode lancement)", () => {
  it("creates a PENDING transaction and returns a checkout_url without touching the ad yet", async () => {
    const res = await POST(makeRequest({ ad_id: "ad-1", action_type: "BOOST" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkout_url).toBeTruthy();
    expect(data.free).toBeUndefined();

    const ad = mockDb._dump("ads")[0];
    expect(ad.is_boosted).toBeFalsy(); // pas encore activé : attend la confirmation du webhook

    const [tx] = mockDb._dump("transactions");
    expect(tx.status).toBe("PENDING");
    expect(tx.geniuspay_reference).toBeTruthy();
  });
});
