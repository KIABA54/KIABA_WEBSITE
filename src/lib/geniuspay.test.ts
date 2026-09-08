import { describe, it, expect, beforeEach, afterAll } from "vitest";
import crypto from "crypto";
import { verifyGeniusPayWebhook, initiateGeniusPayCheckout } from "./geniuspay";

const SECRET = "test-webhook-secret";

function sign(payload: string, timestamp: string, secret = SECRET): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
}

describe("verifyGeniusPayWebhook", () => {
  it("accepts a correctly signed, fresh payload", () => {
    const payload = JSON.stringify({ event: "payment.success" });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(payload, timestamp);

    const result = verifyGeniusPayWebhook(payload, signature, timestamp, SECRET);
    expect(result.isValid).toBe(true);
  });

  it("rejects a payload whose signature does not match (tampered body)", () => {
    const payload = JSON.stringify({ event: "payment.success", data: { amount: 1200 } });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(payload, timestamp);

    const tamperedPayload = JSON.stringify({ event: "payment.success", data: { amount: 999999 } });
    const result = verifyGeniusPayWebhook(tamperedPayload, signature, timestamp, SECRET);
    expect(result.isValid).toBe(false);
  });

  it("rejects a signature produced with the wrong secret", () => {
    const payload = JSON.stringify({ event: "payment.success" });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(payload, timestamp, "wrong-secret");

    const result = verifyGeniusPayWebhook(payload, signature, timestamp, SECRET);
    expect(result.isValid).toBe(false);
  });

  it("rejects a replayed payload with an old timestamp", () => {
    const payload = JSON.stringify({ event: "payment.success" });
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 min ago
    const signature = sign(payload, oldTimestamp);

    const result = verifyGeniusPayWebhook(payload, signature, oldTimestamp, SECRET);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/expiré|replay/i);
  });

  it("rejects when signature, timestamp or secret is missing", () => {
    expect(verifyGeniusPayWebhook("{}", "", "123", SECRET).isValid).toBe(false);
    expect(verifyGeniusPayWebhook("{}", "abc", "", SECRET).isValid).toBe(false);
    expect(verifyGeniusPayWebhook("{}", "abc", "123", "").isValid).toBe(false);
  });

  it("does not throw when the signature has a different length than expected", () => {
    const payload = JSON.stringify({ event: "payment.success" });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const result = verifyGeniusPayWebhook(payload, "short", timestamp, SECRET);
    expect(result.isValid).toBe(false);
  });

  it("rejects a future-dated timestamp just as much as a stale one (clock skew abuse)", () => {
    const payload = JSON.stringify({ event: "payment.success" });
    const futureTimestamp = (Math.floor(Date.now() / 1000) + 600).toString();
    const signature = sign(payload, futureTimestamp);

    const result = verifyGeniusPayWebhook(payload, signature, futureTimestamp, SECRET);
    expect(result.isValid).toBe(false);
  });

  it("rejects a non-numeric timestamp instead of crashing", () => {
    const payload = JSON.stringify({ event: "payment.success" });
    const signature = sign(payload, "not-a-number");
    const result = verifyGeniusPayWebhook(payload, signature, "not-a-number", SECRET);
    expect(result.isValid).toBe(false);
  });

  it("is sensitive to a single-character change anywhere in the payload", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = JSON.stringify({ event: "payment.success", data: { reference: "REF-000001" } });
    const signature = sign(payload, timestamp);

    const almostIdenticalPayload = JSON.stringify({ event: "payment.success", data: { reference: "REF-000002" } });
    const result = verifyGeniusPayWebhook(almostIdenticalPayload, signature, timestamp, SECRET);
    expect(result.isValid).toBe(false);
  });
});

describe("initiateGeniusPayCheckout", () => {
  const originalKey = process.env.GENIUSPAY_API_KEY;
  const originalSecret = process.env.GENIUSPAY_API_SECRET;

  beforeEach(() => {
    delete process.env.GENIUSPAY_API_KEY;
    delete process.env.GENIUSPAY_API_SECRET;
  });

  it("falls back to a simulated checkout when no API keys are configured", async () => {
    const result = await initiateGeniusPayCheckout({
      amount: 1200,
      description: "Test",
      customer: { phone: "+2250700000000" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.checkout_url).toContain("/paiement/simulation");
    expect(result.data?.amount).toBe(1200);
    expect(result.data?.status).toBe("pending");
  });

  it("generates a distinct reference on each simulated call (not hardcoded)", async () => {
    const first = await initiateGeniusPayCheckout({ amount: 1000, description: "A", customer: {} });
    const second = await initiateGeniusPayCheckout({ amount: 1000, description: "B", customer: {} });
    expect(first.data?.reference).not.toBe(second.data?.reference);
  });

  it("carries the requested amount and metadata through into the simulated response", async () => {
    const result = await initiateGeniusPayCheckout({
      amount: 5600,
      description: "Boost",
      customer: {},
      metadata: { action_type: "BOOST", ad_id: "ad-42" },
    });
    expect(result.data?.amount).toBe(5600);
    expect(result.data?.metadata).toEqual({ action_type: "BOOST", ad_id: "ad-42" });
  });

  // Restaure l'état des variables d'environnement pour ne pas affecter
  // d'autres fichiers de test exécutés dans le même process.
  afterAll(() => {
    if (originalKey !== undefined) process.env.GENIUSPAY_API_KEY = originalKey;
    if (originalSecret !== undefined) process.env.GENIUSPAY_API_SECRET = originalSecret;
  });
});
