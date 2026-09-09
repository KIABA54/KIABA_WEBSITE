import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/lib/testUtils/supabaseMock";

// Cette route n'avait aucun test alors qu'elle contenait un vrai bug trouvé
// par audit : une annonce qui expire très bientôt matchait à la fois les
// seuils "48h", "24h" ET "1h" (tous des `expires_at <= seuil`), et recevait
// les 3 emails d'alerte d'un coup au lieu du seul le plus pertinent.
let mockDb: MockSupabase;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockDb,
}));

vi.mock("@/lib/email", () => ({
  sendAdExpiringEmail: vi.fn(async () => {}),
}));

process.env.CRON_SECRET = "test-cron-secret";

const { GET } = await import("./route");
const { sendAdExpiringEmail } = await import("@/lib/email");

const NOW = new Date("2026-01-01T12:00:00.000Z");
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3600 * 1000).toISOString();

function makeRequest(): Request {
  return new Request("http://localhost/api/cron/expirations", {
    headers: { Authorization: "Bearer test-cron-secret" },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.mocked(sendAdExpiringEmail).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/cron/expirations — authentification", () => {
  it("rejects a request without the correct bearer token", async () => {
    mockDb = createMockSupabase({ ads: [] });
    const res = await GET(new Request("http://localhost/api/cron/expirations"));
    expect(res.status).toBe(401);
  });
});

describe("GET /api/cron/expirations — désactivation des annonces expirées", () => {
  it("moves an ad past its expiry to OFFLINE and sends it no alert", async () => {
    mockDb = createMockSupabase({
      ads: [
        {
          id: "ad-past",
          title: "Annonce déjà expirée",
          user_id: "u1",
          user: { email: "past@example.com" },
          status: "ONLINE",
          expires_at: hoursFromNow(-1),
          alert_2d_sent: false,
          alert_1d_sent: false,
          alert_1h_sent: false,
        },
      ],
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.expired_count).toBe(1);
    expect(mockDb._dump("ads")[0].status).toBe("OFFLINE");
    expect(sendAdExpiringEmail).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/expirations — une seule alerte, la plus pertinente", () => {
  it("an ad expiring in 30 minutes gets only the 1-hour alert, not all 3", async () => {
    mockDb = createMockSupabase({
      ads: [
        {
          id: "ad-urgent",
          title: "Annonce très urgente",
          user_id: "u1",
          user: { email: "urgent@example.com" },
          status: "ONLINE",
          expires_at: hoursFromNow(0.5),
          alert_2d_sent: false,
          alert_1d_sent: false,
          alert_1h_sent: false,
        },
      ],
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(sendAdExpiringEmail).toHaveBeenCalledTimes(1);
    expect(sendAdExpiringEmail).toHaveBeenCalledWith("urgent@example.com", "Annonce très urgente", "ad-urgent", "1 heure");

    // Les 3 fenêtres sont marquées "envoyées" pour ne plus jamais relancer
    // les alertes moins urgentes ("24h"/"48h") pour cette même annonce.
    const ad = mockDb._dump("ads")[0];
    expect(ad.alert_1h_sent).toBe(true);
    expect(ad.alert_1d_sent).toBe(true);
    expect(ad.alert_2d_sent).toBe(true);

    expect(data.alerts_sent).toEqual({ alert_1h_sent: 1, alert_1d_sent: 0, alert_2d_sent: 0 });
  });

  it("an ad expiring in 10 hours gets only the 24-hour alert, not the 48-hour one", async () => {
    mockDb = createMockSupabase({
      ads: [
        {
          id: "ad-mid",
          title: "Annonce moyennement urgente",
          user_id: "u1",
          user: { email: "mid@example.com" },
          status: "ONLINE",
          expires_at: hoursFromNow(10),
          alert_2d_sent: false,
          alert_1d_sent: false,
          alert_1h_sent: false,
        },
      ],
    });

    await GET(makeRequest());

    expect(sendAdExpiringEmail).toHaveBeenCalledTimes(1);
    expect(sendAdExpiringEmail).toHaveBeenCalledWith("mid@example.com", "Annonce moyennement urgente", "ad-mid", "24 heures");

    const ad = mockDb._dump("ads")[0];
    expect(ad.alert_1h_sent).toBe(false); // pas encore assez urgent pour celle-ci
    expect(ad.alert_1d_sent).toBe(true);
    expect(ad.alert_2d_sent).toBe(true); // supersédée, marquée quand même
  });

  it("an ad expiring in 40 hours gets only the 48-hour alert", async () => {
    mockDb = createMockSupabase({
      ads: [
        {
          id: "ad-far",
          title: "Annonce pas urgente",
          user_id: "u1",
          user: { email: "far@example.com" },
          status: "ONLINE",
          expires_at: hoursFromNow(40),
          alert_2d_sent: false,
          alert_1d_sent: false,
          alert_1h_sent: false,
        },
      ],
    });

    await GET(makeRequest());

    expect(sendAdExpiringEmail).toHaveBeenCalledTimes(1);
    expect(sendAdExpiringEmail).toHaveBeenCalledWith("far@example.com", "Annonce pas urgente", "ad-far", "48 heures");

    const ad = mockDb._dump("ads")[0];
    expect(ad.alert_1h_sent).toBe(false);
    expect(ad.alert_1d_sent).toBe(false);
    expect(ad.alert_2d_sent).toBe(true);
  });

  it("an ad expiring far in the future gets no alert at all", async () => {
    mockDb = createMockSupabase({
      ads: [
        {
          id: "ad-safe",
          title: "Annonce loin de l'échéance",
          user_id: "u1",
          user: { email: "safe@example.com" },
          status: "ONLINE",
          expires_at: hoursFromNow(200),
          alert_2d_sent: false,
          alert_1d_sent: false,
          alert_1h_sent: false,
        },
      ],
    });

    await GET(makeRequest());
    expect(sendAdExpiringEmail).not.toHaveBeenCalled();
  });

  it("does not re-send an alert whose flag is already true", async () => {
    mockDb = createMockSupabase({
      ads: [
        {
          id: "ad-already-alerted",
          title: "Déjà alertée",
          user_id: "u1",
          user: { email: "already@example.com" },
          status: "ONLINE",
          expires_at: hoursFromNow(0.5),
          alert_2d_sent: true,
          alert_1d_sent: true,
          alert_1h_sent: true,
        },
      ],
    });

    await GET(makeRequest());
    expect(sendAdExpiringEmail).not.toHaveBeenCalled();
  });
});
