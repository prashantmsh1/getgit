"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Info, CreditCard } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/stripe";

const BillingPage = () => {
  const { data: user } = api.project.getMyCredits.useQuery();
  const [creditsToBuy, setCreditsToBuy] = useState<number[]>([100]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">(
    "stripe",
  );
  const creditsToBuyAmount = creditsToBuy[0]!;

  const price = (creditsToBuyAmount / 50).toFixed(2);

  const handleBuy = async () => {
    setLoading(true);
    try {
      if (paymentMethod === "stripe") {
        await createCheckoutSession(creditsToBuyAmount);
      } else {
        const response = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credits: creditsToBuyAmount }),
        });

        const data = (await response.json()) as {
          approvalUrl?: string;
          error?: string;
        };

        if (data.approvalUrl) {
          window.location.href = data.approvalUrl;
        } else {
          console.error("PayPal order creation failed:", data.error);
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Billing
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You currently have {user?.credits} credits.
        </p>
      </div>

      <div className="flex flex-row items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
        <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex flex-col gap-1 leading-relaxed">
          <p>Each credit allows you to index 1 file in a repository.</p>
          <p>
            E.g. If your project has 100 files, you will need 100 credits to
            index it.
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-8">
        <Slider
          defaultValue={[100]}
          max={1000}
          min={10}
          step={10}
          onValueChange={(value) => setCreditsToBuy(value)}
          value={creditsToBuy}
          className="w-full"
        />

        {/* Payment Method Selector */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method
          </p>
          <div className="flex gap-3">
            {/* Stripe Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod("stripe")}
              className={`flex flex-1 items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                paymentMethod === "stripe"
                  ? "border-blue-600 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-900/20"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              }`}
            >
              <CreditCard
                className={`h-5 w-5 ${
                  paymentMethod === "stripe"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
              <div className="flex flex-col items-start gap-0.5">
                <span
                  className={`text-sm font-semibold ${
                    paymentMethod === "stripe"
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Stripe
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Credit / Debit Card
                </span>
              </div>
              {paymentMethod === "stripe" && (
                <div className="ml-auto h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>

            {/* PayPal Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod("paypal")}
              className={`flex flex-1 items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                paymentMethod === "paypal"
                  ? "border-blue-600 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-900/20"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              }`}
            >
              <svg
                className={`h-5 w-5 ${
                  paymentMethod === "paypal"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
              </svg>
              <div className="flex flex-col items-start gap-0.5">
                <span
                  className={`text-sm font-semibold ${
                    paymentMethod === "paypal"
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  PayPal
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Credit Card/Debit Card / PayPal Account
                </span>
              </div>
              {paymentMethod === "paypal" && (
                <div className="ml-auto h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          </div>
        </div>

        <Button
          onClick={handleBuy}
          className="w-fit bg-blue-600 font-medium text-white hover:bg-blue-700"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : `Buy ${creditsToBuyAmount} credits for $${price}`}
        </Button>
      </div>
    </div>
  );
};

export default BillingPage;
