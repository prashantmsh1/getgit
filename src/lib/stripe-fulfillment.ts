import { db } from "@/server/db";
import type Stripe from "stripe";

export type FulfillCheckoutResult =
  | { ok: true; credits: number; alreadyFulfilled?: boolean }
  | { ok: false; reason: string };

export async function fulfillStripeCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillCheckoutResult> {
  if (session.payment_status !== "paid") {
    return { ok: false, reason: "Payment is not completed yet." };
  }

  const userId = session.client_reference_id;
  const credits = Number(session.metadata?.credits);

  if (!userId || !Number.isFinite(credits) || credits <= 0) {
    return { ok: false, reason: "Checkout session is missing user or credits." };
  }

  const existing = await db.stripeTransaction.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true, credits: true },
  });

  if (existing) {
    return {
      ok: true,
      credits: existing.credits,
      alreadyFulfilled: true,
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return { ok: false, reason: "User account not found. Try signing in again." };
  }

  await db.$transaction([
    db.stripeTransaction.create({
      data: {
        userId,
        credits,
        stripeSessionId: session.id,
      },
    }),
    db.user.update({
      where: { id: userId },
      data: {
        credits: { increment: credits },
      },
    }),
  ]);

  return { ok: true, credits };
}
