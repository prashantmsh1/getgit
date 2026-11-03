"use client";

import React, { useState } from "react";
import useProjects from "@/hooks/use-project";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  RefreshCw,
  Coins,
  FilePlus2,
  FileMinus2,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function SyncProjectButton() {
  const { projectId, project } = useProjects();
  const refetch = useRefetch();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);

  const quoteQuery = api.project.getSyncQuote.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: open && !!projectId,
      refetchOnWindowFocus: false,
    },
  );

  const syncMutation = api.project.syncProject.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Sync initiated! ${data.chargedCredits} credits charged for ${data.changedFiles} file(s).`,
      );
      void utils.project.getSyncQuote.invalidate({
        projectId: projectId ?? "",
      });
      void utils.project.getMyCredits.invalidate();
      void utils.project.getCommits.invalidate({ projectId: projectId ?? "" });
      void refetch();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to trigger sync");
    },
  });

  if (!projectId || !project) {
    return null;
  }

  const quote = quoteQuery.data;
  const isUpToDate =
    quote && quote.filesToUpdate === 0 && quote.filesToDelete === 0;

  const handleSync = () => {
    syncMutation.mutate({ projectId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="hover:border-primary/50 hover:bg-primary/5 gap-1.5"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
          />
          <span>Sync</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="text-primary h-5 w-5" />
            Sync Project with GitHub
          </DialogTitle>
          <DialogDescription>
            Inspect the latest commit on branch{" "}
            <span className="text-foreground font-semibold">
              {project.branch || "main"}
            </span>{" "}
            and synchronize modified or deleted files.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {quoteQuery.isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Calculating repository diff and credit estimate...
              </p>
            </div>
          )}

          {quoteQuery.isError && (
            <div className="border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center">
              <AlertCircle className="text-destructive h-6 w-6" />
              <p className="text-destructive text-sm font-medium">
                {quoteQuery.error.message || "Could not fetch sync quote"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void quoteQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          )}

          {quote && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="border-border bg-muted/40 flex flex-col items-center justify-center rounded-xl border p-3 text-center">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <FilePlus2 className="h-4 w-4" />
                    <span>To update</span>
                  </div>
                  <span className="mt-1 text-2xl font-bold tabular-nums">
                    {quote.filesToUpdate}
                  </span>
                </div>

                <div className="border-border bg-muted/40 flex flex-col items-center justify-center rounded-xl border p-3 text-center">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    <FileMinus2 className="h-4 w-4" />
                    <span>To delete</span>
                  </div>
                  <span className="mt-1 text-2xl font-bold tabular-nums">
                    {quote.filesToDelete}
                  </span>
                </div>

                <div className="border-border bg-muted/40 flex flex-col items-center justify-center rounded-xl border p-3 text-center">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <FileCheck2 className="h-4 w-4" />
                    <span>Unchanged</span>
                  </div>
                  <span className="mt-1 text-2xl font-bold tabular-nums">
                    {quote.unchangedCount}
                  </span>
                </div>
              </div>

              <div className="bg-card rounded-xl border p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-500" />
                    Sync Cost
                  </span>
                  <span className="font-semibold tabular-nums">
                    {quote.creditCost} credit{quote.creditCost === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="tabular-nums">
                    {quote.userCredits} credits
                  </span>
                </div>

                {quote.canAfford && (
                  <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
                    <span>Balance after sync</span>
                    <span className="tabular-nums">
                      {quote.userCredits - quote.creditCost} credits
                    </span>
                  </div>
                )}
              </div>

              {isUpToDate && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    The repository is already up to date. No new embeddings need
                    to be computed.
                  </span>
                </div>
              )}

              {!quote.canAfford && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive flex flex-col gap-2 rounded-lg border p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      You don&apos;t have enough credits to sync this project.
                      Needed: <strong>{quote.creditCost}</strong>, available:{" "}
                      <strong>{quote.userCredits}</strong>.
                    </span>
                  </div>
                  <Link
                    href="/billing"
                    className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4"
                  >
                    Purchase more credits <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={syncMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSync}
            disabled={
              quoteQuery.isLoading ||
              !quote ||
              !quote.canAfford ||
              syncMutation.isPending
            }
          >
            {syncMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {syncMutation.isPending
              ? "Starting sync..."
              : isUpToDate
                ? "Re-sync (0 credits)"
                : `Sync Now (${quote?.creditCost ?? 0} credits)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
