import 'dotenv/config';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim() || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

async function test() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `GetGit Credits - 100`,
            },
            unit_amount: 200,
          },
          quantity: 1,
        },
      ],
      customer_creation: "always",
      mode: "payment",
      success_url: `${APP_URL}/create`,
      cancel_url: `${APP_URL}/billing`,
      client_reference_id: "test",
      metadata: { credits: 100 },
    });
    console.log("Success:", session.url);
  } catch (error) {
    console.error("Stripe API Error:", error.message);
  }
}
test();
