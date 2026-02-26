"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function createCheckoutSession(credits: number) {
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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/create`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      client_reference_id: userId.toString(),
      metadata: {
        credits,
      },
    });
    sessionUrl = session.url!;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
  return redirect(sessionUrl);
}
