import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
    purchase_units?: Array<{
      custom_id?: string;
      reference_id?: string;
    }>;
  };
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const baseUrl =
    process.env.PAYPAL_MODE === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function verifyWebhookSignature(
  request: NextRequest,
  body: string,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("PAYPAL_WEBHOOK_ID not configured");
    return false;
  }

  const baseUrl =
    process.env.PAYPAL_MODE === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const accessToken = await getPayPalAccessToken();

  const verifyResponse = await fetch(
    `${baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        auth_algo: request.headers.get("paypal-auth-algo"),
        cert_url: request.headers.get("paypal-cert-url"),
        transmission_id: request.headers.get("paypal-transmission-id"),
        transmission_sig: request.headers.get("paypal-transmission-sig"),
        transmission_time: request.headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    },
  );

  const result = (await verifyResponse.json()) as {
    verification_status: string;
  };
  return result.verification_status === "SUCCESS";
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(request, body);
  if (!isValid) {
    console.error("Invalid PayPal webhook signature");
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const event = JSON.parse(body) as PayPalWebhookEvent;
  console.log("PayPal webhook event type:", event.event_type);

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const captureId = event.resource.id;
    const orderId = event.resource.supplementary_data?.related_ids?.order_id;

    if (!orderId) {
      console.error("Order ID not found in PayPal webhook event");
      return NextResponse.json(
        { error: "Order ID not found" },
        { status: 400 },
      );
    }

    // Check if already processed (idempotency)
    const existingTransaction = await db.paypalTransaction.findUnique({
      where: { paypalOrderId: orderId },
    });

    if (existingTransaction && existingTransaction.status === "COMPLETED") {
      console.log("PayPal transaction already completed:", orderId);
      return NextResponse.json({ message: "Already processed" });
    }

    if (existingTransaction) {
      // Update transaction and add credits
      await db.paypalTransaction.update({
        where: { paypalOrderId: orderId },
        data: {
          status: "COMPLETED",
          captureId,
        },
      });

      await db.user.update({
        where: { id: existingTransaction.userId },
        data: {
          credits: {
            increment: existingTransaction.credits,
          },
        },
      });

      console.log(
        `PayPal: Added ${existingTransaction.credits} credits to user ${existingTransaction.userId}`,
      );
    }

    return NextResponse.json({ message: "Payment processed successfully" });
  }

  return NextResponse.json({ message: "Event acknowledged" });
}
