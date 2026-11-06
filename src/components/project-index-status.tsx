"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/trpc/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

const DEFAULT_STATUS_META = {
  label: "Queued",
  progress: 12,
  description: "Your project is waiting to start indexing.",
} as const;

const STATUS_META: Record<
  string,
  { label: string; progress: number; description: string }
> = {
  QUEUED: DEFAULT_STATUS_META,
  SUMMARIZING: {
    label: "Summarizing",
    progress: 45,
    description: "Reading files and summarizing code with AI.",
  },
  EMBEDDING: {
    label: "Embedding",
    progress: 72,
    description: "Saving searchable embeddings for Q&A.",
  },
  READY: {
    label: "Ready",
    progress: 100,
    description: "Indexing finished. You can use Q&A and meetings.",
  },
  FAILED: {
    label: "Failed",
    progress: 0,
    description: "Something went wrong while indexing this project.",
  },
};

type Props = {
  projectId: string;
  projectName: string;
  onReady?: () => void;
  onDismiss?: () => void;
  /** When true, nothing is rendered after indexing succeeds */
  hideWhenReady?: boolean;
  /** Show CTA to open the project dashboard (create flow) */
  showDashboardLink?: boolean;
  failedActionLabel?: string;
};

export function ProjectIndexStatus({
  projectId,
  projectName,
  onReady,
  onDismiss,
  hideWhenReady = false,
  showDashboardLink = false,
  failedActionLabel = "Back to form",
}: Props) {
  const statusQuery = api.project.getIndexStatus.useQuery(
    { projectId },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "READY" || status === "FAILED") {
          return false;
        }
        return 2000;
      },
    },
  );

  const onReadyRef = useRef(onReady);
  const notifiedReadyRef = useRef(false);
  onReadyRef.current = onReady;

  const status = statusQuery.data?.status ?? "QUEUED";

  useEffect(() => {
    if (status !== "READY" || notifiedReadyRef.current) return;
    notifiedReadyRef.current = true;
    onReadyRef.current?.();
  }, [status]);

  if (statusQuery.isLoading) {
    return null;
  }

  if (statusQuery.isSuccess && !statusQuery.data) {
    return null;
  }

  const meta = STATUS_META[status] ?? DEFAULT_STATUS_META;
  const isTerminal = status === "READY" || status === "FAILED";

  if (hideWhenReady && status === "READY") {
    return null;
  }

  return (
    <div className="border-border bg-muted/30 space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Indexing {projectName}</p>
          <p className="text-muted-foreground mt-1 text-sm">{meta.description}</p>
        </div>
        <Badge
          variant={
            status === "FAILED"
              ? "destructive"
              : status === "READY"
                ? "secondary"
                : "outline"
          }
        >
          {status === "READY" ? (
            <CheckCircle2 />
          ) : status === "FAILED" ? (
            <AlertCircle />
          ) : (
            <Loader2 className="animate-spin" />
          )}
          {meta.label}
        </Badge>
      </div>

      <Progress value={meta.progress} className="h-2" />

      {statusQuery.data?.totalFiles ? (
        <p className="text-muted-foreground text-xs">
          {statusQuery.data.totalFiles} files in this repository
        </p>
      ) : null}

      {status === "FAILED" && statusQuery.data?.errorMessage ? (
        <p className="text-destructive text-sm">{statusQuery.data.errorMessage}</p>
      ) : null}

      {status === "FAILED" && onDismiss ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onDismiss}
        >
          {failedActionLabel}
        </Button>
      ) : null}

      {status === "READY" && showDashboardLink ? (
        <Button asChild className="w-full">
          <Link href={`/dashboard?projectId=${projectId}`}>Open dashboard</Link>
        </Button>
      ) : null}

      {!isTerminal && statusQuery.isFetching ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 className="size-3 animate-spin" />
          Updating status…
        </p>
      ) : null}
    </div>
  );
}

export function useProjectIndexReady(projectId: string | undefined) {
  const statusQuery = api.project.getIndexStatus.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: !!projectId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "READY" || status === "FAILED") {
          return false;
        }
        return 2000;
      },
    },
  );

  const status = statusQuery.data?.status;
  const hasIndexJob = statusQuery.data != null;
  const isReady =
    status === "READY" || (statusQuery.isSuccess && !hasIndexJob);
  const isIndexing =
    !!projectId &&
    hasIndexJob &&
    !!status &&
    status !== "READY" &&
    status !== "FAILED";

  return {
    status,
    isIndexing,
    isReady,
    ...statusQuery,
  };
}
