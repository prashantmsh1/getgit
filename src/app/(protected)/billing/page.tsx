"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { api } from "@/trpc/react";
import {
  Coins,
  CreditCard,
  History,
  Info,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  createCheckoutSession,
  fulfillCheckoutSessionFromRedirect,
} from "@/lib/stripe";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const paypalOnly = process.env.NODE_ENV === "production";

function formatBillingDate(iso: Date | string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function kindLabel(kind: "PURCHASE" | "PROJECT_INDEX" | "REPO_SYNC"): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  switch (kind) {
    case "PURCHASE":
      return { label: "Purchase", variant: "default" };
    case "PROJECT_INDEX":
      return { label: "New project", variant: "secondary" };
    case "REPO_SYNC":
      return { label: "Sync", variant: "outline" };
    default:
      return { label: kind, variant: "outline" };
  }
}

const BillingPageContent = () => {
  const {
    data: overview,
    refetch,
    isLoading,
  } = api.project.getBillingOverview.useQuery();
  const [creditsToBuy, setCreditsToBuy] = useState<number[]>([100]);
  const [loading, setLoading] = useState(false);
  const [fulfillingPayment, setFulfillingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">(
    paypalOnly ? "paypal" : "stripe",
  );
  const creditsToBuyAmount = creditsToBuy[0]!;
  const searchParams = useSearchParams();
  const router = useRouter();
  const fulfilledSessionRef = useRef<string | null>(null);

  const price = (creditsToBuyAmount / 50).toFixed(2);
  const balance = overview?.credits ?? 0;
  const entries = overview?.entries ?? [];

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

  const handleBuy = async () => {
    setLoading(true);
    try {
      if (!paypalOnly && paymentMethod === "stripe") {
        await createCheckoutSession(creditsToBuyAmount);
        return;
      }

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
        toast.error(data.error ?? "Could not start PayPal checkout.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment could not be started. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-w-4xl flex-col gap-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Billing & credits
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {fulfillingPayment
            ? "Confirming your payment…"
            : "See your balance, buy more credits, and review recent activity."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <Coins className="h-5 w-5" aria-hidden />
              <CardTitle className="text-base font-semibold">
                Available credits
              </CardTitle>
            </div>
            <CardDescription className="text-emerald-700/90 dark:text-emerald-300/80">
              Each credit indexes one file. Your balance updates as you create
              projects and sync code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !overview ? (
              <p className="text-muted-foreground text-sm">Loading balance…</p>
            ) : (
              <>
                <p
                  className="text-4xl font-bold tracking-tight text-emerald-900 tabular-nums dark:text-emerald-100"
                  aria-live="polite"
                >
                  {balance.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-emerald-800/85 dark:text-emerald-200/80">
                  {balance === 0
                    ? "You’re out of credits — add some below to keep indexing."
                    : balance < 50
                      ? "Running low — consider topping up before your next big sync."
                      : "You’re in good shape for indexing and syncs."}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
              <CardTitle className="text-base font-semibold">
                How credits work
              </CardTitle>
            </div>
            <CardDescription>
              Simple: 1 file indexed = 1 credit. Purchases add to your balance;
              projects and syncs use credits automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            <ul className="list-inside list-disc space-y-1.5">
              <li>New project: we charge for every file in the repo once.</li>
              <li>
                Sync: you only pay for files that changed since the last index.
              </li>
              <li>Purchases appear instantly after payment completes.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-row items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
        <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex flex-col gap-1 leading-relaxed">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            Need help choosing how many to buy?
          </p>
          <p>
            Check how many files your repo has on GitHub — that’s roughly how
            many credits you’ll need for a first-time index. Ongoing syncs are
            usually much smaller.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buy credits</CardTitle>
          <CardDescription>
            {paypalOnly
              ? "Drag to choose an amount. Complete checkout with PayPal."
              : "Drag to choose an amount. Complete checkout with Stripe or PayPal."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-foreground text-sm font-medium">
                Package size
              </span>
              <span className="text-muted-foreground text-sm">
                <strong className="text-foreground tabular-nums">
                  {creditsToBuyAmount.toLocaleString()}
                </strong>{" "}
                credits · <strong className="text-foreground">${price}</strong>{" "}
                total
              </span>
            </div>
            <Slider
              defaultValue={[100]}
              max={1000}
              min={10}
              step={10}
              onValueChange={(value) => setCreditsToBuy(value)}
              value={creditsToBuy}
              className="w-full"
              disabled={fulfillingPayment}
              aria-label="Number of credits to purchase"
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-foreground text-sm font-medium">
              Payment method
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {!paypalOnly && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  className={`flex flex-1 items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                    paymentMethod === "stripe"
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                  }`}
                >
                  <CreditCard
                    className={`h-5 w-5 ${
                      paymentMethod === "stripe"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex flex-col items-start gap-0.5">
                    <span
                      className={`text-sm font-semibold ${
                        paymentMethod === "stripe"
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      Stripe
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Credit or debit card
                    </span>
                  </div>
                  {paymentMethod === "stripe" && (
                    <div className="bg-primary ml-auto h-3 w-3 rounded-full" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`flex flex-1 items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                  paymentMethod === "paypal"
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                }`}
              >
                <svg
                  className={`h-5 w-5 ${
                    paymentMethod === "paypal"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                </svg>
                <div className="flex flex-col items-start gap-0.5">
                  <span
                    className={`text-sm font-semibold ${
                      paymentMethod === "paypal"
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    PayPal
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Card or PayPal balance
                  </span>
                </div>
                {paymentMethod === "paypal" && (
                  <div className="bg-primary ml-auto h-3 w-3 rounded-full" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleBuy}
            className="w-fit bg-blue-600 font-medium text-white hover:bg-blue-700"
            disabled={loading || fulfillingPayment}
          >
            {loading
              ? "Opening checkout…"
              : `Buy ${creditsToBuyAmount.toLocaleString()} credits for $${price}`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="text-muted-foreground h-5 w-5" aria-hidden />
            <div>
              <CardTitle className="text-lg">Transaction history</CardTitle>
              <CardDescription>
                Recent credits added and spent. Newest first.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !overview ? (
            <p className="text-muted-foreground text-sm">Loading activity…</p>
          ) : entries.length === 0 ? (
            <div className="bg-muted/30 rounded-lg border border-dashed px-4 py-8 text-center">
              <p className="text-foreground font-medium">No activity yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                When you purchase credits or use them on a project, entries will
                show up here. Activity from before this feature was enabled may
                not be listed.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[32%]">What happened</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Balance after
                  </TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((row) => {
                  const isPositive = row.amount > 0;
                  const k = kindLabel(row.kind);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="leading-snug font-medium">
                            {row.title}
                          </span>
                          {row.detail ? (
                            <span className="text-muted-foreground max-w-[28rem] text-xs leading-snug">
                              {row.detail}
                            </span>
                          ) : null}
                          <span className="text-muted-foreground text-xs sm:hidden">
                            {formatBillingDate(row.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={k.variant}>{k.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-400"
                          }
                        >
                          {isPositive ? (
                            <Plus
                              className="mr-1 inline h-4 w-4 align-text-bottom"
                              aria-hidden
                            />
                          ) : (
                            <Minus
                              className="mr-1 inline h-4 w-4 align-text-bottom"
                              aria-hidden
                            />
                          )}
                          {isPositive ? "+" : ""}
                          {Math.abs(row.amount).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-right tabular-nums md:table-cell">
                        {row.balanceAfter.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-right text-sm whitespace-nowrap lg:table-cell">
                        {formatBillingDate(row.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BillingPage = () => (
  <Suspense
    fallback={<div className="text-muted-foreground p-8 text-sm">Loading billing…</div>}
  >
    <BillingPageContent />
  </Suspense>
);

export default BillingPage;
