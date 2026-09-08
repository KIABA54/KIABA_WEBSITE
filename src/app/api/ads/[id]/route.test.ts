import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/lib/testUtils/supabaseMock";

// PATCH /api/ads/[id] est le correctif de cette session pour le bug le plus
// grave trouvé dans l'audit : le bouton "Modifier" facturait sans jamais
// rien changer à l'annonce. On teste ici le comportement réel de la route,
// pas seulement une fonction pure — c'est justement là que le bug vivait.
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
  sendAdDeletedEmail: vi.fn(async () => {}),
}));

const { PATCH, DELETE } = await import("./route");
const { sendReceiptEmail } = await import("@/lib/email");

function makePatchRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/ads/ad-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "ad-1" });

const validEditBody = {
  title: "Nouveau titre modifié bien assez long",
  description: "Nouvelle description modifiée, assez longue pour la validation du contenu.",
  city: "bouake",
  address: "Nouveau quartier",
  phone_number: "+225 0711111111",
  contact_channels: "CALL",
  accepted_clients: "HOMME",
  category: "massage",
  subcategories: ["Massage bien-être"],
  photos: ["https://example.com/new-photo.jpg"],
};

beforeEach(() => {
  delete process.env.LAUNCH_MODE_FREE_ADS;
  mockDb = createMockSupabase({
    ads: [{ id: "ad-1", user_id: "user-1", status: "ONLINE", title: "Ancien titre" }],
  });
  mockSession = { userId: "user-1", email: "user1@example.com" };
  vi.mocked(sendReceiptEmail).mockClear();
});

describe("PATCH /api/ads/[id] — autorisation", () => {
  it("rejects an unauthenticated request", async () => {
    mockSession = null;
    const res = await PATCH(makePatchRequest(validEditBody), { params });
    expect(res.status).toBe(401);
  });

  it("rejects editing an ad that doesn't exist", async () => {
    const res = await PATCH(makePatchRequest(validEditBody), { params: Promise.resolve({ id: "ghost" }) });
    expect(res.status).toBe(404);
  });

  it("rejects editing someone else's ad (IDOR)", async () => {
    mockSession = { userId: "someone-else", email: "attacker@example.com" };
    const res = await PATCH(makePatchRequest(validEditBody), { params });
    expect(res.status).toBe(403);
  });

  it("rejects editing an ad that isn't ONLINE", async () => {
    mockDb = createMockSupabase({
      ads: [{ id: "ad-1", user_id: "user-1", status: "PENDING_PAYMENT", title: "x" }],
    });
    const res = await PATCH(makePatchRequest(validEditBody), { params });
    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/ads/[id] — validation du contenu", () => {
  it("rejects missing required fields", async () => {
    const res = await PATCH(makePatchRequest({ ...validEditBody, title: "" }), { params });
    expect(res.status).toBe(400);
  });

  it("rejects zero photos", async () => {
    const res = await PATCH(makePatchRequest({ ...validEditBody, photos: [] }), { params });
    expect(res.status).toBe(400);
  });

  it("rejects content blocked by the moderation filter", async () => {
    const res = await PATCH(
      makePatchRequest({ ...validEditBody, description: "jeune fille de 15 ans disponible" }),
      { params }
    );
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/ads/[id] — le coeur du correctif : le contenu change vraiment", () => {
  it("applies the new content immediately in launch mode (free) and records a COMPLETED transaction", async () => {
    process.env.LAUNCH_MODE_FREE_ADS = "true";

    const res = await PATCH(makePatchRequest(validEditBody), { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.free).toBe(true);

    // Régression directe du bug audité : avant le correctif, rien n'était
    // jamais écrit sur l'annonce elle-même.
    const ad = mockDb._dump("ads")[0];
    expect(ad.title).toBe(validEditBody.title);
    expect(ad.city).toBe("bouake");
    expect(ad.phone_number).toBe("+225 0711111111");

    const [tx] = mockDb._dump("transactions");
    expect(tx.type).toBe("EDIT");
    expect(tx.amount_fcfa).toBe(0);
    expect(tx.status).toBe("COMPLETED");

    expect(sendReceiptEmail).toHaveBeenCalledWith(expect.objectContaining({ type: "EDIT", amountFcfa: 0 }));
  });

  it("replaces the ad's photos, not merges them", async () => {
    process.env.LAUNCH_MODE_FREE_ADS = "true";
    mockDb = createMockSupabase({
      ads: [{ id: "ad-1", user_id: "user-1", status: "ONLINE", title: "Ancien titre" }],
      ad_photos: [{ id: "p1", ad_id: "ad-1", photo_url: "https://old.jpg", display_order: 1 }],
    });

    await PATCH(makePatchRequest(validEditBody), { params });

    const photos = mockDb._dump("ad_photos");
    expect(photos).toHaveLength(1);
    expect(photos[0].photo_url).toBe("https://example.com/new-photo.jpg");
  });

  it("does NOT apply changes immediately outside launch mode — they wait for payment", async () => {
    const res = await PATCH(makePatchRequest(validEditBody), { params });
    const data = await res.json();

    expect(data.free).toBeUndefined();
    expect(data.checkout_url).toBeTruthy();

    // Le contenu réel de l'annonce ne doit PAS encore avoir changé : c'est
    // le webhook de paiement qui l'appliquera à la confirmation.
    const ad = mockDb._dump("ads")[0];
    expect(ad.title).toBe("Ancien titre");

    // Les changements attendent dans la transaction, prêts pour le webhook.
    const [tx] = mockDb._dump("transactions");
    expect(tx.status).toBe("PENDING");
    expect(tx.type).toBe("EDIT");
    expect((tx.metadata as { pending_changes?: { title?: string } }).pending_changes?.title).toBe(
      validEditBody.title
    );
  });
});

describe("DELETE /api/ads/[id]", () => {
  it("rejects deleting someone else's ad", async () => {
    mockSession = { userId: "someone-else", email: "attacker@example.com" };
    const res = await DELETE(new Request("http://localhost/api/ads/ad-1", { method: "DELETE" }), { params });
    expect(res.status).toBe(403);
  });

  it("marks the ad as DELETED rather than removing the row", async () => {
    const res = await DELETE(new Request("http://localhost/api/ads/ad-1", { method: "DELETE" }), { params });
    expect(res.status).toBe(200);
    expect(mockDb._dump("ads")[0].status).toBe("DELETED");
  });
});
