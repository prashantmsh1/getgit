"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { api } from "@/trpc/react";
import { Coins, History, Info, Minus, Plus, Sparkles } from "lucide-react";
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

function formatBillingDate(iso: Date | string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function kindLabel(
  kind: "PURCHASE" | "PROJECT_INDEX" | "REPO_SYNC",
): { label: string; variant: "default" | "secondary" | "outline" } {
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
  const { data: overview, refetch, isLoading } =
    api.project.getBillingOverview.useQuery();
  const [creditsToBuy, setCreditsToBuy] = useState<number[]>([100]);
  const [loading, setLoading] = useState(false);
  const [fulfillingPayment, setFulfillingPayment] = useState(false);
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
              <p className="text-sm text-muted-foreground">Loading balance…</p>
            ) : (
              <>
                <p
                  className="text-4xl font-bold tabular-nums tracking-tight text-emerald-900 dark:text-emerald-100"
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
          <CardContent className="text-sm text-muted-foreground">
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
            Drag to choose an amount. You’ll complete checkout securely with
            Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                Package size
              </span>
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground tabular-nums">
                  {creditsToBuyAmount.toLocaleString()}
                </strong>{" "}
                credits ·{" "}
                <strong className="text-foreground">${price}</strong> total
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
              ? "Opening checkout…"
              : `Buy ${creditsToBuyAmount.toLocaleString()} credits for $${price}`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" aria-hidden />
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
            <p className="text-sm text-muted-foreground">Loading activity…</p>
          ) : entries.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
              <p className="font-medium text-foreground">No activity yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
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
                  <TableHead className="text-right hidden md:table-cell">
                    Balance after
                  </TableHead>
                  <TableHead className="text-right hidden lg:table-cell">
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
                          <span className="font-medium leading-snug">
                            {row.title}
                          </span>
                          {row.detail ? (
                            <span className="text-xs text-muted-foreground leading-snug max-w-[28rem]">
                              {row.detail}
                            </span>
                          ) : null}
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {formatBillingDate(row.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={k.variant}>{k.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
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
                      <TableCell className="text-right tabular-nums text-muted-foreground hidden md:table-cell">
                        {row.balanceAfter.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm hidden lg:table-cell whitespace-nowrap">
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
    fallback={
      <div className="p-8 text-sm text-gray-500">Loading billing…</div>
    }
  >
    <BillingPageContent />
  </Suspense>
);

export default BillingPage;
