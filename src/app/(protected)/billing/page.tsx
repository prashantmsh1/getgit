"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/stripe";

const BillingPage = () => {
  const { data: user } = api.project.getMyCredits.useQuery();
  const [creditsToBuy, setCreditsToBuy] = useState<number[]>([100]);
  const [loading, setLoading] = useState(false);
  const creditsToBuyAmount = creditsToBuy[0]!;

  const price = (creditsToBuyAmount / 50).toFixed(2);

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

        <Button
          onClick={async () => {
            setLoading(true);
            await createCheckoutSession(creditsToBuyAmount);
            setLoading(false);
          }}
          className="w-fit bg-blue-600 font-medium text-white hover:bg-blue-700"
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : `Buy ${creditsToBuyAmount} credits for ${price}`}
        </Button>
      </div>
    </div>
  );
};

export default BillingPage;
