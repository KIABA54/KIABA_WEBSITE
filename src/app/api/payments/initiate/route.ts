import { NextResponse } from "next/server";
import { initiateGeniusPayCheckout } from "@/lib/geniuspay";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, formula, title, phone, action_type } = body;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const response = await initiateGeniusPayCheckout({
      amount: Number(amount),
      currency: "XOF",
      description: `Paiement ${action_type} - ${formula || "Annonce"} - KIABA RENCONTRE`,
      customer: {
        phone: phone || "+2250700000000",
      },
      success_url: `${appUrl}/paiement/succes?ref={reference}&amount=${amount}`,
      error_url: `${appUrl}/paiement/echec?ref={reference}`,
      metadata: {
        action_type: action_type || "NEW_AD",
        formula,
        title,
      },
    });

    if (response.success && response.data) {
      return NextResponse.json({
        success: true,
        checkout_url: response.data.checkout_url,
        reference: response.data.reference,
      });
    }

    return NextResponse.json(
      { success: false, error: response.error?.message || "Erreur GeniusPay" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
