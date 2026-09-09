import crypto from "crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/lib/testUtils/supabaseMock";

// C'est ce webhook qui active réellement ce que le client a payé (annonce en
// ligne, boost, renouvellement, modification) — donc le point le plus
// critique de toute la chaîne de paiement à couvrir : signature invalide ou
// périmée rejetée, jamais de double activation sur un retry (idempotence),
// et chaque type d'action applique bien le bon changement.
const WEBHOOK_SECRET = "test-webhook-secret";

let mockDb: MockSupabase;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockDb,
}));

vi.mock("@/lib/email", () => ({
  sendReceiptEmail: vi.fn(async () => {}),
}));

const { POST } = await import("./route");
const { sendReceiptEmail } = await import("@/lib/email");

function signedRequest(payload: object, opts?: { timestamp?: number; secret?: string; signature?: string }) {
  const rawPayload = JSON.stringify(payload);
  const timestamp = String(opts?.timestamp ?? Math.floor(Date.now() / 1000));
  const secret = opts?.secret ?? WEBHOOK_SECRET;
  const signature =
    opts?.signature ??
    crypto.createHmac("sha256", secret).update(`${timestamp}.${rawPayload}`).digest("hex");

  return new Request("http://localhost/api/webhooks/geniuspay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-webhook-timestamp": timestamp,
    },
    body: rawPayload,
  });
}

beforeEach(() => {
  process.env.GENIUSPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  mockDb = createMockSupabase({
    users: [{ id: "user-1", email: "user1@example.com" }],
  });
  vi.mocked(sendReceiptEmail).mockClear();
});

describe("POST /api/webhooks/geniuspay — vérification de signature", () => {
  it("rejects a request with no signature configured server-side", async () => {
    delete process.env.GENIUSPAY_WEBHOOK_SECRET;
    const res = await POST(signedRequest({ event: "payment.success", data: { reference: "R1" } }));
    expect(res.status).toBe(500);
  });

  it("rejects an invalid signature", async () => {
    const res = await POST(
      signedRequest({ event: "payment.success", data: { reference: "R1" } }, { signature: "0".repeat(64) })
    );
    expect(res.status).toBe(401);
  });

  it("rejects a replayed webhook with an expired timestamp (> 5 minutes old)", async () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400;
    const res = await POST(
      signedRequest({ event: "payment.success", data: { reference: "R1" } }, { timestamp: oldTimestamp })
    );
    expect(res.status).toBe(401);
  });
});

