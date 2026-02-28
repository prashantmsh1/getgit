// api/webhook/stripe/route.ts

import { db } from "@/server/db";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(request: NextRequest) {
  const body = await request.text();

  const signature = request.headers.get("Stripe-Signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;

  console.log("event type", event.type);

  if (event.type === "checkout.session.completed") {
    console.log("Checkout session completed:", session);
    const credits = Number(session.metadata?.credits);
    const userId = session.client_reference_id!;

    if (!userId || !credits) {
      console.error("User ID not found in session");
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 },
      );
    }

    await db.stripeTransaction.create({
      data: {
        userId,
        credits,
      },
    });

    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        credits: {
          increment: credits,
        },
      },
    });

    return NextResponse.json({ message: "Credits added successfully" });
  }

  return NextResponse.json({ message: "hello world" });
}
