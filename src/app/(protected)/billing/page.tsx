"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { api } from "@/trpc/react";
import { Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  createCheckoutSession,
  fulfillCheckoutSessionFromRedirect,
} from "@/lib/stripe";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const BillingPageContent = () => {
  const { data: user, refetch } = api.project.getMyCredits.useQuery();
  const [creditsToBuy, setCreditsToBuy] = useState<number[]>([100]);
  const [loading, setLoading] = useState(false);
  const [fulfillingPayment, setFulfillingPayment] = useState(false);
  const creditsToBuyAmount = creditsToBuy[0]!;
  const searchParams = useSearchParams();
  const router = useRouter();
  const fulfilledSessionRef = useRef<string | null>(null);

  const price = (creditsToBuyAmount / 50).toFixed(2);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || fulfilledSessionRef.current === sessionId) {
      return;
    }

    fulfilledSessionRef.current = sessionId;
    setFulfillingPayment(true);

    void fulfillCheckoutSessionFromRedirect(sessionId)
      .then((result) => {
        if (!result.ok) {
          toast.error(result.reason);
          return;
        }

        if (result.alreadyFulfilled) {
          toast.message("Payment already applied to your account.");
        } else {
          toast.success(`Added ${result.credits} credits to your account.`);
        }

        void refetch();
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Could not apply payment.";
        toast.error(message);
      })
      .finally(() => {
        setFulfillingPayment(false);
        router.replace("/billing");
      });
  }, [searchParams, refetch, router]);

  return (
    <div className="flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Billing
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {fulfillingPayment
            ? "Confirming your payment…"
            : `You currently have ${user?.credits ?? 0} credits.`}
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
          disabled={fulfillingPayment}
        />

        <Button
          onClick={async () => {
            setLoading(true);
            await createCheckoutSession(creditsToBuyAmount);
            setLoading(false);
          }}
          className="w-fit bg-blue-600 font-medium text-white hover:bg-blue-700"
          disabled={loading || fulfillingPayment}
        >
          {loading
            ? "Loading..."
            : `Buy ${creditsToBuyAmount} credits for $${price}`}
        </Button>
      </div>
    </div>
  );
};

const BillingPage = () => (
  <Suspense
    fallback={
      <div className="p-8 text-sm text-gray-500">Loading billing…</div>
    }
  >
    <BillingPageContent />
  </Suspense>
);

export default BillingPage;