describe("POST /api/webhooks/geniuspay — idempotence", () => {
  it("does not reapply an already-COMPLETED transaction on a retried webhook", async () => {
    mockDb = createMockSupabase({
      users: [{ id: "user-1", email: "user1@example.com" }],
      transactions: [
        {
          id: "tx-1",
          geniuspay_reference: "REF-1",
          status: "COMPLETED",
          amount_fcfa: 720,
          user_id: "user-1",
          metadata: {},
        },
      ],
      ads: [{ id: "ad-1", user_id: "user-1", formula: "STANDARD", is_boosted: false, title: "t" }],
    });

    const res = await POST(
      signedRequest({
        event: "payment.success",
        data: { reference: "REF-1", metadata: { action_type: "BOOST", ad_id: "ad-1" } },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.idempotent).toBe(true);
    expect(mockDb._dump("ads")[0].is_boosted).toBe(false); // pas réactivé une deuxième fois
    expect(sendReceiptEmail).not.toHaveBeenCalled();
  });

  it("returns received:true without crashing on an unknown reference", async () => {
    const res = await POST(
      signedRequest({ event: "payment.success", data: { reference: "GHOST-REF" } })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.warning).toBeTruthy();
  });
});

describe("POST /api/webhooks/geniuspay — activation par type d'action", () => {
  it("NEW_AD: brings the ad ONLINE and marks the transaction COMPLETED", async () => {
    mockDb = createMockSupabase({
      users: [{ id: "user-1", email: "user1@example.com" }],
      transactions: [
        { id: "tx-1", geniuspay_reference: "REF-1", status: "PENDING", amount_fcfa: 1200, user_id: "user-1", metadata: {} },
      ],
      ads: [{ id: "ad-1", user_id: "user-1", formula: "STANDARD", status: "PENDING_PAYMENT", title: "t" }],
    });

    const res = await POST(
      signedRequest({
        event: "payment.success",
        data: { reference: "REF-1", metadata: { action_type: "NEW_AD", ad_id: "ad-1" } },
      })
    );
    expect(res.status).toBe(200);

    expect(mockDb._dump("ads")[0].status).toBe("ONLINE");
    expect(mockDb._dump("transactions")[0].status).toBe("COMPLETED");
    expect(sendReceiptEmail).toHaveBeenCalledWith(expect.objectContaining({ type: "NEW_AD" }));
  });

  it("BOOST: sets is_boosted and boosted_at on the ad", async () => {
    mockDb = createMockSupabase({
      users: [{ id: "user-1", email: "user1@example.com" }],
      transactions: [
        { id: "tx-1", geniuspay_reference: "REF-1", status: "PENDING", amount_fcfa: 720, user_id: "user-1", metadata: {} },
      ],
      ads: [{ id: "ad-1", user_id: "user-1", formula: "STANDARD", status: "ONLINE", is_boosted: false, title: "t" }],
    });

    await POST(
      signedRequest({
        event: "payment.success",
        data: { reference: "REF-1", metadata: { action_type: "BOOST", ad_id: "ad-1" } },
      })
    );

    const ad = mockDb._dump("ads")[0];
    expect(ad.is_boosted).toBe(true);
    expect(ad.boosted_at).toBeTruthy();
  });

  it("RENEWAL: brings the ad back ONLINE with a fresh expiry and resets any boost", async () => {
    mockDb = createMockSupabase({
      users: [{ id: "user-1", email: "user1@example.com" }],
      transactions: [
        { id: "tx-1", geniuspay_reference: "REF-1", status: "PENDING", amount_fcfa: 1200, user_id: "user-1", metadata: {} },
      ],
      ads: [
        {
          id: "ad-1",
          user_id: "user-1",
          formula: "STANDARD",
          status: "OFFLINE",
          is_boosted: true,
          boosted_at: "2020-01-01T00:00:00.000Z",
          title: "t",
        },
      ],
    });

    await POST(
      signedRequest({
        event: "payment.success",
        data: { reference: "REF-1", metadata: { action_type: "RENEWAL", ad_id: "ad-1" } },
      })
    );

    const ad = mockDb._dump("ads")[0];
    expect(ad.status).toBe("ONLINE");
    expect(ad.is_boosted).toBe(false);
    expect(ad.boosted_at).toBeNull();
  });

  it("EDIT: applies the pending_changes stored on the transaction, including replacing photos", async () => {
    mockDb = createMockSupabase({
      users: [{ id: "user-1", email: "user1@example.com" }],
      transactions: [
        {
          id: "tx-1",
          geniuspay_reference: "REF-1",
          status: "PENDING",
          amount_fcfa: 999,
          user_id: "user-1",
          metadata: {
            pending_changes: {
              title: "Titre modifié après paiement",
              city: "bouake",
              photos: ["https://example.com/new.jpg"],
            },
          },
        },
      ],
      ads: [{ id: "ad-1", user_id: "user-1", formula: "STANDARD", status: "ONLINE", title: "Ancien titre" }],
      ad_photos: [{ id: "p1", ad_id: "ad-1", photo_url: "https://old.jpg", display_order: 1 }],
    });

    await POST(
      signedRequest({
        event: "payment.success",
        data: { reference: "REF-1", metadata: { action_type: "EDIT", ad_id: "ad-1" } },
      })
    );

    const ad = mockDb._dump("ads")[0];
    expect(ad.title).toBe("Titre modifié après paiement");
    expect(ad.city).toBe("bouake");

    const photos = mockDb._dump("ad_photos");
    expect(photos).toHaveLength(1);
    expect(photos[0].photo_url).toBe("https://example.com/new.jpg");
  });
});
