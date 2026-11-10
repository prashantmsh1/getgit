import { db } from "@/server/db";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-fulfillment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const result = await fulfillStripeCheckoutSession(session);

  if (!result.ok) {
    console.error("Stripe fulfillment failed:", session.id, result.reason);
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    message: result.alreadyFulfilled
      ? "Checkout already fulfilled"
      : "Credits added successfully",
    credits: result.credits,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  console.log("Stripe webhook event:", event.type);

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    return handleCheckoutCompleted(session);
  }

  return NextResponse.json({ received: true });
}
