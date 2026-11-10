"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Stripe from "stripe";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-fulfillment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function createCheckoutSession(credits: number) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Stripe checkout is not available.");
  }

  const { userId } = await auth();
  if (!userId) throw new Error("User not found");
  let sessionUrl: string;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `GetGit Credits - ${credits}`,
            },
            unit_amount: Math.round((credits / 50) * 100),
          },
          quantity: 1,
        },
      ],
      customer_creation: "always",
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      client_reference_id: userId,
      metadata: {
        credits: String(credits),
      },
    });
    sessionUrl = session.url!;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
  return redirect(sessionUrl);
}

export async function fulfillCheckoutSessionFromRedirect(sessionId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false as const, reason: "Not signed in." };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.client_reference_id !== userId) {
    return {
      ok: false as const,
      reason: "This payment belongs to another account.",
    };
  }

  return fulfillStripeCheckoutSession(session);
}
