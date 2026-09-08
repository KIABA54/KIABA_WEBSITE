import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/lib/testUtils/supabaseMock";

// POST /api/ads est le chemin le plus sensible du projet côté argent : c'est
// lui qui décide si une annonce est gratuite (crédit "1ère annonce" ou mode
// lancement) ou payante, et qui a fait l'objet d'un correctif anti-course
// (race condition) cette session — on le teste ici comme du vrai code, pas
// seulement la logique qu'il appelle.
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
  return new Request("http://localhost/api/ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validAdBody = {
  title: "Titre d'annonce assez long pour la validation",
  description: "Description assez longue pour passer le filtre de modération et la validation métier.",
  city: "abidjan",
  address: "Cocody",
  phone_number: "+225 0700000000",
  contact_channels: "BOTH",
  accepted_clients: "TOUS",
  category: "massage",
  subcategories: ["Massage relaxant"],
  formula: "STANDARD",
  photos: ["https://example.com/photo.jpg"],
};

beforeEach(() => {
  delete process.env.LAUNCH_MODE_FREE_ADS;
  mockDb = createMockSupabase({
    users: [{ id: "user-1", free_ad_eligible: true }],
  });
  mockSession = { userId: "user-1", email: "user1@example.com" };
  vi.mocked(sendReceiptEmail).mockClear();
});

describe("POST /api/ads — authentification et validation", () => {
  it("rejects an unauthenticated request", async () => {
    mockSession = null;
    const res = await POST(makeRequest(validAdBody));
    expect(res.status).toBe(401);
  });

  it("rejects a request missing required fields", async () => {
    const res = await POST(makeRequest({ ...validAdBody, title: undefined }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid formula", async () => {
    const res = await POST(makeRequest({ ...validAdBody, formula: "GOLD_PLATED" }));
    expect(res.status).toBe(400);
  });

  it("rejects content blocked by the moderation filter", async () => {
    const res = await POST(makeRequest({ ...validAdBody, description: "jeune fille de 15 ans disponible" }));
    expect(res.status).toBe(400);
  });

  it("rejects more than 5 photos", async () => {
    const res = await POST(
      makeRequest({ ...validAdBody, photos: Array.from({ length: 6 }, (_, i) => `https://x.com/${i}.jpg`) })
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/ads — crédit '1ère annonce gratuite' (anti-course)", () => {
  it("grants the free credit once for a first STANDARD ad", async () => {
    const res = await POST(makeRequest(validAdBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.free).toBe(true);
    expect(data.status).toBe("ONLINE");

    const [tx] = mockDb._dump("transactions");
    expect(tx.amount_fcfa).toBe(0);
    expect((tx.metadata as { free_first_ad?: boolean }).free_first_ad).toBe(true);
  });

  it("does NOT grant the free credit twice — the second ad in a row is paid", async () => {
    const first = await POST(makeRequest(validAdBody));
    const firstData = await first.json();
    expect(firstData.free).toBe(true);

    // Deuxième publication du même utilisateur : le crédit vient d'être
    // consommé par le premier appel — celle-ci doit repartir sur le circuit
    // payant (GeniusPay simulé en mode dev faute de clés API), jamais
    // gratuite une seconde fois.
    const second = await POST(makeRequest(validAdBody));
    const secondData = await second.json();

    expect(secondData.free).toBeUndefined();
    expect(secondData.status).toBe("PENDING_PAYMENT");
    expect(secondData.checkout_url).toBeTruthy();

    const usersRow = mockDb._dump("users")[0];
    expect(usersRow.free_ad_eligible).toBe(false);
  });

  it("does not consume the free credit for a non-STANDARD formula", async () => {
    const res = await POST(makeRequest({ ...validAdBody, formula: "VIP" }));
    const data = await res.json();

    expect(data.free).toBeUndefined();
    expect(mockDb._dump("users")[0].free_ad_eligible).toBe(true);
  });

  it("restores the free credit if ad creation fails after consuming it", async () => {
    mockDb._failNextOn("ads", "insert");

    const res = await POST(makeRequest(validAdBody));
    expect(res.status).toBe(500);

    // Le crédit avait été consommé atomiquement avant l'échec de l'insert :
    // sans restitution, l'utilisateur perdrait sa 1ère annonce gratuite pour
    // une erreur qui n'est pas de son fait.
    expect(mockDb._dump("users")[0].free_ad_eligible).toBe(true);
  });

  it("restores the free credit if the photo insert fails (and removes the orphan ad)", async () => {
    mockDb._failNextOn("ad_photos", "insert");

    const res = await POST(makeRequest(validAdBody));
    expect(res.status).toBe(500);

    expect(mockDb._dump("users")[0].free_ad_eligible).toBe(true);
    expect(mockDb._dump("ads")).toHaveLength(0);
  });
});

describe("POST /api/ads — mode lancement", () => {
  it("makes every formula free when LAUNCH_MODE_FREE_ADS=true, without touching the personal credit", async () => {
    process.env.LAUNCH_MODE_FREE_ADS = "true";

    const res = await POST(makeRequest({ ...validAdBody, formula: "VIP" }));
    const data = await res.json();

    expect(data.free).toBe(true);
    // Le crédit personnel "1ère annonce" reste intact pour plus tard, une
    // fois le mode lancement désactivé — mode lancement et crédit personnel
    // sont deux mécanismes indépendants.
    expect(mockDb._dump("users")[0].free_ad_eligible).toBe(true);

    const [tx] = mockDb._dump("transactions");
    expect((tx.metadata as { launch_promo?: boolean }).launch_promo).toBe(true);
  });
});

describe("POST /api/ads — reçu par email", () => {
  it("sends a receipt email only on the free path", async () => {
    await POST(makeRequest(validAdBody));
    expect(sendReceiptEmail).toHaveBeenCalledTimes(1);
    expect(sendReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({ type: "NEW_AD", amountFcfa: 0, email: "user1@example.com" })
    );
  });

  it("does not send a receipt email on the paid (non-free) path", async () => {
    await POST(makeRequest({ ...validAdBody, formula: "VIP" }));
    expect(sendReceiptEmail).not.toHaveBeenCalled();
  });
});
