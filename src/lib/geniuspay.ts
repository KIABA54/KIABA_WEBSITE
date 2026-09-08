import crypto from "crypto";

const GENIUSPAY_BASE_URL = "https://geniuspay.ci/api/v1/merchant";

export interface InitiatePaymentParams {
  amount: number; // en XOF
  currency?: string; // Défaut : XOF
  description: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  success_url?: string;
  error_url?: string;
  metadata?: Record<string, any>;
}

export interface GeniusPayPaymentResponse {
  success: boolean;
  data?: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    checkout_url: string;
    payment_url: string;
    metadata: Record<string, any>;
    expires_at: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Initialise un paiement hébergé GeniusPay (Wave, Orange, MTN, Moov, Cartes)
 */
export async function initiateGeniusPayCheckout(
  params: InitiatePaymentParams
): Promise<GeniusPayPaymentResponse> {
  const apiKey = process.env.GENIUSPAY_API_KEY;
  const apiSecret = process.env.GENIUSPAY_API_SECRET;

  if (!apiKey || !apiSecret) {
    // Mode simulation / fallback de développement
    console.warn("[GeniusPay] Clés API non configurées, génération d'une référence de test.");
    const mockRef = `MTX-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 10000),
        reference: mockRef,
        amount: params.amount,
        currency: params.currency || "XOF",
        status: "pending",
        checkout_url: `/paiement/simulation?ref=${mockRef}&amount=${params.amount}`,
        payment_url: `/paiement/simulation?ref=${mockRef}&amount=${params.amount}`,
        metadata: params.metadata || {},
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      },
    };
  }

  try {
    const res = await fetch(`${GENIUSPAY_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || "XOF",
        description: params.description,
        customer: params.customer,
        success_url: params.success_url,
        error_url: params.error_url,
        metadata: params.metadata,
      }),
    });

    const json = await res.json();
    return json as GeniusPayPaymentResponse;
  } catch (error: any) {
    console.error("[GeniusPay] Erreur lors de l'appel API:", error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error?.message || "Erreur de connexion avec GeniusPay",
      },
    };
  }
}

/**
 * Vérifie la signature cryptographique du Webhook GeniusPay
 * Formule officielle : HMAC-SHA256(timestamp + "." + json_payload, secret)
 */
export function verifyGeniusPayWebhook(
  rawPayload: string,
  signature: string,
  timestamp: string,
  webhookSecret: string
): { isValid: boolean; reason?: string } {
  if (!signature || !timestamp || !webhookSecret) {
    return { isValid: false, reason: "Paramètres de signature manquants" };
  }

  // Protection contre les attaques par rejeu (5 minutes max)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const webhookTimestamp = parseInt(timestamp, 10);
  if (Math.abs(currentTimestamp - webhookTimestamp) > 300) {
    return { isValid: false, reason: "Horodatage expiré (replay attack detectée)" };
  }

  const dataToVerify = `${timestamp}.${rawPayload}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(dataToVerify)
    .digest("hex");

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
    return { isValid };
  } catch {
    return { isValid: false, reason: "Incohérence de longueur de signature" };
  }
}

/**
 * Récupère le statut d'un paiement par sa référence
 */
export async function getGeniusPayPayment(reference: string) {
  const apiKey = process.env.GENIUSPAY_API_KEY;
  const apiSecret = process.env.GENIUSPAY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return { success: false, message: "Clés non configurées" };
  }

  const res = await fetch(`${GENIUSPAY_BASE_URL}/payments/${reference}`, {
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
    },
  });

  return await res.json();
}
