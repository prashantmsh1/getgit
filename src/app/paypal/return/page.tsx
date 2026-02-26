"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const PayPalReturnContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    const captureOrder = async () => {
      try {
        const response = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: token }),
        });

        const data = (await response.json()) as {
          credits?: number;
          error?: string;
        };

        if (response.ok && data.credits) {
          setCredits(data.credits);
          setStatus("success");
          setTimeout(() => {
            router.push("/create");
          }, 2000);
        } else {
          console.error("Capture failed:", data.error);
          setStatus("error");
        }
      } catch (error) {
        console.error("Error capturing PayPal order:", error);
        setStatus("error");
      }
    };

    void captureOrder();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      {status === "processing" && (
        <>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Processing your payment...
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please wait while we confirm your PayPal payment.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Successful!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {credits} credits have been added to your account. Redirecting...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Failed
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Something went wrong with your payment. Please try again.
          </p>
          <button
            onClick={() => router.push("/billing")}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Billing
          </button>
        </>
      )}
    </div>
  );
};

const PayPalReturnPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Loading...
          </h2>
        </div>
      }
    >
      <PayPalReturnContent />
    </Suspense>
  );
};

export default PayPalReturnPage;
