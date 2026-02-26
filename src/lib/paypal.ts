"use server";

import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
  type OrderRequest,
  CheckoutPaymentIntent,
  OrderApplicationContextUserAction,
} from "@paypal/paypal-server-sdk";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";

function getPayPalClient(): Client {
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
      oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,
    },
    timeout: 0,
    environment:
      process.env.PAYPAL_MODE === "live"
        ? Environment.Production
        : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logBody: true },
    },
  });
}

export async function createPayPalOrder(credits: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  const price = (credits / 50).toFixed(2);

  const client = getPayPalClient();
  const ordersController = new OrdersController(client);

  const orderRequest: OrderRequest = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        amount: {
          currencyCode: "USD",
          value: price,
        },
        description: `GetGit Credits - ${credits}`,
        customId: userId,
        referenceId: `credits-${credits}`,
      },
    ],
    applicationContext: {
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/paypal/return`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      brandName: "GetGit",
      userAction: OrderApplicationContextUserAction.PayNow,
    },
  };

  const response = await ordersController.createOrder({
    body: orderRequest,
    prefer: "return=representation",
  });

  const result = response.result;

  // Store the transaction in DB
  await db.paypalTransaction.create({
    data: {
      userId,
      credits,
      paypalOrderId: result.id!,
      status: "CREATED",
    },
  });

  // Find the approval URL
  const approvalUrl = result.links?.find(
    (link) => link.rel === "approve",
  )?.href;

  if (!approvalUrl) {
    throw new Error("PayPal approval URL not found");
  }

  return { orderId: result.id!, approvalUrl };
}

export async function capturePayPalOrder(orderId: string) {
  const client = getPayPalClient();
  const ordersController = new OrdersController(client);

  const response = await ordersController.captureOrder({
    id: orderId,
    prefer: "return=representation",
  });

  const result = response.result;

  if (result.status === "COMPLETED") {
    const purchaseUnit = result.purchaseUnits?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    const captureId = capture?.id;
    const userId = purchaseUnit?.customId;
    const creditsStr = purchaseUnit?.referenceId?.replace("credits-", "");
    const credits = Number(creditsStr);

    if (!userId || !credits) {
      throw new Error("Invalid payment data");
    }

    // Update the PayPal transaction
    await db.paypalTransaction.update({
      where: { paypalOrderId: orderId },
      data: {
        status: "COMPLETED",
        captureId: captureId ?? null,
      },
    });

    // Increment user credits
    await db.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: credits,
        },
      },
    });

    return { success: true, credits };
  }

  return { success: false, credits: 0 };
}
