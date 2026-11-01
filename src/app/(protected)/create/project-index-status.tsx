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
    description: "Indexing finished. You can open the dashboard.",
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
};

export function ProjectIndexStatus({
  projectId,
  projectName,
  onReady,
  onDismiss,
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

  const status = statusQuery.data?.status ?? "QUEUED";
  const meta = STATUS_META[status] ?? DEFAULT_STATUS_META;
  const isTerminal = status === "READY" || status === "FAILED";
  const onReadyRef = useRef(onReady);
  const notifiedReadyRef = useRef(false);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (status !== "READY" || notifiedReadyRef.current) return;
    notifiedReadyRef.current = true;
    onReadyRef.current?.();
  }, [status]);

  return (
    <div className="border-border bg-muted/30 mt-6 space-y-4 rounded-lg border p-4">
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

      {status === "FAILED" ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onDismiss}
        >
          Back to form
        </Button>
      ) : null}

      {status === "READY" ? (
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
